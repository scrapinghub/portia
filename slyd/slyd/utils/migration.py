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
import json

from itertools import chain, groupby
from operator import itemgetter
from urllib import unquote

from lxml.etree import _Element
from scrapy import Selector

from .projects import gen_id
from slybot.plugins.scrapely_annotations.utils import add_tagids
IGNORE_ATTRIBUTES = ['data-scrapy-ignore', 'data-scrapy-ignore-beneath']


def port_sample(sample):
    """Convert slybot samples made before slybot 0.13 to new format."""
    if not sample.get('annotated_body'):
        return sample  # Handle empty body
    if not sample.get('plugins'):
        sample['plugins'] = load_annotations(sample.get('annotated_body', u''))
    del sample['annotated_body']

    # Group annotations by type
    annotations = sample['plugins']['annotations-plugin']['extracts']
    sel = Selector(text=add_tagids(sample['original_body']))
    annotations = port_standard(annotations, sel, sample)
    standard_annos, generated_annos, variant_annos = [], [], []
    for a in annotations:
        if a.get('generated'):
            generated_annos.append(a)
        elif a.get('variant', 0) > 0:
            variant_annos.append(a)
        else:
            standard_annos.append(a)
    new_annotations = []
    new_annotations.extend(standard_annos)
    new_annotations.extend(port_generated(generated_annos, sel))
    new_annotations.extend(port_variants(variant_annos, sel))

    # Update annotations
    sample['plugins']['annotations-plugin']['extracts'] = new_annotations
    return sample


def find_element(tagid, sel):
    """Find an element by its tagid."""
    if isinstance(tagid, _Element):
        return tagid
    if isinstance(tagid, dict):
        tagid = tagid.get('tagid')
    elements = sel.xpath('//*[@data-tagid="%s"]' % tagid)
    if elements:
        return elements[0]._root


def find_css_selector(elem, sel, depth=0):
    """Find a unique selector for an element.

    Adapted from mozilla findCssSelector in css-logic.js
    http://lxr.mozilla.org/mozilla-release/source/toolkit/devtools/styleinspector/css-logic.js
    """
    elem_id = elem.attrib.get('id')
    if elem_id and len(sel.css('#%s' % elem_id)) == 1 and depth > 1:
        return '#%s' % elem_id

    # Inherently unique by tag name
    tag_name = elem.tag
    for tag in ('html', 'head', 'body'):
        if tag_name == tag:
            return tag

    # We might be able to find a unique class name
    classes = elem.get('class', '').split()
    if classes:
        for class_name in classes:
            selector = '.%s' % class_name
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector
            # Maybe it's unique with a tag name?
            selector = tag_name + selector
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector
            # Maybe it's unique using a tag name and nth-child
            index = elem.getparent().getchildren().index(elem)
            selector = '%s:nth-child(%s)' % (selector, index)
            matches = sel.css(selector)
            if len(matches) == 1:
                return selector

    # Not unique enough yet.  As long as it's not a child of the document,
    # continue recursing up until it is unique enough.
    if elem.getparent() is not None:
        index = elem.getparent().getchildren().index(elem) + 1
        if tag_name in ('thead', 'tbody'):
            selector = find_css_selector(elem.getparent(), sel, depth + 1)
        else:
            selector = '%s > %s:nth-child(%s)' % (
                find_css_selector(elem.getparent(), sel, depth + 1),
                tag_name,
                index
            )
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
    s = find_css_selector(element, selector)
    data = {
        'id': '%s%s' % (container_id, '' if repeated else '#parent'),
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
    if 'data-tagid' in element.attrib:
        data['data-tagid'] = element.attrib['data-tagid']
    if field:
        data['field'] = field
    return data


def _add_annotation_data(annotation, sample):
    if 'data' in annotation:
        return annotation
    annotations = sample['plugins']['annotations-plugin']['extracts']
    existing_ids = {i for a in annotations for i in a.get('data', [])}
    annotation['data'] = {}
    for attribute, field in annotation.get('annotations', {}).items():
        if field == '#dummy':
            continue
        _id = gen_id(disallow=existing_ids)
        annotation['data'][_id] = {
            'attribute': attribute,
            'field': field,
            'required': field in annotation.get('required', []),
            'extractors': sample.get('extractors', {}).get(field, [])
        }
    return annotation


def port_generated(generated_annotations, sel):
    """Port generated annotations to annotations with custom extractors."""
    for annotation in generated_annotations:
        # Find pre and post text
        slice = annotation.get('slice')
        if not annotation.get('tagid') or not slice or len(slice) != 2:
            continue
        element = find_element(annotation, sel)
        if element is None:
            continue
        if annotation.get('insert_after'):
            text = element.tail
        else:
            text = element.text
        text = (text or '').strip()
        data = annotation['data']
        content_field = annotation.get('text-content', 'content')
        anno = data.get(content_field)
        if anno:
            anno['pre_text'] = text[0:slice[0]]
            anno['post_text'] = text[slice[1]:]
        # Create new text region field
        del annotation['generated']
        del annotation['slice']
    return generated_annotations


def port_standard(standard_annotations, sel, sample):
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
        annotation = _add_annotation_data(annotation, sample)
        new_annotations.append(annotation)
    return new_annotations


def load_annotations(body):
    """Create slybot annotations from annotated html."""
    if not body:
        return {'annotations-plugin': {'extracts': []}}
    sel = Selector(text=add_tagids(body))
    existing_ids = set()
    annotations = []
    for elem in sel.xpath('//*[@data-scrapy-annotate]'):
        attributes = elem._root.attrib
        annotation = json.loads(unquote(attributes['data-scrapy-annotate']))
        if elem._root.tag.lower() == 'ins':
            annotation.update(find_generated_annotation(elem))
        else:
            annotation['tagid'] = attributes.get('data-tagid')
        if 'id' not in annotation:
            annotation['id'] = gen_id(disallow=existing_ids)
        existing_ids.add(annotation['id'])
        annotations.append(annotation)
    for elem in sel.xpath('//*[@%s]' % '|@'.join(IGNORE_ATTRIBUTES)):
        attributes = elem._root.attrib
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
    elem = elem._root
    previous = elem.getprevious()
    insert_after = True
    nodes = []
    if previous is None:
        previous = elem.getparent()
        nodes = [previous] + previous.getchildren()
        insert_after = False
    else:
        while previous and previous.tag.lower() == 'ins':
            previous = previous.getprevious()
        if previous is None:
            previous = elem.getparent()
            insert_after = False
            node = previous.getchildren()[0]
        else:
            node = previous.getnext()
        while node:
            nodes.append(node)
            node = node.getnext()
            if node is None or node.tag.lower() == 'ins':
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
        if node.tag.lower() == 'ins':
            last_node_ins = True
            if node == elem:
                annotation['slice'] = start, start + len(node.text)
            else:
                start += len(node.text)
        else:
            text = node.tail if annotation['insert_after'] else node.text or ''
            if not last_node_ins:
                text = text.lstrip()
            start += len(text)
            last_node_ins = False
    return annotation
