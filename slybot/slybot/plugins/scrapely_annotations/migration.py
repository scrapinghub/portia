"""Migrate existing samples to most current slybot version.

Convert tagid to selector
    1. Add tagids
    2. Load page in lxml
    3. for each annotation
    4.     find element by tagid
    5.     get unique selector for tagid
    6.     save unique selector

Handle variants
    1. Find matching variants
    2. Find selector for each matching variant
    3. Find common parent
    4. Find repeated parent
    5. Assign to parent field called variant

Handle generated annotations
    1. Find element referred to by annotation
    2. Find text for element
    3. Find text for annotation
    3. Remove extra annotation metadata
"""
import copy
import json
import re

import slybot

from itertools import chain, groupby
from operator import itemgetter
from urllib import unquote
from uuid import uuid4

from lxml.etree import _Element, Comment
from scrapy import Selector

from slybot.plugins.scrapely_annotations.utils import add_tagids
SLYBOT_VERSION = slybot.__version__
IGNORE_ATTRIBUTES = ['data-scrapy-ignore', 'data-scrapy-ignore-beneath']


def short_guid():
    return '-'.join(str(uuid4()).split('-')[1:4])


def gen_id(disallow=None):
    if disallow is not None:
        disallow = set(disallow)
    else:
        disallow = []
    _id = short_guid()
    while _id in disallow:
        _id = short_guid()
    return _id


def port_sample(sample, schemas=None, extractors=None):
    """Convert slybot samples made before slybot 0.13 to new format."""
    if schemas is None:
        schemas = {}
    if extractors is None:
        extractors = {}
    container_id = gen_id()
    default_annotations = [_create_container('body', container_id)]
    if not sample.get('annotated_body') and not sample.get('plugins'):
        sample['plugins'] = {
            'annotations-plugin': {
                'extracts': default_annotations
            }
        }
        return sample
    if not sample.get('plugins'):
        sample['plugins'] = load_annotations(sample.get('annotated_body', u''))
    sample.pop('annotated_body', None)

    # Group annotations by type
    annotations = sample['plugins']['annotations-plugin']['extracts']
    try:
        sel = Selector(text=add_tagids(sample['original_body']))
    except KeyError:
        annotated = sample.get('annotated_body', u'')
        sample['original_body'] = annotated
        try:
            tagged = add_tagids(annotated)
        except KeyError:
            tagged = u''
        sel = Selector(text=tagged)
    annotations = port_standard(annotations, sel, sample)
    standard_annos, generated_annos, variant_annos = [], [], []
    for a in annotations:
        if a.get('generated'):
            generated_annos.append(a)
        elif a.get('variants', 0) > 0:
            variant_annos.append(a)
        else:
            standard_annos.append(a)
    if not annotations:
        sample['plugins'] = {
            'annotations-plugin': {
                'extracts': default_annotations
            }
        }
        return sample
    new_annotations = []
    a = find_element(annotations[0], sel)
    for b in annotations[1:]:
        b = find_element(b, sel)
        a = find_common_parent(a, b)
    parent = a.getparent()
    container = _create_container(
        a if parent is None else parent, container_id, selector=sel)
    new_annotations.append(container)
    for a in standard_annos:
        a.pop('variant', None)
    new_annotations.extend(standard_annos)
    new_annotations.extend(port_generated(generated_annos, sel))
    new_annotations.extend(port_variants(variant_annos, sel))
    for a in new_annotations:
        if not (a.get('item_container') and a.get('container_id')):
            a['container_id'] = container_id
        a.pop('tagid', None) or a.pop('data-tagid', None)
    # Update annotations
    sample['plugins']['annotations-plugin']['extracts'] = new_annotations
    sample['version'] = SLYBOT_VERSION
    schema_id = guess_schema(sample, schemas)
    container['schema_id'] = schema_id
    return sample


def find_element(tagid, sel):
    """Find an element by its tagid."""
    if isinstance(tagid, _Element):
        return tagid
    if isinstance(tagid, dict):
        tagid = tagid.get('tagid')
    elements = sel.xpath('//*[@data-tagid="%s"]' % tagid)
    if elements:
        return elements[0].root


def css_escape(s):
    """from http://mathiasbynens.be/notes/css-escapes"""
    s = re.sub(r'(^-$|[ !"#\$%&\'()*+,./:;<=>?@\[\\\]^`{|}~])', r'\\\1', s)
    s = re.sub(r'^(-?)(\d)', lambda m: '%s\%x ' % (m.group(1), ord(m.group(2))), s)
    s = re.sub(r'([\t\n\v\f\r])', lambda m: '\%x ' % ord(m.group(1)), s)
    return s


