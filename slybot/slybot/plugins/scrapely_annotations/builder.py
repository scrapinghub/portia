import json

from scrapy import Selector
from scrapy.utils.spider import arg_to_iter
from scrapely.htmlpage import parse_html, HtmlTag, HtmlDataFragment

from collections import defaultdict
from itertools import tee, count, groupby
from operator import itemgetter

from slybot.utils import (serialize_tag, add_tagids, remove_tagids, TAGID,
                          OPEN_TAG, CLOSE_TAG, UNPAIRED_TAG, GENERATEDTAGID)

from .migration import _get_parent, short_guid


class Annotations(object):

    def save_extraction_data(self, data, template, options={}):
        """
        data = {
            extracts: [
                {
                    annotations: {"content": "Title"},
                    id: "id-string",
                    required: [],
                    tagid: 12,
                    # All keys below are optional
                    variant: 0,
                    text-content: "name-of-text-content-field",
                    ignore: True,
                    ignore_beneath: True,
                    insert_after: True,
                    slice: [2, 16],
                    item_container: True,
                    container_id: "parent-id-string",
                    schema_id: "schema-id-string",
                    repeated: true,
                    siblings: 2,
                    field: "field-id-to-be-added-to-in-parent-container"
                }
            ]
        }
        """
        annotation_data = _clean_annotation_data(data.get('extracts', []))
        data['extracts'] = annotation_data
        body = template.get('body') or 'original_body'
        if body not in template:
            if 'original_body' in template:
                body = 'original_body'
            else:
                bodies = [k for k, v in template.items()
                          if v and k.endswith('_body')]
                if bodies:
                    body = bodies[0]
        html = template[body]
        template['annotated_body'] = apply_annotations(annotation_data, html)
        return data


def _clean_annotation_data(data):
    result = []
    sticky_count, stickies = count(1), set()
    for ann in data:
        if ann.get('item_container'):
            ann['annotations'] = {'#portia-content': '#dummy'}
            ann['text-content'] = '#portia-content'
        elif 'data' in ann:
            modified_annotations = {}
            grp = itemgetter('attribute')
            for _id, value in ann['data'].items():
                value['id'] = '%s|%s' % (ann['id'], _id)
            sorted_annotations = sorted(ann['data'].values(), key=grp)
            for attribute, annotations in groupby(sorted_annotations, grp):
                modified_annotations[attribute] = list(annotations)
            ann['annotations'] = modified_annotations
        elif 'annotations' in ann:
            filtered_annotations = {}
            for k, v in ann['annotations'].items():
                if not v:
                    continue
                if v == '#sticky':
                    next_sticky = '_sticky%s' % next(sticky_count)
                    stickies.add(next_sticky)
                    v = next_sticky
                filtered_annotations[k] = v

            ann['annotations'] = filtered_annotations
            ann['required'] = list((set(ann.get('required', [])) | stickies) &
                                   set(filtered_annotations.values()))
        elif "ignore" in ann or "ignore_beneath" in ann:
            pass
        else:
            continue
        result.append(ann)
    return result


def _get_data_id(annotation):
    """Get id (a str) of an annotation."""
    if isinstance(annotation, HtmlTag):
        return annotation.attributes[TAGID]


def _gen_annotation_info(annotations):
    data = {}
    annotation_data = []
    for annotation in arg_to_iter(annotations):
        if 'annotations' in annotation:
            annotation_data.append({
                'id': annotation.get('id', short_guid()),
                'annotations': annotation.get('annotations', {}),
                'required': annotation.get('required', []),
                'required_fields': annotation.get('required', []),
                'variant': int(annotation.get('variant', 0)),
                'generated': annotation.get('generated', False),
                'text-content': annotation.get('text-content', 'content'),
                'item_container': annotation.get('item_container', False),
                'container_id': annotation.get('container_id'),
                'schema_id': annotation.get('schema_id'),
                'repeated': annotation.get('repeated'),
                'siblings': annotation.get('siblings'),
                'field': annotation.get('field'),
                'selector': annotation.get('selector'),
                'selection_mode': annotation.get('selection_mode'),
                'min_jump': annotation.get('min_jump', -1),
                'max_separator': annotation.get('max_separator', -1),
                'xpath': annotation.get('xpath')
            })
        if 'ignore' in annotation or 'ignore_beneath' in annotation:
            if annotation.get('ignore_beneath'):
                data['data-scrapy-ignore-beneath'] = 'true'
            elif annotation.get('ignore'):
                data['data-scrapy-ignore'] = 'true'
    if annotation_data:
        serialized = json.dumps(annotation_data).replace('"', '&quot;')
        data['data-scrapy-annotate'] = serialized
    return data


