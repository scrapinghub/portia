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

from urllib import unquote

from scrapy import Selector
from . import add_tagids
from .projects import gen_id
IGNORE_ATTRIBUTES = ['data-scrapy-ignore', 'data-scrapy-ignore-beneath']


def port_sample(sample):
    if not sample.get('annotated_body'):
        return sample  # Handle empty body
    if not sample.get('plugins'):
        sample['plugins'] = load_annotations(sample.get('annotated_body', u''))

    # Group annotations by type
    annotations = sample['plugins']['annotations-plugin']['extracts']
    standard_annos, generated_annos, variant_annos = [], [], []
    for a in annotations:
        if a.get('generated'):
            generated_annos.append(a)
        elif a.get('variant', 0) > 0:
            variant_annos.append(a)
        else:
            standard_annos.append(a)
    sel = Selector(text=add_tagids(sample['original_body']))
    new_annotations = []
    new_annotations.extend(port_standard(standard_annos, sel))
    new_annotations.extend(port_generated(generated_annos, sel))
    new_annotations.extend(port_variants(variant_annos, sel))

    # Update annotations
    sample['plugins']['annotations-plugin']['extracts'] = new_annotations
    return sample


def find_element(tagid, sel):
    """Find an element by its tagid."""
    elements = sel.xpath('//*[@data-tagid="%s"]' % tagid)
    if elements:
        return elements[0]._root


def find_css_selector(elem, sel, depth=0):
    """Find a unique selector for an element."""
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
    if b in a_parents_set:
        return b
    if a in b_parents_set:
        return b
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

    # All of single type count as an item
    # Find shared item parents
    #   -> only single unmatched variant create non repeated container
    #   -> use shared parent for variant n and variant n + 1 container for
    #      repeated
    # Assign variants to field `variants` in parent item
    return variant_annotations


def port_generated(generated_annotations, sel):
    """Port generated annotations to annotations with custom extractors."""
    generated_annotations = port_standard(generated_annotations, sel)
    for annotation in generated_annotations:
        # Find pre and post text
        slice = annotation.get('slice')
        if not annotation.get('tagid') or not slice or len(slice) != 2:
            continue
        element = find_element(annotation['tagid'], sel)
        if element is None:
            continue
        if annotation.get('insert_after'):
            text = element.tail
        else:
            text = element.text
        text = (text or '').strip()
        annotation['pre_text'] = text[0:slice[0]]
        annotation['post_text'] = text[slice[1]:]
        # Create new text region field
        annotation.pop('generated', None)
        annotation.pop('slice', None)
    return generated_annotations


def port_standard(standard_annotations, sel):
    """Add accept selectors for existing annotations."""
    new_annotations = []
    for annotation in standard_annotations:
        if not annotation.get('tagid'):
            continue
        element = find_element(annotation['tagid'], sel)
        if element is None:
            continue
        selector = find_css_selector(element, sel)
        if not selector:
            continue
        annotation['accept_selectors'] = [selector]
        annotation['reject_selectors'] = []
        new_annotations.append(annotation)
    return new_annotations


def load_annotations(body):
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
            nodes.push(node)
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
