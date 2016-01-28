import json

import slybot

from urllib import unquote

from lxml import etree
from scrapy import Selector

from ..utils import add_tagids
from ..utils.projects import gen_id, add_plugin_data

IGNORE_ATTRIBUTES = ['data-scrapy-ignore', 'data-scrapy-ignore-beneath']
SLYBOT_VERSION = slybot.__version__


def _load_sample(manager, spider_id, sample_id):
    sample = manager.resource('spiders', spider_id, sample_id)
    if not sample.get('name'):
        sample['name'] = sample_id
    sample['id'] = sample_id
    if 'version' not in sample:
        sample['version'] = SLYBOT_VERSION
    if 'plugins' in sample:
        return sample
    annotations = load_annotations(sample.get('annotated_body', u''))
    sample['plugins'] = annotations
    if annotations['annotations-plugin']['extracts']:
        add_plugin_data(sample, manager.plugins)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    return sample


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
        if 'id' not in annotation:
            annotation['id'] = gen_id(disallow=existing_ids)
        existing_ids.add(annotation['id'])
        annotation['tagid'] = attributes['data-tagid']
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
        nodes = previous.getchildren()
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
        'tagid': previous.attrib.get('tagid'),
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
                annotation['slice'] = start, start + len(etree.tostring(node))
            else:
                start += len(etree.tostring(node))
        else:
            text = node.text or ''
            if not last_node_ins:
                text = text.lstrip()
            start += len(text)
            last_node_ins = False
    return annotation