def _get_generated_annotation(element, annotations, nodes, html_body, inserts):
    eid = insert_after_tag = _get_data_id(element)
    text_strings = _get_text_nodes(nodes, html_body)
    text_content = ''.join((s.lstrip() for s in text_strings))
    pre_selected = []
    for annotation in annotations:
        start, end = _get_generated_slice(annotation)
        pre_selected.append((text_content[0:start], text_content[start:end],
                             annotation))
    tag_stack = [insert_after_tag]
    next_text_node = ''
    for i, node in enumerate(nodes):
        if isinstance(node, HtmlTag):
            if node.tag_type == OPEN_TAG:
                tagid = node.attributes.get(TAGID, '').strip()
                if tagid:
                    tag_stack.append(tagid)
            elif node.tag_type == CLOSE_TAG and tag_stack:
                insert_after_tag = tag_stack.pop()
        elif (isinstance(node, HtmlDataFragment) and len(tag_stack) == 1):
            text = html_body[node.start:node.end]
            # This allows for a clean way to insert fragments up until the
            # next tag in apply_annotations if we have already inserted a new
            # generated tag
            if not node.is_text_content and inserts.get(insert_after_tag):
                inserts[insert_after_tag].append(text)
                continue
            removed = 0
            inserted = False
            for j, (pre, selected, annotation) in enumerate(pre_selected[:]):
                if selected and selected in text:
                    previous, post = text.split(selected, 1)
                    if previous.strip() in pre:
                        pre_selected.pop(j - removed)
                        removed += 1
                        generated = _generate_elem(annotation, selected)
                        # Next immediate text node will be returned and added
                        # to the new document. Other text nodes within this
                        # node will be added after other child nodes have been
                        # closed.
                        if (insert_after_tag == eid and
                                not annotation.get('insert_after')):
                            next_text_node += previous + generated
                            inserted = True
                        else:
                            inserts[insert_after_tag].extend([previous,
                                                              generated])
                        text = post
            if inserted:
                next_text_node += text
            else:
                inserts[insert_after_tag].append(text)
    return next_text_node


def _get_text_nodes(nodes, html_body):
    text = []
    open_tags = 0
    for node in nodes:
        if isinstance(node, HtmlTag):
            if node.tag_type == OPEN_TAG:
                open_tags += 1
            elif node.tag_type == CLOSE_TAG:
                open_tags -= 1
        elif (isinstance(node, HtmlDataFragment) and
              node.is_text_content and open_tags == 0):
            text.append(html_body[node.start:node.end])
    return text


def _get_generated_slice(annotation):
    annotation_slice = annotation.get('slice', [0])[:2]
    if not annotation_slice:
        annotation_slice = [0, 0]
    elif len(annotation_slice) < 2:
        annotation_slice.append(annotation_slice[0])
    return annotation_slice


def _generate_elem(annotation, text):
    sections = ['<ins']
    annotation_info = _gen_annotation_info(annotation)
    annotation_info[GENERATEDTAGID] = annotation.get('id')
    attributes = []
    for key, value in annotation_info.items():
        attributes.append('%s="%s"' % (key, value))
    sections.append(' '.join(attributes))
    if len(sections) > 1:
        sections[0] += ' '
    sections.extend(['>', text, '</ins>'])
    return ''.join(sections)


