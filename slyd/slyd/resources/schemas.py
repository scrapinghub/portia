from __future__ import absolute_import

from slybot.validation.schema import get_schema_validator

from .models import SchemaSchema, FieldSchema
from .utils import (_read_schemas, _create_schema, _get_formatted_schema,
                    _process_schema)
from ..errors import NotFound, BadRequest
from ..utils.projects import ctx, init_project


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
    try:
        return _get_formatted_schema(manager, schema_id, schemas[schema_id],
                                     True)
    except KeyError:
        raise BadRequest('could not find schema with the id "%s"' % schema_id)


def create_schema(manager, attributes):
    attributes = _check_schema_attributes(attributes)
    attributes, schema_id = _create_schema(manager, attributes)
    attributes['id'] = schema_id
    return _get_formatted_schema(manager, schema_id, attributes)


def update_schema(manager, schema_id, attributes):
    schemas = _read_schemas(manager)
    schema = schemas[schema_id]
    schema.update(attributes.get('data', {}).get('attributes', {}))
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
    return SchemaSchema.empty_data()


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
