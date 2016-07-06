from collections import defaultdict, OrderedDict
from functools import partial
from operator import itemgetter

from marshmallow import pre_dump, post_dump
from marshmallow.fields import Method
from marshmallow.schema import SchemaMeta
from marshmallow_jsonapi import Schema as BaseSchema, SchemaOpts
from six import iteritems, iterkeys, string_types, with_metaclass

from slyd.jsonapi.registry import schemas
from slyd.jsonapi.relationships import Relationship
from slyd.jsonapi.utils import (TOP_LEVEL_OBJECT_ORDER, RESOURCE_OBJECT_ORDER,
                                deep_getattr, type_from_model_name, dasherize,
                                should_include_field, order_dict)
from slyd.orm.base import Model
from slyd.orm.fields import Field as OrmField
from slyd.orm.relationships import BaseRelationship, HasMany

__all__ = [
    'JsonApiSchema',
]


class JsonApiSchemaMeta(SchemaMeta):
    """Meta class for JSON API schemas."""
    def __new__(mcs, name, bases, attrs):
        parents = [b for b in bases if isinstance(b, JsonApiSchemaMeta)]
        if not parents:
            return super(JsonApiSchemaMeta, mcs).__new__(
                mcs, name, bases, attrs)

        meta = attrs.pop('Meta', None)

        try:
            model = meta.model
        except AttributeError:
            raise TypeError(
                u"Class '{}' is missing the 'Meta.model' attribute.".format(
                    name))

        schema_type = type_from_model_name(model.__name__)

        meta_bases = (meta, object) if meta else (object,)
        schema_attrs = {
            'Meta': type('Meta', meta_bases, {
                'type_': schema_type,
                'inflect': dasherize,
            })
        }

        links = getattr(meta, 'links', {})
        for attrname, field in iteritems(model._fields):
            if isinstance(field, OrmField):
                field_copy = object.__new__(field.__class__)
                field_copy.__dict__ = dict(field.__dict__)
                field_copy.load_from = None
                field_copy.dump_to = None
                schema_attrs[attrname] = field_copy
            elif isinstance(field, BaseRelationship):
                rel_links = links.get(attrname, {})
                schema_attrs[attrname] = Relationship(
                    type_=type_from_model_name(field.model.__name__),
                    id_field='pk',
                    self_url=rel_links.get('self', ''),
                    related_url=rel_links.get('related', ''),
                    many=isinstance(field, HasMany))

        if 'id' not in schema_attrs:
            pk_field = model._fields[model._pk_field]
            schema_attrs['id'] = type(pk_field)(attribute=model._pk_field)

        # we need to access the serialized object to generate the url, but
        # get_resource_links takes the serialized item, so we add a method field
        # to do the work
        schema_attrs['_url'] = Method('get_url')

        cls = super(JsonApiSchemaMeta, mcs).__new__(
            mcs, name, bases, schema_attrs)

        # add new schema to registry by type
        schemas[schema_type] = cls
        return cls


class JsonApiSchemaOpts(SchemaOpts):
    def __init__(self, meta):
        super(JsonApiSchemaOpts, self).__init__(meta)
        if meta is BaseSchema.Meta:
            return

        self.strict = True
        # the model from which the Schema was created, required
        self.model = getattr(meta, 'model', None)
        if not issubclass(self.model, Model):
            raise ValueError("'model' option must be a slyd.orm.Model.")
        # url for an object instance
        self.url = getattr(meta, 'url', None)
        if not isinstance(self.url, string_types):
            raise ValueError("'url' option must be a string.")
        # default context for serialization
        self.default_kwargs = getattr(meta, 'default_kwargs', {})
        if not isinstance(self.default_kwargs, dict):
            raise ValueError("'default_kwargs' option must be a dictionary.")


class JsonApiSchema(with_metaclass(JsonApiSchemaMeta, BaseSchema)):
    OPTIONS_CLASS = JsonApiSchemaOpts

    def __init__(self, only=(), **kwargs):
        default_kwargs = dict(self.opts.default_kwargs)
        fields_map = dict(default_kwargs.pop('fields_map', {}),
                          **kwargs.pop('fields_map', {}))
        exclude_map = dict(default_kwargs.pop('exclude_map', {}),
                           **kwargs.pop('exclude_map', {}))
        kwargs = dict(default_kwargs, **kwargs)

        self.current_url = kwargs.pop('current_url', None)
        self.include = kwargs.pop('include_data', [])
        self.ordering = kwargs.pop('ordering', [])
        self.fields_map = fields_map
        self.exclude_map = exclude_map

        self.include_map = include_map = defaultdict(list)
        for include in self.include:
            parts = include.split('.', 1)
            prefix_map = include_map[parts[0]]
            if len(parts) == 2:
                prefix_map.append(parts[1])

        type_ = self.opts.type_
        model = self.opts.model
        field_names = model._field_names
        relationship_names = model._relationship_names
        fields = fields_map.get(type_)
        exclude = exclude_map.get(type_)

        if not only:
            f_set = fields and set(fields)
            e_set = exclude and set(exclude)

            self.field_set = field_set = set()
            self.relationship_set = relationship_set = set()
            for name in field_names:
                if should_include_field(self.inflect(name),
                                        include=f_set, exclude=e_set):
                    field_set.add(name)
            for name in relationship_names:
                if should_include_field(self.inflect(name),
                                        include=f_set, exclude=e_set):
                    relationship_set.add(name)

            only = list(field_set | {'id'})
            for name in relationship_names:
                relationship = self._declared_fields[name]
                if (name in relationship_set or relationship.related_url or
                        relationship.self_url):
                    only.append(name)
            only.append('_url')

        self.field_order = list(fields or []) + map(self.inflect, field_names)
        self.relationship_order = (list(fields or []) +
                                   map(self.inflect, relationship_names))

        kwargs['include_data'] = tuple(iterkeys(self.include_map))
        super(JsonApiSchema, self).__init__(only=only, **kwargs)

    @pre_dump(pass_many=True)
    def sort_collection(self, models, many):
        ordering = self.ordering
        if not many or not ordering:
            return models

        for key in reversed(ordering):
            reverse = key[0] == '-'
            if reverse:
                key = key[1:]
            models = sorted(models, key=partial(deep_getattr, key=key),
                            reverse=reverse)

        return models

    @post_dump(pass_many=True)
    def format_json_api_response(self, data, many):
        response = super(JsonApiSchema, self).format_json_api_response(
            data, many)
        if 'included' in response:
            response['included'].sort(key=itemgetter('id'))
            response['included'].sort(key=itemgetter('type'))
        return order_dict(response, TOP_LEVEL_OBJECT_ORDER)

    def format_item(self, item):
        item = super(JsonApiSchema, self).format_item(item)
        if 'attributes' in item:
            attributes = item.pop('attributes')
            attributes.pop('-url', None)  # super call adds this
            if attributes:
                item['attributes'] = order_dict(attributes, self.field_order)
        if 'relationships' in item:
            item['relationships'] = order_dict(item['relationships'],
                                               self.relationship_order)
        return order_dict(item, RESOURCE_OBJECT_ORDER)

    def get_top_level_links(self, data, many):
        if self.current_url:
            return OrderedDict([('self', self.current_url)])
        return None

    def get_resource_links(self, item):
        url = item.get('_url')
        if url:
            return OrderedDict([('self', url)])
        return None

    def get_url(self, obj):
        return self.opts.url.format(self=obj)
