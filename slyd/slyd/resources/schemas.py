from __future__ import absolute_import

from slybot.validation.schema import get_schema_validator

from .models import SchemaSchema, FieldSchema
from .fields import _field_name, _read_schemas
from ..errors import NotFound, BadRequest
from ..utils.projects import gen_id, ctx, init_project


@init_project
def list_schemas(manager, attributes=None):
    schemas, fields = _load_schemas(manager)
    included = FieldSchema(many=True).dump(fields).data
    data = SchemaSchema(many=True, context=ctx(manager)).dump(schemas).data
    data['included'] = included['data']
    return data


@init_project
def get_schema(manager, schema_id, attributes=None):
    schemas = _read_schemas(manager)
    return _get_formatted_schema(manager, schema_id, schemas[schema_id], True)


def create_schema(manager, attributes):
    attributes = _check_schema_attributes(attributes)
    if 'fields' not in attributes:
        attributes['fields'] = {}
    get_schema_validator('item').validate(attributes)
    schemas = _read_schemas(manager)
    schema_id = gen_id(disallow=schemas.keys())
    schemas[schema_id] = attributes
    manager.savejson(schemas, ['items'])
    attributes['id'] = schema_id
    return _get_formatted_schema(manager, schema_id, attributes)


def update_schema(manager, schema_id, attributes):
    schemas = _read_schemas(manager)
    schema = schemas[schema_id]
    schema.update(attributes)
    # TODO: add name validator
    get_schema_validator('item').validate(schema)
    schemas[schema_id] = schema
    manager.savejson(schemas, ['items'])
    return _get_formatted_schema(manager, schema_id, schema, True)


def delete_schema(manager, schema_id, attributes):
    schemas = _read_schemas(manager)
    if schema_id not in schemas:
        raise NotFound('No item with id "%s" found' % schema_id)
    schemas.pop(schema_id)
    manager.savejson(schemas, ['items'])


def _check_schema_attributes(attributes):
    attributes = SchemaSchema().load(attributes).data
    if 'name' not in attributes:
        raise BadRequest('Missing required "name" attribute')
    return attributes


def _load_schemas(manager):
    schemas, fields = [], []
    for schema_id, schema in _read_schemas(manager).items():
        schema = _process_schema(schema_id, schema)
        fields.extend(schema['fields'])
        schemas.append(schema)
    return schemas, fields


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
    return schema.get('name', schema.get('display_name', schema_id))
