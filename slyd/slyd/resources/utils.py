from itertools import chain
from collections import namedtuple

import slybot
import slybot.plugins.scrapely_annotations.extraction as extraction

from slybot.utils import include_exclude_filter
from slybot.validation.schema import get_schema_validator

from .models import (SchemaSchema, FieldSchema, ItemSchema, AnnotationSchema,
                     ItemAnnotationSchema)
from ..utils.projects import gen_id, ctx
from slybot.plugins.scrapely_annotations.migration import (port_sample,
                                                           load_annotations)

SLYBOT_VERSION = slybot.__version__


def _load_sample(manager, spider_id, sample_id, create_missing_item=True):
    sample = manager.resource('spiders', spider_id, sample_id)
    return _handle_sample_updates(manager, sample, spider_id, sample_id,
                                  create_missing_item)


def _handle_sample_updates(manager, sample, spider_id, sample_id,
                           create_missing_item=True):
    if not sample.get('name'):
        sample['name'] = sample_id
    sample['id'] = sample_id
    if 'version' not in sample or sample['version'] < '0.13.0':
        sample = port_sample(sample)
        sample['version'] = SLYBOT_VERSION
        manager.savejson(sample, ['spiders', spider_id, sample_id])
    if 'plugins' in sample:
        annotations = sample['plugins']['annotations-plugin']['extracts']
        if any(a.get('item_container') for a in annotations):
            return sample
        sample['version'] = SLYBOT_VERSION
        if create_missing_item:
            _, sample = _create_default_item(manager, sample)
            manager.savejson(sample, ['spiders', spider_id, sample_id])
        return sample
    annotations = load_annotations(sample.get('annotated_body', u''))
    sample['plugins'] = annotations
    _, sample = _create_default_item(manager, sample)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    return sample


def sample_uses_js(spider, sample):
    if not spider.js_enabled:
        return False
    enable_patterns = spider.js_enable_patterns
    disable_patterns = spider.js_disable_patterns
    js_filter = include_exclude_filter(enable_patterns, disable_patterns)
    return js_filter(sample.url)


def _create_default_item(manager, sample):
    annotations = sample['plugins']['annotations-plugin']['extracts']
    item_containers = [a for a in annotations if a.get('item_annotation')]
    if item_containers:
        return item_containers[0], sample
    schema_id, schemas = _get_schema(manager, sample)
    if not schema_id:
        name = sample.get('name', sample.get('id'))
        if not name.strip():
            name = sample.get('id')
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


def _create_schema(manager, schema=None, schemas=None, autoincrement=False):
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
    if autoincrement:
        names = {s['name'] for s in schemas.values() if s.get('name')}
        counter, name = 1, new_schema['name']
        while new_schema['name'] in names:
            new_schema['name'] = '%s%s' % (name, counter)
            counter += 1
    get_schema_validator('item').validate(new_schema)
    schemas[schema_id] = new_schema
    if manager:
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
    return _read_resource(manager, 'items')


def _read_resource(manager, resource):
    try:
        schemas = manager.resource(resource)
        assert isinstance(schemas, dict)
    except (AssertionError, TypeError, IOError):
        return {}
    return schemas


def _recreate_parent_annotation(child, exists=True):
    _id = child['id']
    if exists:
        _id = '%s#parent' % _id
    return {
        'schema_id': child['schema_id'],
        'repeated': False,
        'id': _id,
        'accept_selectors': ['body'],
        'reject_selectors': [],
        'selector': 'body',
        'required': [],
        'annotations': {'#portia-content': '#dummy'},
        'text-content': '#portia-content',
        'item_container': True,
    }


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
    if include_fields and schema['fields']:
        included = FieldSchema(many=True).dump(schema['fields']).data
        data['included'] = included['data']
    return data


def _schema_name(schema, schema_id):
    return schema.get('name', schema_id)


def _field_name(field, field_id):
    return field.get('name', field.get('name', field_id))


def _add_items_and_annotations(data, items, annotations, item_annotations,
                               _ctx):
    built_items = []
    for i in items:
        context = _ctx(i['schema']['id'], i.get('container_id'))
        item = ItemSchema(context=context).dump(i).data['data']
        built_items.append(item)
    annos = []
    for a in annotations:
        if a.get('item_container'):
            continue
        context = _ctx(None, a['container_id'])
        dumper = AnnotationSchema(context=context)
        annos.append(dumper.dump(a).data['data'])
    item_annos = []
    for a in item_annotations:
        context = _ctx(a['schema_id'])
        dumper = ItemAnnotationSchema(context=context)
        item_annos.append(dumper.dump(a).data['data'])
    data['included'] = built_items + annos + item_annos
    return data


def _process_annotations(sample):
    annotation_info = sample.get('plugins', {}).get('annotations-plugin', {})
    annotations = annotation_info.get('extracts', [])
    containers, grouped, remaining = _group_annotations(annotations)
    items, item_annotations = [], []
    processed_items = set()
    scrapes = sample.get('scrapes')  # TODO: Handle default item
    for _id, container in containers.items():
        item_id = _id.split('#')[0]
        if 'schema_id' not in container and scrapes:
            container['schema_id'] = scrapes
        item = {
            'id': item_id,
            'sample': sample,
            'schema': {'id': container['schema_id']},
            'item_annotation': container,
            'annotations': grouped.get(_id, [])
        }
        container_id = container.get('container_id')
        if container_id:
            container['parent'] = {'id': container_id}
        if item_id not in processed_items:
            items.append(item)
            processed_items.add(item['id'])
        item_annotations.append(container)
    annotations = [i for i in chain(*grouped.values())
                   if not i.get('item_container')]
    return items, annotations, item_annotations


Extractor = namedtuple('Extractor', ['annotation'])
Annotation = namedtuple('Annotation', ['metadata'])


def _group_annotations(annotations):
    """Group annotations into container/item annotations, contained annotations
    and un contained annotations."""
    extractors = [Extractor(Annotation(a)) for a in annotations]
    data = extraction.BaseContainerExtractor._get_container_data(extractors)
    containers = {_id: c.annotation.metadata for _id, c in data[0].items()}
    contained_annotations = {}
    for _id, annos in data[1].items():
        contained_annotations[_id] = _split_annotations(annos)
    remaining_annotations = _split_annotations(data[2])
    return containers, contained_annotations, remaining_annotations


def _split_annotations(annotations):
    """Split annotations into one extracted attribtue per annotation."""
    split_annotations = []
    for a in annotations:
        if isinstance(a, Extractor):
            a = a.annotation.metadata.copy()
        else:
            a = a.copy()
        if a.get('item_container'):
            continue
        _default = {
            'default': {
                'field': '#dummy',
                'required': False,
                'extractors': [],
                'attribute': '#portia-content'
            }
        }
        attributes = a.get('data', _default)
        if not attributes:
            attributes = _default
        for _id, annotation in attributes.items():
            a['id'] = '|'.join((a['id'], _id))
            a.pop('schema_id', None)
            a['attribute'] = annotation['attribute']
            a['field'] = {'id': annotation['field']}
            a['required'] = annotation.get('required', False)
            a['extractors'] = [{'id': e} for e in annotation['extractors']]
            split_annotations.append(a)
    return split_annotations