def find_css_selector(elem, sel, depth=0, previous_tbody=False):
    """Find a unique selector for an element.

    Adapted from mozilla findCssSelector in css-logic.js
    http://lxr.mozilla.org/mozilla-release/source/toolkit/devtools/styleinspector/css-logic.js
    """
    def children_index(elem):
        parent = elem.getparent()
        if parent is not None:
            children = filter(lambda x: x.tag is not Comment,
                              parent.getchildren())
            index = children.index(elem) + 1
        else:
            index = 0
        return index

    def build_table_selector(elem):
        parent = find_css_selector(elem.getparent(), sel, depth + 1)
        join = '' if previous_tbody else ' >'
        selector = '%s%s %s:nth-child(%s)' % (
            parent, join, tag_name, children_index(elem)
        )
        e = sel.css(selector)
        if not e:
            join = '' if previous_tbody or tag_name == 'tr' else ' >'
            selector = '%s%s %s:nth-child(%s)' % (
                parent, join, tag_name, children_index(elem))
        return selector

    elem_id = elem.attrib.get('id')
    if elem_id:
        id_selector = '#%s' % css_escape(elem_id)
        if len(sel.css(id_selector)) == 1 and depth <= 1:
            return id_selector

    # Inherently unique by tag name
    tag_name = elem.tag
    for tag in ('html', 'head', 'body'):
        if tag_name == tag:
            return tag

    # We might be able to find a unique class name
    classes = elem.get('class', '').split()
    if classes:
        for class_name in classes:
            selector = '.%s' % css_escape(class_name)
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector
            # Maybe it's unique with a tag name?
            selector = tag_name + selector
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector
            # Maybe it's unique using a tag name and nth-child
            selector = '%s:nth-child(%s)' % (selector, children_index(elem))
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector

    # Not unique enough yet.  As long as it's not a child of the document,
    # continue recursing up until it is unique enough.
    if elem.getparent() is not None:
        if tag_name in ('thead', 'tbody'):
            selector = find_css_selector(elem.getparent(), sel, depth + 1,
                                         True)
        else:
            selector = build_table_selector(elem)
    return selector


def find_common_parent(a, b):
    """Find a common parent for 2 elements."""
    a_parents = list(a.iterancestors())
    b_parents = list(b.iterancestors())
    a_parents_set = set(a_parents)
    b_parents_set = set(b_parents)
    if a == b:
        return a
    if b in a_parents_set:
        return b
    if a in b_parents_set:
        return a
    if len(a_parents) < len(b_parents):
        for elem in a_parents:
            if elem == b or elem in b_parents_set:
                return elem
    else:
        for elem in b_parents:
            if elem == a or elem in a_parents_set:
                return elem


def port_variants(variant_annotations, sel):
    """Port variant annotations to the MIE annotations."""
    # Group variants
    grouper = itemgetter('variants')
    grouped_variants = [(vid, list(grp))
                        for vid, grp in groupby(variant_annotations, grouper)]
    adjacent_variants = set()
    # Eliminate non adjacent variants
    for variant_id, _ in grouped_variants:
        if not variant_id:
            continue
        if variant_id in adjacent_variants:
            adjacent_variants.remove(variant_id)
        else:
            adjacent_variants.add(variant_id)
    # Remove non sequential variants
    grouped_variants = [(vid, variant) for vid, variant in grouped_variants
                        if variant_id in adjacent_variants and variant]
    annotations = []
    for first, last in zip(*[iter(grouped_variants)] * 2):
        siblings = 0
        repeated_container = _get_parent(first, sel)
        last_shared_parent = _get_parent(last, sel)
        container = find_common_parent(repeated_container, last_shared_parent)
        if repeated_container == container:
            repeated_container, siblings = _get_parent_and_siblings(first,
                                                                    container,
                                                                    sel)
        container_id = gen_id()
        for annotation in first:
            annotation['container_id'] = container_id
            del annotation['variant']
        annotations.extend(first)
        annotations.append(_create_container(container, container_id,
                                             field='variants', selector=sel))
        annotations.append(_create_container(repeated_container, container_id,
                                             repeated=True, siblings=siblings,
                                             selector=sel))
    return variant_annotations


def _get_parent(annotations, sel):
    parent = annotations[0]
    parent_element = find_element(parent, sel)
    if len(annotations) == 1:
        return parent_element.getparent()
    for annotation in annotations[1:]:
        annotation_element = find_element(annotation, sel)
        parent_element = find_common_parent(parent_element, annotation_element)
    return parent_element


