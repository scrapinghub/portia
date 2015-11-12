from __future__ import absolute_import
from slybot.validation.schema import get_schema_validator

from .models import FieldSchema
from ..errors import NotFound
from ..utils.projects import gen_id, ctx


def list_fields(manager, schema_id, attributes=None):
    fields = []
    _fields = _read_schemas(manager)[schema_id]['fields']
    for field_id, field in _fields.items():
        field['id'] = field_id
        fields.append(field)
    context = ctx(manager, schema_id=schema_id)
    return FieldSchema(many=True, context=context).dump(fields).data


def get_field(manager, schema_id, field_id, attributes=None):
    items = _read_schemas(manager)
    if schema_id not in items:
        raise NotFound('No item with id "%s" found' % schema_id)
    item = items[schema_id]
    field = item['fields'][field_id.split('/')[-1]]
    field['id'] = field_id
    field = FieldSchema(context=ctx(manager, schema_id=schema_id)).dump(field)
    return field.data


def create_field(manager, schema_id, attributes):
    attributes = _check_field_attributes(attributes, include_defaults=True)
    schemas = _read_schemas(manager)
    schema = schemas[schema_id]
    field_id = gen_id(disallow=list(schema.get('fields', {}).keys()))
    attributes['name'] = attributes.pop('name', field_id)
    get_schema_validator('field').validate(attributes)
    schema['fields'][field_id] = attributes
    manager.savejson(schemas, ['items'])
    attributes['id'] = field_id
    context = ctx(manager, schema_id=schema_id)
    return FieldSchema(context=context).dump(attributes).data


def update_field(manager, schema_id, field_id, attributes):
    schemas = _read_schemas(manager)
    if schema_id not in schemas:
        raise NotFound('No item with id "%s" found' % schema_id)
    schema = schemas[schema_id]
    field = schema['fields'][field_id.split('/')[-1]]
    attributes = _check_field_attributes(attributes)
    field.update(attributes)
    get_schema_validator('field').validate(field)
    schemas[schema_id]['fields'][field_id] = field
    manager.savejson(schemas, ['items'])
    context = ctx(manager, schema_id=schema_id)
    return FieldSchema(context=context).dump(field).data


def delete_field(manager, schema_id, field_id, attributes=None):
    items = _read_schemas(manager)
    if schema_id not in items:
        raise NotFound('No item with id "%s" found' % schema_id)
    item = items[schema_id]
    if field_id not in item['fields']:
        raise NotFound('No field with id "%s" found' % field_id)
    item['fields'].pop(field_id)
    manager.savejson(items, ['items', schema_id.encode('utf-8')])


def _check_field_attributes(attributes, include_defaults=False):
    attributes = FieldSchema().load(attributes).data
    if include_defaults:
        attributes['_skip_relationships'] = True
        return FieldSchema().dump(attributes).data['data']['attributes']
    return attributes


def _field_name(field, field_id):
    return field.get('name', field.get('name', field_id))


def _read_schemas(manager):
    try:
        schemas = manager.resource('items')
        assert isinstance(schemas, dict)
    except (AssertionError, TypeError):
        manager.savejson({}, ['items'])
        return {}
    return schemas
