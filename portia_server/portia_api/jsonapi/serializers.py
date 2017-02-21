from collections import defaultdict, OrderedDict
from functools import partial
from itertools import chain
from operator import itemgetter

from marshmallow import pre_dump, post_dump, ValidationError
from marshmallow.fields import Method
from marshmallow.schema import SchemaMeta
from marshmallow_jsonapi import Schema as BaseSchema, SchemaOpts
from marshmallow_jsonapi.exceptions import IncorrectTypeError
from six import iteritems, iterkeys, string_types, with_metaclass
from six.moves import map, zip

from portia_api.jsonapi.registry import schemas, get_schema
from portia_api.jsonapi.relationships import (
    Relationship, PolymorphicRelationship)
from portia_api.jsonapi.utils import (
    RESOURCE_OBJECT_ORDER, TOP_LEVEL_OBJECT_ORDER, cached_property,
    camel_case_to_dashes, deep_getattr, dasherize, order_dict,
    should_include_field, type_from_model_name)
from portia_orm.base import AUTO_PK, Model
from portia_orm.exceptions import ImproperlyConfigured
from portia_orm.fields import Field as OrmField
from portia_orm.relationships import BaseRelationship, HasMany

__all__ = [
    'JsonApiSerializer',
    'JsonApiPolymorphicSerializer',
]

DELETED_PROFILE = 'https://portia.scrapinghub.com/jsonapi/extensions/deleted'
UPDATES_PROFILE = 'https://portia.scrapinghub.com/jsonapi/extensions/updates'
DELETED_PROFILE_ALIAS = 'deleted'
UPDATES_PROFILE_ALIAS = 'updates'