def _get_parent_and_siblings(annotations, upto, sel):
    # Find deepest parents at same depth from shared parent which are siblings
    highest = _get_highest(annotations, upto, sel)
    highest_reverse = _get_highest(list(reversed(annotations)), upto, sel)
    parent_siblings = [set(highest_reverse.getparent().getchildren())]
    for parent in highest_reverse.iterancestors():
        if parent == upto:
            break
        parent_siblings.append(set(parent.getparent().getchildren()))
    for element in chain((highest,), highest.iterancestors()):
        for siblings_set in parent_siblings:
            if element in siblings_set:
                highest = element
                break
    # Find distance between those siblings
    siblings = highest.getparent().getchildren()
    siblings_set = set(siblings)
    max_sibling = 0
    for annotation in annotations:
        parents = set(find_element(annotation, sel).iterancestors())
        intersection = parents & siblings_set
        if not intersection:
            continue
        try:
            sibling = siblings.index(list(intersection)[0])
        except ValueError:
            continue
        if sibling > max_sibling:
            max_sibling = sibling
    return highest, sibling


def _get_highest(annotations, upto, sel):
    highest = find_element(annotations[0], sel)
    for annotation in annotations[1:]:
        element = find_element(annotation, sel)
        next = find_common_parent(highest, element)
        if next == upto:
            break
        highest = next
    return highest


def _create_container(element, container_id, repeated=False, siblings=0,
                      field=None, selector=None):
    if isinstance(element, str):
        s = element
    else:
        s = find_css_selector(element, selector)
    data = {
        'id': '%s%s' % (container_id, '#parent' if repeated else ''),
        'accept_selectors': [s],
        'reject_selectors': [],
        'selector': s,
        'item_container': True,
        'repeated': repeated,
        'required': [],
        'siblings': siblings,
        'annotations': {'#portia-content': '#dummy'},
        'text-content': '#portia-content',
    }
    if repeated:
        data['container_id'] = container_id
    if hasattr(element, 'attrib') and 'data-tagid' in element.attrib:
        data['data-tagid'] = element.attrib['data-tagid']
    if field:
        data['field'] = field
    return data


def _add_annotation_data(annotation, sample, extractors):
    if 'data' in annotation:
        return annotation
    annotations = sample['plugins']['annotations-plugin']['extracts']
    existing_ids = {i for a in annotations for i in a.get('data', [])}
    annotation['data'] = {}
    for attribute, field in annotation.get('annotations', {}).items():
        if field == '#dummy':
            continue
        _id = gen_id(disallow=existing_ids)
        extractors = [e for e in sample.get('extractors', {}).get(field, [])
                      if e in extractors]
        annotation['data'][_id] = {
            'attribute': attribute,
            'field': field,
            'required': field in annotation.get('required', []),
            'extractors': extractors
        }
    return annotation


def port_generated(generated_annotations, sel):
    """Port generated annotations to annotations with custom extractors."""
    for annotation in generated_annotations:
        # Find pre and post text
        _slice = annotation.get('slice')
        if not annotation.get('tagid') or not _slice or len(_slice) != 2:
            continue
        element = find_element(annotation, sel)
        if element is None:
            continue
        pre_text, post_text = '', ''
        if annotation.get('insert_after'):
            selector = find_css_selector(element.getparent(), sel)
            if not selector:
                continue
            annotation['accept_selectors'] = [selector]
            annotation['selector'] = selector
            siblings = list(element.getparent().iterchildren())
            start = siblings.index(element)

            def process_siblings(others, reverse=False):
                text = []
                order = ('tail', 'text') if reverse else ('text', 'tail')
                for elem in others:
                    for t in order:
                        text.append(getattr(elem, t) or ' ')
                    if any(t.strip() for t in text):
                        break
                return ''.join(text)
            pre_text = process_siblings(
                siblings[start - 1: 0: -1] + [siblings[0]], True)
            post_text = process_siblings(siblings[start + 1:], 1)
            text = element.tail
        else:
            text = element.text
        text = (text or '').strip()
        data = annotation['data']
        contentf = annotation.get('text-content', 'content')
        for anno in (a for a in data.values() if a['attribute'] == contentf):
            pre_text = (pre_text + text[0:_slice[0]]).strip()
            post_text = (text[_slice[1]:] + post_text).strip()
            if anno and pre_text or post_text:
                anno['pre_text'] = pre_text
                anno['post_text'] = post_text
        # Create new text region field
        annotation.pop('variant', None)
        del annotation['slice']
    return generated_annotations