def _get_inner_nodes(target, open_tags=1, insert_after=False,
                     stop_on_next=False):
    nodes = []
    while open_tags > -0:
        elem = next(target)
        if isinstance(elem, HtmlTag):
            if elem.tag_type == OPEN_TAG:
                open_tags += 1
                if stop_on_next and elem.attributes.get(TAGID) is not None:
                    return nodes
            elif (stop_on_next and
                  elem.tag_type == UNPAIRED_TAG and
                  elem.attributes.get(TAGID) is not None):
                return nodes
            elif elem.tag_type == CLOSE_TAG:
                open_tags -= 1
        nodes.append(elem)
    if insert_after:
        return _get_inner_nodes(target, stop_on_next=True)
    return nodes


def _add_element(element, output, html):
    if '__added' not in element.attributes:
        output.append(html[element.start:element.end])
        element.attributes['__added'] = True
    return element


def _annotation_key(a):
    return a.get('generated', False) + sum(a.get('slice', []))


def _filter_annotations(annotations):
    selector, tagid = [], []
    for ann in annotations:
        if ann:
            if ann.get('selector'):
                selector.append(ann)
            elif ann.get('tagid') and (ann.get('annotations') or
                                       ann.get('ignore')):
                tagid.append(ann)
    return selector, tagid


def _merge_annotations_by_selector(annotations):
    def grouper(x):
        return x.get('selector')
    annotations.sort(key=grouper)
    return [list(annos) for _, annos in groupby(annotations, key=grouper)]


def apply_selector_annotations(annotations, target_page):
    page = Selector(text=target_page)
    converted_annotations = []
    tagid_selector_map = {}
    added_repeated = {}
    containers = {}
    for annotation in annotations:
        if annotation.get('item_container'):
            containers[annotation['id']] = annotation
        selector = annotation.get('selector')
        tagid, elems = tagid_for_annotation(annotation, page)
        if tagid is not None:
            annotation['tagid'] = tagid
            if selector:
                tagid_selector_map[tagid] = selector
            converted_annotations.append(annotation)

        # Create container for repeated field annotation
        if (annotation.get('repeated') and
                not annotation.get('item_container') and
                elems is not None and len(elems) and
                len(annotation.get('annotations')) == 1):
            repeated_parent = add_repeated_field(annotation, elems, page)
            if repeated_parent:
                converted_annotations.append(repeated_parent)
                container_id = repeated_parent['container_id']
                added_repeated[container_id] = repeated_parent
    if added_repeated:
        for container_id, child in added_repeated.items():
            container = containers[container_id]
            if container['tagid'] != child['tagid']:
                continue
            _, elems = tagid_for_annotation(container, page)
            parent = elems[0].getparent()
            container['tagid'] = int(parent.attrib.get('data-tagid', 1e9))
    return _merge_annotations_by_selector(converted_annotations)


def tagid_for_annotation(annotation, page):
    selector = annotation.get('selector')
    if not selector:
        return None, None
    elems = []
    while selector and not elems:
        elems = [elem._root for elem in page.css(selector)]
        selector = ' > '.join(selector.split(' > ')[1:])
    if not elems:
        return None, None

    tagids = [int(e.attrib.get('data-tagid', 1e9)) for e in elems]
    return min(tagids), elems


def add_repeated_field(annotation, elems, page):
    parent = _get_parent(elems, page)
    field = annotation['annotations'].values()[0][0]['field']
    container_id = '%s#parent' % annotation['id']
    if len(parent):
        tagid = int(parent.attrib.get('data-tagid', 1e9))
        parent_annotation = {
            'item_container': True,
            'id': container_id,
            'annotations': {'#portia-content': '#dummy'},
            'text-content': '#portia-content',
            'container_id': annotation['container_id'],
            'field': field,
            'tagid': tagid
        }
        annotation['item_container'] = True
        annotation['field'] = field
        annotation['container_id'] = container_id
        return parent_annotation


