import slybot
from slybot.validation.schema import get_schema_validator

from .models import SchemaSchema, FieldSchema
from ..utils.projects import gen_id, add_plugin_data, ctx
from ..utils.migration import port_sample, load_annotations

SLYBOT_VERSION = slybot.__version__


def _load_sample(manager, spider_id, sample_id, create_missing_item=True):
    sample = manager.resource('spiders', spider_id, sample_id)
    if not sample.get('name'):
        sample['name'] = sample_id
    sample['id'] = sample_id
    if 'plugins' in sample:
        annotations = sample['plugins']['annotations-plugin']['extracts']
        if any(a.get('item_container') for a in annotations):
            return sample
        sample = port_sample(sample)
        sample['version'] = SLYBOT_VERSION
        if create_missing_item:
            _, sample = _create_default_item(manager, sample)
            manager.savejson(sample, ['spiders', spider_id, sample_id])
        return sample
    annotations = load_annotations(sample.get('annotated_body', u''))
    sample['plugins'] = annotations
    if annotations['annotations-plugin']['extracts']:
        add_plugin_data(sample, manager.plugins)
    sample = port_sample(sample)
    _, sample = _create_default_item(manager, sample)
    if 'version' not in sample:
        sample['version'] = SLYBOT_VERSION
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
    return _read_resource(manager, 'items')


def _read_extractors(manager):
    return _read_resource(manager, 'extractors')


def _read_resource(manager, resource):
    try:
        schemas = manager.resource(resource)
        assert isinstance(schemas, dict)
    except (AssertionError, TypeError):
        manager.savejson({}, ['items'])
        return {}
    return schemas


def _recreate_missing_item_annotations(manager, spider_id, sample_id, sample):
    # TODO: See if this is still needed and remove if not
    annotations = sample['plugins']['annotations-plugin']['extracts']
    container_ids = {a['id'] for a in annotations if a.get('item_container')}
    new_annotations = []
    for annotation in annotations:
        if (annotation.get('item_container') and
                'container_id' in annotation and
                annotation['container_id'] not in container_ids):
            new_annotations.append(_recreate_parent_annotation(annotation))
    if new_annotations:
        annotations.extend(new_annotations)
        manager.savejson({}, ['spiders', spider_id, sample_id])


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
    if include_fields:
        included = FieldSchema(many=True).dump(schema['fields']).data
        data['included'] = included
    return data


def _schema_name(schema, schema_id):
    return schema.get('name', schema_id)


def _field_name(field, field_id):
    return field.get('name', field.get('name', field_id))
