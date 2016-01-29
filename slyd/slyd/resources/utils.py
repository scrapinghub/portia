import json

import slybot
from slybot.validation.schema import get_schema_validator

from urllib import unquote

from lxml import etree
from scrapy import Selector

from .models import SchemaSchema, FieldSchema
from ..utils import add_tagids
from ..utils.projects import gen_id, add_plugin_data, ctx

IGNORE_ATTRIBUTES = ['data-scrapy-ignore', 'data-scrapy-ignore-beneath']
SLYBOT_VERSION = slybot.__version__


def _load_sample(manager, spider_id, sample_id, create_missing_item=True):
    sample = manager.resource('spiders', spider_id, sample_id)
    if not sample.get('name'):
        sample['name'] = sample_id
    sample['id'] = sample_id
    if 'version' not in sample:
        sample['version'] = SLYBOT_VERSION
    if 'plugins' in sample:
        annotations = sample['plugins']['annotations-plugin']['extracts']
        if any(a.get('item_container') for a in annotations):
            _recreate_missing_item_annotations(manager, spider_id, sample_id,
                                               sample)
            return sample
        if create_missing_item:
            _, sample = _create_default_item(manager, sample)
            manager.savejson(sample, ['spiders', spider_id, sample_id])
        return sample
    annotations = load_annotations(sample.get('annotated_body', u''))
    sample['plugins'] = annotations
    if annotations['annotations-plugin']['extracts']:
        add_plugin_data(sample, manager.plugins)
    _, sample = _create_default_item(manager, sample)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    return sample


def _create_default_item(manager, sample):
    annotations = sample['plugins']['annotations-plugin']['extracts']
    item_containers = [a for a in annotations if a.get('item_annotation')]
    if item_containers:
        return item_containers[0], sample
    schema_id, schemas = _get_schema(manager, sample)
    if not schema_id:
        name = sample.get('name', sample.get('id'))
        _, schema_id = _create_schema(manager, {'name': name}, schemas)
    item_annotation = _create_item_annotation(sample, schema_id)
    annotations.append(item_annotation)
    return item_annotation, sample


def _get_schema(manager, sample):
    default = sample.get('scrapes')
    schemas = _read_schemas(manager)
    if default and default in schemas:
        return default, schemas
    return None, schemas


def _create_schema(manager, schema=None, schemas=None):
    if schemas is None:
        schemas = _read_schemas(manager)
    if schema is None:
        schema = {}
    schema_id = gen_id(disallow=schemas.keys())
    new_schema = {
        'name': schema_id,
        'fields': {}
    }
    new_schema.update(schema)
    get_schema_validator('item').validate(new_schema)
    schemas[schema_id] = new_schema
    manager.savejson(schemas, ['items'])
    return new_schema, schema_id


def _create_item_annotation(sample, schema_id):
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    container_ids = {a['id'] for a in annotations if a.get('item_container')}
    # Add container ids to any annotations that need them
    for annotation in annotations:
        if ('container_id' not in annotation or
                annotation['container_id'] not in container_ids):
            annotation['container_id'] = aid
    return _recreate_parent_annotation({'id': aid,
                                        'schema_id': schema_id}, exists=False)


def _read_schemas(manager):
    try:
        schemas = manager.resource('items')
        assert isinstance(schemas, dict)
    except (AssertionError, TypeError):
        manager.savejson({}, ['items'])
        return {}
    return schemas


def _recreate_missing_item_annotations(manager, spider_id, sample_id, sample):
    annotations = sample['plugins']['annotations-plugin']['extracts']
    container_ids = {a['id'] for a in annotations if a.get('item_container')}
    new_annotations = []
    for annotation in annotations:
        if (annotation.get('item_container') and 'container_id' in annotation
                and annotation['container_id'] not in container_ids):
            new_annotations.append(_recreate_parent_annotation(annotation))
    if new_annotations:
        annotations.extend(new_annotations)
        manager.savejson({}, ['spiders', spider_id, sample_id])


def _recreate_parent_annotation(child, exists=True):
    id = child['id']
    if exists:
        id = '%s#parent' % id
    return {
        'schema_id': child['schema_id'],
        'repeated': False,
        'id': id,
        'accept_selectors': ['html'],
        'reject_selectors': [],
        'required': [],
        'annotations': {'#portia-content': '#dummy'},
        'text-content': '#portia-content',
        'item_container': True,
    }


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


def _process_schema(schema_id, schema):
    schema['id'] = schema_id
    schema['name'] = _schema_name(schema, schema_id)
    fields = []
    for field_id, field in schema.get('fields', {}).items():
        field['id'] = field_id
        field['name'] = _field_name(field, field_id)
        field['schema_id'] = schema_id
        fields.append(field)
    schema['fields'] = fields
    return schema


def _get_formatted_schema(manager, schema_id, schema, include_fields=False):
    schema = _process_schema(schema_id, schema)
    data = SchemaSchema(context=ctx(manager)).dump(schema).data
    if include_fields:
        included = FieldSchema(many=True).dump(schema['fields']).data
        data['included'] = included
    return data


def _schema_name(schema, schema_id):
    return schema.get('name', schema_id)


def _field_name(field, field_id):
    return field.get('name', field.get('name', field_id))