def port_standard(standard_annotations, sel, sample, extractors):
    """Add accept selectors for existing annotations."""
    new_annotations = []
    for annotation in standard_annotations:
        if not annotation.get('tagid'):
            continue
        element = find_element(annotation, sel)
        if element is None:
            continue
        selector = find_css_selector(element, sel)
        if not selector:
            continue
        annotation['accept_selectors'] = [selector]
        annotation['selector'] = selector
        annotation['reject_selectors'] = []
        annotation = _add_annotation_data(annotation, sample, extractors)
        for _id, data in annotation.get('data', {}).items():
            a = copy.deepcopy(annotation)
            a['id'] = gen_id()
            a['data'] = {
                gen_id(): data
            }
            new_annotations.append(a)
    return new_annotations


def load_annotations(body):
    """Create slybot annotations from annotated html."""
    if not body:
        return {'annotations-plugin': {'extracts': []}}
    sel = Selector(text=add_tagids(body))
    existing_ids = set()
    annotations = []
    for elem in sel.xpath('//*[@data-scrapy-annotate]'):
        attributes = elem.root.attrib
        annotation = json.loads(unquote(attributes['data-scrapy-annotate']))
        if (isinstance(elem.root, _Element) and
                elem.root.tag.lower() == 'ins'):
            annotation.update(find_generated_annotation(elem))
        else:
            annotation['tagid'] = attributes.get('data-tagid')
        if 'id' not in annotation:
            annotation['id'] = gen_id(disallow=existing_ids)
        existing_ids.add(annotation['id'])
        annotations.append(annotation)
    for elem in sel.xpath('//*[@%s]' % '|@'.join(IGNORE_ATTRIBUTES)):
        attributes = elem.root.attrib
        for attribute in IGNORE_ATTRIBUTES:
            if attribute in attributes:
                break
        ignore = {attribute[len('data-scrapy-'):]: True}
        if 'id' not in ignore:
            ignore['id'] = gen_id(disallow=existing_ids)
        existing_ids.add(ignore['id'])
        annotations.append(ignore)
    return {'annotations-plugin': {'extracts': annotations}}


def find_generated_annotation(elem):
    """Find annotation information for generated element."""
    elem = elem.root
    previous = elem.getprevious()
    insert_after = True
    nodes = []
    if previous is None:
        previous = elem.getparent()
        nodes = [previous] + previous.getchildren()
        insert_after = False
    else:
        while (previous is not None and isinstance(previous, _Element) and
                previous.tag.lower() == 'ins'):
            previous = previous.getprevious()
        if previous is None:
            previous = elem.getparent()
            insert_after = False
            node = previous.getchildren()[0]
        else:
            node = previous
        while node is not None:
            nodes.append(node)
            node = node.getnext()
            if (node is None or
                    isinstance(node, _Element) and node.tag.lower() == 'ins'):
                nodes.append(node)
                break
    annotation = {
        'tagid': previous.attrib.get('data-tagid'),
        'generated': True,
        'insert_after': insert_after
    }
    last_node_ins = False
    start = 0
    # Calculate the length and start position of the slice ignoring the ins
    # tag and with leading whitespace removed
    for node in nodes:
        if (node is not None and isinstance(node, _Element) and
                node.tag.lower() == 'ins'):
            last_node_ins = True
            if node == elem:
                annotation['slice'] = start, start + len(node.text)
            else:
                start += len(node.text)
        else:
            text = node.tail if annotation['insert_after'] else node.text
            text = '' if text is None else text
            if not last_node_ins:
                text = text.lstrip()
            start += len(text)
            last_node_ins = False
    return annotation


def guess_schema(sample, schemas):
    # If project has no schemas just return default value
    if not schemas:
        return 'default'

    # Check if scrapes exists
    schema_id = sample.get('scrapes')
    if schema_id and schema_id in schemas:
        return schema_id

    # Check if a schema is explicitly mentioned
    annotations = sample['plugins']['annotations-plugin']['extracts']
    annotations_with_schemas = [a for a in annotations if 'schema_id' in a]
    if annotations_with_schemas:
        parent = sorted(annotations_with_schemas, key=container_id_key)[0]
        return parent['schema_id']

    # Look for a schema with matching fields
    fields = set()
    for annotation in annotations:
        try:
            fields.add(list(annotation['data'].values())[0]['field'])
        except KeyError:
            pass
    scores = {}
    fields = set()
    for schema_id, schema in schemas.items():
        scores[schema_id] = len(set(schema.get('fields')) & fields)
    if any(score > 0 for score in scores.values()):
        return max(scores.items(), key=itemgetter(1))[0]

    # Use default if it is available
    if 'default' in schemas:
        return 'default'

    # Use the schema with the most fields
    schemas = sorted(
        schemas.items(), key=lambda (k, v): len(v.get('fields', {})))
    return schemas[-1][0]


def container_id_key(annotation):
    container_id = annotation.get('', 'z' * 19)
    if container_id is None:
        return ''
    return container_id