class JsonApiSerializerMeta(SchemaMeta):
    """Meta class for JSON API schemas."""
    def __new__(mcs, name, bases, attrs):
        parents = [b for b in bases if isinstance(b, JsonApiSerializerMeta)]
        if not parents:
            return super(JsonApiSerializerMeta, mcs).__new__(
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
                rel_many = isinstance(field, HasMany)
                rel_options = {
                    'self_url': rel_links.get('self', ''),
                    'related_url': rel_links.get('related', ''),
                    'many': rel_many
                }
                if not rel_many:
                    rel_options['allow_none'] = True
                if field.polymorphic:
                    schema_attrs[attrname] = PolymorphicRelationship(
                        **rel_options)
                else:
                    schema_attrs[attrname] = Relationship(
                        type_=type_from_model_name(field.model.__name__),
                        id_field='pk',
                        serializer=rel_links.get('serializer'),
                        **rel_options)

        if 'id' not in schema_attrs:
            pk_field = model._fields[model._pk_field]
            schema_attrs['id'] = type(pk_field)(attribute=model._pk_field)

        # we need to access the serialized object to generate the url, but
        # get_resource_links takes the serialized item, so we add a method field
        # to do the work
        schema_attrs['_url'] = Method('get_url')

        attrs.update(schema_attrs)
        cls = super(JsonApiSerializerMeta, mcs).__new__(mcs, name, bases, attrs)

        # add new schema to registry by type
        is_custom = name.replace('Serializer', '') != model.__name__
        key = camel_case_to_dashes(name) if is_custom else schema_type
        schemas[key] = cls
        return cls


class JsonApiSerializerOpts(SchemaOpts):
    def __init__(self, meta):
        super(JsonApiSerializerOpts, self).__init__(meta)
        if meta is BaseSchema.Meta:
            return

        self.strict = True
        # the model from which the Schema was created, required
        self.model = getattr(meta, 'model', None)
        if not issubclass(self.model, Model):
            raise ValueError("'model' option must be a orm.Model.")
        # url for an object instance
        self.url = getattr(meta, 'url', None)
        if not isinstance(self.url, string_types):
            raise ValueError("'url' option must be a string.")
        # default context for serialization
        self.default_kwargs = getattr(meta, 'default_kwargs', {})
        if not isinstance(self.default_kwargs, dict):
            raise ValueError("'default_kwargs' option must be a dictionary.")


class JsonApiSerializer(with_metaclass(JsonApiSerializerMeta, BaseSchema)):
    OPTIONS_CLASS = JsonApiSerializerOpts

    def __init__(self, instance=None, data=None, storage=None, only=(),
                 **kwargs):
        default_kwargs = dict(self.opts.default_kwargs)
        fields_map = dict(default_kwargs.pop('fields_map', {}),
                          **kwargs.pop('fields_map', {}))
        exclude_map = dict(default_kwargs.pop('exclude_map', {}),
                           **kwargs.pop('exclude_map', {}))
        include_data_map = dict(default_kwargs.pop('include_data_map', {}),
                                **kwargs.pop('include_data_map', {}))
        kwargs = dict(default_kwargs, **kwargs)

        self.current_url = kwargs.pop('current_url', None)
        self.include = kwargs.pop('include_data', [])
        self.ordering = kwargs.pop('ordering', [])
        self.fields_map = fields_map
        self.exclude_map = exclude_map
        self.include_data_map = include_data_map

        type_ = self.opts.type_
        model = self.opts.model
        self.include_map = include_map = defaultdict(list)
        for include in chain(self.include,
                             self.include_data_map.get(type_, [])):
            parts = include.split('.', 1)
            prefix_map = include_map[parts[0]]
            if len(parts) == 2:
                prefix_map.append(parts[1])

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

        self.field_order = list(
            chain(fields or [], map(self.inflect, field_names)))
        self.relationship_order = list(
            chain(fields or [], map(self.inflect, relationship_names)))

        only_set = set(only)
        kwargs['include_data'] = tuple(
            k for k in iterkeys(self.include_map) if k in only_set)
        super(JsonApiSerializer, self).__init__(only=only, **kwargs)
        self.instance = instance
        self.initial_data = data
        if storage:
            self.storage = storage
        elif isinstance(instance, Model):
            self.storage = instance.storage
        else:
            self.storage = None
        self.deleted = []
        self.updated = []

    @property
    def data(self):
        return self.dump(self.instance).data

    @cached_property
    def errors(self):
        if not hasattr(self, '_errors'):
            self.is_valid()
        return self._errors

    @cached_property
    def validated_data(self):
        if not hasattr(self, '_errors'):
            self.is_valid()
        return self._validated_data

    @cached_property
    def validated_profile_updates_data(self):
        if not hasattr(self, '_errors'):
            self.is_valid()
        return self._validated_profile_updates_data

    def deserialize_related_model(self, model, id_):
        if id_ is None:
            return None
        return model(self.storage, **{
            model._pk_field: id_,
        })

    def update(self, instance, validated_data):
        model = instance.__class__

        errors = {}
        fields = []
        for attrname in model._ordered_fields:
            if attrname in validated_data:
                try:
                    value = validated_data[attrname]
                    if attrname in model._field_names:
                        setattr(instance, attrname, value)
                        fields.append(attrname)
                    elif attrname in model._relationship_names:
                        # read in existing value to populate data stores
                        getattr(instance, attrname)

                        related_model = model._fields[attrname].model
                        if isinstance(value, list):
                            setattr(instance, attrname, [
                                self.deserialize_related_model(related_model, v)
                                for v in value])
                            fields.append(attrname)
                        else:
                            setattr(instance, attrname,
                                    self.deserialize_related_model(
                                        related_model, value))
                            fields.append(attrname)
                except ValidationError as err:
                    errors[attrname] = err.messages

        if errors:
            raise ValidationError(errors)

        instance.save(only=fields)
        return instance

    def create(self, validated_data):
        model = self.opts.model

        processed_attributes = {
            model._pk_field: AUTO_PK,
        }
        for attrname, value in iteritems(validated_data):
            if attrname in model._relationship_names:
                related_model = model._fields[attrname].model
                related_name = model._fields[attrname].related_name
                if isinstance(value, list):
                    value = [self.deserialize_related_model(related_model, v)
                             for v in value]
                else:
                    value = self.deserialize_related_model(related_model, value)
                # read in existing values to populate data stores, for unique
                # key generation
                if value is not None:
                    for v in (value if isinstance(value, list) else [value]):
                        getattr(v, related_name)
            processed_attributes[attrname] = value

        instance = model(self.storage, **processed_attributes)
        instance.save()
        return instance

    def apply_profile_updates(self, validated_data, serializers):
        errors = {}

        for data, serializer in zip(validated_data, serializers):
            id_ = data['id']
            instance = self.deserialize_related_model(
                serializer.opts.model, id_)

            serializer.instance = instance
            try:
                serializer.save()
            except ValidationError as err:
                errors.update(err.messages)
                continue

            self.updated.append(instance)
            self.updated.extend(serializer.updated)
            self.deleted.extend(serializer.deleted)

        if errors:
            raise ValidationError(errors)

    def save(self):
        if not hasattr(self, '_errors'):
            self.is_valid(raise_exception=True)

        validated_data = self.validated_data
        validated_profile_updates_data = self.validated_profile_updates_data

        errors = {}

        try:
            if self.instance is not None:
                self.instance = self.update(self.instance, validated_data)
            else:
                self.instance = self.create(validated_data)
        except ValidationError as err:
            errors.update(err.messages)

        if validated_profile_updates_data:
            try:
                self.apply_profile_updates(validated_profile_updates_data,
                                           self._profile_updates_serializers)
            except ValidationError as err:
                errors.update(err.messages)

        if errors:
            formatted_messages = self.format_errors(errors, many=self.many)
            raise ValidationError(formatted_messages)

        return self.instance

    def delete(self):
        data, serializers = self.load_profile_updates()
        self._validated_profile_updates_data = data
        self._profile_updates_serializers = serializers

        if self._validated_profile_updates_data:
            self.apply_profile_updates(self._validated_profile_updates_data,
                                       self._profile_updates_serializers)

        self.deleted.extend(self.instance.delete())
        self.instance = self.instance.with_snapshots(('working',))

    def is_valid(self, raise_exception=False):
        errors = []

        try:
            self._validated_data = self.load(self.initial_data).data
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        try:
            data, serializers = self.load_profile_updates()
            self._validated_profile_updates_data = data
            self._profile_updates_serializers = serializers
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        if errors:
            self._validated_data = {}
            self._validated_profile_updates_data = []
            self._errors = errors
            if raise_exception:
                err = ValidationError(u'Invalid data.')
                err.messages = {
                    'errors': errors
                }
                raise err
            return False

        self._errors = {}
        return True

    def load_profile_updates(self):
        if UPDATES_PROFILE not in self.initial_data.get(
                'links', {}).get('profile', []):
            return [], []
        for alias, profile in iteritems(self.initial_data.get('aliases', {})):
            if profile == UPDATES_PROFILE:
                break
        else:
            return [], []

        errors = []
        validated_data = []
        profile_serializers = []
        for i, update in enumerate(
                self.initial_data.get('meta', {}).get(alias, [])):
            if 'type' not in update:
                errors.append({
                    'detail': '`data` object must include `type` key.',
                    'source': {
                        'pointer': '/meta/{}/{}/data'.format(alias, i)
                    }
                })
                continue

            type_ = update['type']
            data = {
                'data': update,
            }

            try:
                serializer_class = get_schema(type_)
            except ImproperlyConfigured:
                errors.append({
                    'detail': 'Invalid type: {}.'.format(type_),
                    'source': {
                        'pointer': '/meta/{}/{}/data/type'.format(alias, i),
                    },
                })
                continue

            serializer = serializer_class(
                data=data,
                partial=set(
                    serializer_class.opts.model._ordered_fields).difference(
                        {'id'}))

            try:
                validated_data.append(serializer.validated_data)
                profile_serializers.append(serializer)
            except (ValidationError, IncorrectTypeError) as err:
                errors.extend({
                    'detail': error['detail'],
                    'source': {
                        'pointer': '/meta/{}/{}{}'.format(
                            alias, i, error['source']['pointer'])
                    },
                } for error in err.messages.get('errors', []))
                continue

        if errors:
            err = ValidationError(u'Invalid data for updates.')
            err.messages = {
                'errors': errors
            }
            raise err

        return validated_data, profile_serializers

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
        updated_set = set()
        deleted_set = set()
        updated = []
        deleted = []

        for instance in self.deleted:
            if instance.data_key in deleted_set:
                continue
            deleted_set.add(instance.data_key)
            if instance != self.instance:
                deleted.append(instance)

        for instance in self.updated:
            if (instance.data_key in updated_set or
                    instance.data_key in deleted_set):
                continue
            updated_set.add(instance.data_key)
            updated.append(instance)

        self.add_includes(updated)
        response = super(JsonApiSerializer, self).format_json_api_response(
            data, many)

        if 'included' in response:
            response['included'].sort(key=itemgetter('type', 'id'))

        deleted = self.format_profile_references(deleted)
        if deleted:
            self.add_profile_to_response(DELETED_PROFILE, DELETED_PROFILE_ALIAS,
                                         deleted, response)

        updated = self.format_profile_references(updated)
        if updated:
            self.add_profile_to_response(UPDATES_PROFILE, UPDATES_PROFILE_ALIAS,
                                         updated, response)

        if (isinstance(self.instance, Model) and
                self.instance.data_key in deleted_set):
            response.pop('data', None)
            if not response.get('meta'):
                return {}

        return order_dict(response, TOP_LEVEL_OBJECT_ORDER)

    def format_item(self, item):
        item = super(JsonApiSerializer, self).format_item(item)
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

    def add_includes(self, includes):
        included_data = self.included_data
        for instance in includes:
            type_ = type_from_model_name(instance.__class__.__name__)
            serializer = get_schema(type_)(
                instance,
                fields_map=self.fields_map,
                exclude_map=self.exclude_map)
            data = serializer.data
            item = data['data']
            included_data[(item['type'], item['id'])] = item
            included_data.update(serializer.included_data)

    def format_profile_references(self, instances):
        references = []
        for instance in instances:
            type_ = type_from_model_name(instance.__class__.__name__)
            serializer = get_schema(type_)(
                instance.with_snapshots(('working',)),
                only=('id',))
            data = serializer.data.get('data', {})
            if data:
                references.append(data)

        return references

    def add_profile_to_response(self, profile, alias, data, response):
        response.setdefault('aliases', {})[alias] = profile
        response.setdefault('links', {}).setdefault('profile', []).append(
            profile)
        response.setdefault('meta', {})[alias] = data


class JsonApiPolymorphicSerializer(object):
    def __new__(cls, base, default_model, instance=None, data=None, many=False,
                **kwargs):
        if not many:
            # in the single instance case return the correct serializer by type
            # or the default_model's serializer if type is not valid for base
            type_ = None
            if instance:
                type_ = type_from_model_name(instance.__class__.__name__)
            elif data:
                type_ = data.get('data', {}).get('type')

            if type_:
                serializer_class = get_schema(type_)
                if not issubclass(serializer_class.opts.model, base):
                    type_ = None

            if not type_:
                type_ = type_from_model_name(default_model.__name__)
                serializer_class = get_schema(type_)

            return serializer_class(
                instance=instance, data=data, many=many, **kwargs)

        if data:
            raise ValueError(
                u"You can only use a JsonApiPolymorphicSerializer with "
                u"many=True for serializing a ModelCollection")

        return super(JsonApiPolymorphicSerializer, cls).__new__(
            cls, base, default_model, instance, data, many, **kwargs)

    def __init__(self, base, default_model, instance=None, data=None,
                 many=False, **kwargs):
        # this is only used for serializing a ModelCollection
        self.base = base
        self.default_model = default_model
        self.collection = instance
        self.kwargs = kwargs

    @property
    def data(self):
        links = None
        data = []
        included = []
        included_set = set()

        default_type = type_from_model_name(self.default_model.__name__)
        default_serializer = get_schema(default_type)

        for instance in self.collection:
            type_ = type_from_model_name(instance.__class__.__name__)
            serializer_class = get_schema(type_)
            if not issubclass(serializer_class.opts.model, self.base):
                serializer_class = default_serializer

            serialized = serializer_class(instance=instance, **self.kwargs).data
            if not links and 'links' in serialized:
                links = serialized['links']
            data.append(serialized['data'])
            for include in serialized.get('included', []):
                key = (include['type'], include['id'])
                if key not in included_set:
                    included.append(include)
                    included_set.add(key)

        response = {
            'data': data
        }
        if links:
            response['links'] = links
        if included:
            included.sort(key=itemgetter('type', 'id'))
            response['included'] = included

        return order_dict(response, TOP_LEVEL_OBJECT_ORDER)