def apply_annotations(annotations, target_page):
    selector_annotations, tagid_annotations = _filter_annotations(annotations)
    inserts = defaultdict(list)
    numbered_html = add_tagids(target_page)
    if selector_annotations:
        converted_annotations = apply_selector_annotations(
            selector_annotations, numbered_html)
        tagid_annotations += converted_annotations
    target = iter(parse_html(numbered_html))
    output, tag_stack = [], []
    element = next(target)
    last_id = 0
    # XXX: A dummy element is added to the end so if the last annotation is
    #      generated it will be added to the output
    filtered = defaultdict(list)
    for grouped in tagid_annotations:
        for ann in arg_to_iter(grouped):
            filtered[ann['tagid']].append(ann)
    dummy = [(1e9, [{}])]
    sorted_annotations = sorted([(int(k), v) for k, v in filtered.items()] +
                                dummy)
    try:
        for aid, annotation_data in sorted_annotations:
            # Move target until replacement/insertion point
            while True:
                while not isinstance(element, HtmlTag) or element.tag == 'ins':
                    output.append(numbered_html[element.start:element.end])
                    element = next(target)
                if element.tag_type in {OPEN_TAG, UNPAIRED_TAG}:
                    last_id = element.attributes.get(TAGID)
                    tag_stack.append(last_id)
                if element.tag_type in {CLOSE_TAG, UNPAIRED_TAG} and tag_stack:
                    if ('__added' not in element.attributes and
                            last_id is not None and aid is not None and
                            int(last_id) < int(aid)):
                        output.append(numbered_html[element.start:element.end])
                        element.attributes['__added'] = True
                    last_inserted = tag_stack.pop()
                    to_insert = inserts.pop(last_inserted, None)
                    if to_insert:
                        output.extend(to_insert)
                        # Skip all nodes up to the next HtmlTag as these
                        # have already been added
                        while True:
                            element = next(target)
                            try:
                                last_id = element.attributes.get(TAGID,
                                                                 last_id)
                            except AttributeError:
                                pass
                            if isinstance(element, HtmlTag):
                                break
                        continue
                if (last_id is not None and aid is not None and
                        int(last_id) < int(aid)):
                    if '__added' not in element.attributes:
                        output.append(numbered_html[element.start:element.end])
                        element.attributes['__added'] = True
                    element = next(target)
                else:
                    break

            generated = []
            next_generated = []
            regular_annotations = []
            # Place generated annotations at the end and sort by slice
            for annotation in sorted(annotation_data, key=_annotation_key):
                if annotation.get('generated'):
                    if annotation.get('insert_after'):
                        next_generated.append(annotation)
                    else:
                        generated.append(annotation)
                else:
                    regular_annotations.append(annotation)
            # Add annotations data as required
            if regular_annotations:
                annotation_info = _gen_annotation_info(regular_annotations)
                for key, val in annotation_info.items():
                    element.attributes[key] = val
            next_text_section = ''
            if generated:
                inner_data, target = tee(target)
                nodes = _get_inner_nodes(inner_data)
                next_text_section = _get_generated_annotation(
                    element, generated, nodes, numbered_html, inserts)
            if next_generated:
                inner_data, target = tee(target)
                open_tags = 0 if element.tag_type == UNPAIRED_TAG else 1
                nodes = _get_inner_nodes(inner_data, open_tags=open_tags,
                                         insert_after=True)
                next_text_section = _get_generated_annotation(
                    element, next_generated, nodes, numbered_html, inserts)

            if '__added' not in element.attributes:
                output.append(serialize_tag(element))
                element.attributes['__added'] = True
            # If an <ins> tag has been inserted we need to move forward
            if next_text_section:
                while True:
                    elem = next(target)
                    if (isinstance(elem, HtmlDataFragment) and
                            elem.is_text_content):
                        break
                    output.append(numbered_html[elem.start:elem.end])
                output.append(next_text_section)
    # Reached the end of the document
    except StopIteration:
        output.append(numbered_html[element.start:element.end])
    else:
        for element in target:
            output.append(numbered_html[element.start:element.end])
    return remove_tagids(''.join(output))
