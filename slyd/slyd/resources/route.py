from collections import Sequence
import json
from operator import attrgetter

from django.utils.functional import cached_property
from marshmallow import ValidationError
from marshmallow_jsonapi.exceptions import IncorrectTypeError
from six import iteritems
from twisted.web.http import RESPONSES, OK, CREATED, NO_CONTENT, CONFLICT

from .response import (JsonApiResource, JsonApiErrorResponse,
                       JsonApiNotFoundResponse, JsonApiValidationErrorResponse)
from ..errors import BadRequest, BaseError
from ..jsonapi.registry import get_schema
from ..jsonapi.utils import type_from_model_name
from ..orm.base import AUTO_PK
from ..orm.collection import ModelCollection
from ..orm.exceptions import ImproperlyConfigured, ProtectedError
from ..orm.relationships import BelongsTo, HasMany

DELETED_PROFILE = 'https://portia.scrapinghub.com/jsonapi/extensions/deleted'
UPDATES_PROFILE = 'https://portia.scrapinghub.com/jsonapi/extensions/updates'


class JsonApiRoute(object):
    list_path = None
    detail_path = None
    serializer_class = None

    list_method_map = {
        'get': 'list',
        'post': 'create',
    }

    detail_method_map = {
        'get': 'retrieve',
        'put': 'update',
        'patch': 'update',
        'delete': 'destroy',
    }

    def __init__(self, route_path=None, request=None, args=None,
                 project_manager=None, project_spec=None):
        self.route_path = route_path
        self.request = request
        self.args = args or {}
        self.project_manager = project_manager
        self.project_spec = project_spec

    def __repr__(self):
        return 'Route(%s)' % str(self)

    @cached_property
    def method(self):
        return self.request.method.lower()

    @cached_property
    def path(self):
        return self.request.path

    @cached_property
    def query(self):
        return self.request.args or {}

    @cached_property
    def storage(self):
        manager = self.project_spec or self.project_manager
        if not hasattr(manager, 'storage') and hasattr(manager, 'project_name'):
            manager._open_repo()
        return getattr(manager, 'storage', None)

    @cached_property
    def data(self):
        try:
            return json.loads(self.request.content.read())
        except ValueError:
            return {}

    @classmethod
    def get_resources(cls):
        if cls.list_path:
            for method, handler in iteritems(cls.list_method_map):
                if hasattr(cls, handler):
                    yield method, cls.list_path

        if cls.detail_path:
            for method, handler in iteritems(cls.detail_method_map):
                if hasattr(cls, handler):
                    yield method, cls.detail_path

    def get_handler(self):
        if self.route_path == self.list_path:
            return getattr(self, self.list_method_map[self.method])
        return getattr(self, self.detail_method_map[self.method])

    def dispatch(self):
        manager = self.project_spec or self.project_manager
        return manager.run(self.dispatch_with_storage)

    def dispatch_with_storage(self):
        handler = self.get_handler()
        self.storage  # initialize storage
        return handler()

    def get_instance(self):
        raise NotImplementedError

    def get_collection(self):
        raise NotImplementedError

    @staticmethod
    def get_empty():
        return {
            'meta': {},
        }

    def add_profile(self, extension, alias, data=None):
        if data is None:
            data = {}
        data.setdefault('aliases', {})[alias] = extension
        data.setdefault('links', {}).setdefault('profile', []).append(extension)
        return data

    def add_deleted(self, deleted_instances, main_instance, data):
        deleted_items = []
        for deleted in deleted_instances:
            if deleted is main_instance:
                continue

            deleted_type = type_from_model_name(deleted.__class__.__name__)
            deleted_schema = get_schema(deleted_type)
            deleted_serialized = deleted_schema(only=('id',)).dump(
                deleted.with_snapshots(('working',))).data.get('data', {})
            if deleted_serialized:
                deleted_items.append(deleted_serialized)

        if deleted_items:
            data = self.add_profile(DELETED_PROFILE, 'deleted', data)
            data.setdefault('meta', {})['deleted'] = deleted_items

        return data

    def add_updates(self, updated_instances, data):
        updated_items = []
        for updated in updated_instances:
            updated_type = type_from_model_name(updated.__class__.__name__)
            updated_schema = get_schema(updated_type)
            updated_serialized = updated_schema(only=('id',)).dump(
                updated.with_snapshots(('working',))).data.get('data', {})
            if updated_serialized:
                updated_items.append(updated_serialized)

        if updated_items:
            data = self.add_profile(UPDATES_PROFILE, 'updates', data)
            data.setdefault('meta', {})['updates'] = updated_items

        return data

    def serialize_instance(self, instance, includes=()):
        kwargs = {}
        if self.method == 'get':
            kwargs.update({
                'current_url': self.path,
            })
        kwargs.update(self.get_detail_kwargs())
        kwargs.update(self.get_request_kwargs())
        serializer = self.get_serializer(**kwargs)
        if serializer.opts.model is not instance.__class__:
            type_ = type_from_model_name(instance.__class__.__name__)
            # these will not be relevant when serializing a different type
            kwargs.pop('include_data', None)
            kwargs.pop('ordering', None)
            serializer = get_schema(type_)(**kwargs)
        included_data = serializer.included_data
        for include in includes:
            data = self.serialize_instance(include)
            item = data['data']
            included_data[(item['type'], item['id'])] = item
            for item in data.get('included', []):
                included_data[(item['type'], item['id'])] = item
        return serializer.dump(instance).data

    def serialize_collection(self, collection, includes=()):
        kwargs = {
            'many': True,
        }
        if self.method == 'get':
            kwargs.update({
                'current_url': self.path,
            })
        kwargs.update(self.get_list_kwargs())
        kwargs.update(self.get_request_kwargs())
        serializer = self.get_serializer(**kwargs)
        if serializer.opts.model is not collection.model:
            type_ = type_from_model_name(collection.model.__name__)
            serializer = get_schema(type_)(**kwargs)
        included_data = serializer.included_data
        for include in includes:
            data = self.serialize_instance(include)
            item = data['data']
            included_data[(item['type'], item['id'])] = item
            for item in data.get('included', []):
                included_data[(item['type'], item['id'])] = item
        return serializer.dump(collection).data

    def deserialize_data(self, data, only=(), partial=False, type_=None):
        if type_ is None:
            serializer = self.get_serializer(only=only, partial=partial)
        else:
            serializer = get_schema(type_)(only=only, partial=partial)
        return serializer.load(data).data

    def deserialize_related_model(self, model, id_):
        return model(self.storage, **{
            model._pk_field: id_,
        })

    def filter_collection(self, collection):
        if 'filter[id]' in self.query:
            if not isinstance(collection, ModelCollection):
                raise BadRequest(u"Cannot filter this collection.")

            ids = []
            for id_list in self.query.pop('filter[id]'):
                ids.extend(id_list.split(','))

            collection = collection.__class__((collection[id_] for id_ in ids))

        try:
            for key, values in iteritems(self.query):
                if key.startswith('filter[') and key[-1] == ']':
                    field = key[7:-1]
                    fields = set()
                    for field_list in values:
                        fields.update(field_list.split(','))

                    filtered = []
                    for obj in collection:
                        if isinstance(obj._fields[field], BelongsTo):
                            filter_values = {getattr(obj, field).pk}
                        elif isinstance(obj._fields[field], HasMany):
                            filter_values = set(map(attrgetter('pk'),
                                                    getattr(obj, field)))
                        else:
                            value = getattr(obj, field)
                            if isinstance(value, Sequence):
                                filter_values = set(value)
                            else:
                                filter_values = {value}
                        if filter_values.intersection(fields):
                            filtered.append(obj)

                    collection = collection.__class__(filtered)
        except (AttributeError, TypeError):
            # ignore invalid fields
            pass

        return collection

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def get_detail_kwargs(self):
        return {}

    def get_list_kwargs(self):
        return self.get_detail_kwargs()

    def get_request_kwargs(self):
        kwargs = {}

        if 'include' in self.query:
            include = []
            for include_list in self.query['include']:
                include.extend(include_list.split(','))
            kwargs['include_data'] = include

        fields = {}
        for key, values in iteritems(self.query):
            if key.startswith('fields[') and key[-1] == ']':
                field = key[7:-1]
                for field_list in values:
                    if field in fields:
                        fields[field].extend(field_list.split(','))
                    else:
                        fields[field] = field_list.split(',')
                    kwargs['fields_map'] = fields

        if 'sort' in self.query:
            sort_ = []
            for sort_list in self.query['sort']:
                sort_.extend(sort_list.split(','))
            kwargs['ordering'] = sort_

        return kwargs


class BaseUpdateModelMixin(object):
    def perform_update(self, instance, data, type_=None):
        if type_ is None:
            model = self.serializer_class.opts.model
        else:
            model = instance.__class__

        attributes = self.deserialize_data(
            data, partial=set(model._ordered_fields).difference({'id'}),
            type_=type_)

        fields = []
        for attrname in model._ordered_fields:
            if attrname in attributes:
                value = attributes[attrname]
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

        instance.save(only=fields)
        return []

    def apply_profile_updates(self):
        if UPDATES_PROFILE not in self.data.get('links', {}).get('profile', []):
            return [], []
        for alias, profile in iteritems(self.data.get('aliases', {})):
            if profile == UPDATES_PROFILE:
                break
        else:
            return [], []

        errors = []
        updated = []
        deleted = []
        for i, update in enumerate(self.data.get('meta', {}).get(alias, [])):
            type_ = update.get('type')
            if type_:
                try:
                    serializer = get_schema(type_)
                except ImproperlyConfigured:
                    errors.append({
                        'detail': 'Invalid type: {}'.format(type_),
                        'source': {
                            'pointer': '/meta/{}/{}/data/type'.format(alias, i),
                        },
                    })
                    continue
                try:
                    data = {
                        'data': update,
                    }
                    type_ = update.get('type')
                    id_ = self.deserialize_data(
                        data, only=('id',), type_=type_)['id']
                    instance = self.deserialize_related_model(
                        serializer.opts.model, id_)
                    updated.append(instance)
                    for deleted_obj in self.perform_update(
                            instance, data, type_=type_):
                        if deleted_obj not in deleted:
                            deleted.append(deleted_obj)
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

        return updated, deleted


class CreateModelMixin(BaseUpdateModelMixin):
    def create(self):
        errors = []

        try:
            instance = self.perform_create(self.data)
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        try:
            updated, deleted = self.apply_profile_updates()
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        if errors:
            raise JsonApiValidationErrorResponse({
                'errors': errors
            })

        updated = [u for u in updated if u not in deleted]
        data = self.serialize_instance(instance, includes=updated)
        if updated:
            data = self.add_updates(updated, data)
        if deleted:
            data = self.add_deleted(deleted, instance, data)
        return JsonApiResource(CREATED, data)

    def perform_create(self, data):
        model = self.serializer_class.opts.model
        attributes = self.deserialize_data(data, partial=('id',))

        processed_attributes = {
            model._pk_field: AUTO_PK,
        }
        for attrname, value in iteritems(attributes):
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
                for v in (value if isinstance(value, list) else [value]):
                    getattr(v, related_name)
            processed_attributes[attrname] = value

        instance = model(self.storage, **processed_attributes)
        instance.save()
        return instance


class ListModelMixin(object):
    def list(self):
        try:
            collection = self.filter_collection(self.get_collection())
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        return JsonApiResource(OK, self.serialize_collection(collection))


class RetrieveModelMixin(object):
    def retrieve(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        return JsonApiResource(OK, self.serialize_instance(instance))


class UpdateModelMixin(BaseUpdateModelMixin):
    def update(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        errors = []

        try:
            deleted = self.perform_update(instance, self.data)
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        try:
            updated, more_deleted = self.apply_profile_updates()
        except (ValidationError, IncorrectTypeError) as err:
            errors.extend(err.messages.get('errors', []))

        if errors:
            raise JsonApiValidationErrorResponse({
                'errors': errors
            })

        for deleted_obj in more_deleted:
            if deleted_obj not in deleted:
                deleted.append(deleted_obj)
        updated = [u for u in updated if u not in deleted]
        data = self.serialize_instance(instance, includes=updated)
        if updated:
            data = self.add_updates(updated, data)
        if deleted:
            data = self.add_deleted(deleted, instance, data)
        return JsonApiResource(OK, data)


class DestroyModelMixin(BaseUpdateModelMixin):
    def destroy(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        try:
            deleted = self.perform_destroy(instance)
        except ProtectedError:
            raise JsonApiErrorResponse(
                BaseError(
                    CONFLICT,
                    RESPONSES[CONFLICT],
                    'You cannot delete this resource.'))

        try:
            updated, more_deleted = self.apply_profile_updates()
        except (ValidationError, IncorrectTypeError) as err:
            raise JsonApiValidationErrorResponse(err.messages)

        for deleted_obj in more_deleted:
            if deleted_obj not in deleted:
                deleted.append(deleted_obj)
        updated = [u for u in updated if u not in deleted]
        if not updated and len(deleted) == 1 and deleted[0] == instance:
            return JsonApiResource(NO_CONTENT)

        if updated:
            # serialize all update using the first instance, but return them
            # all in the included attribute
            data = self.serialize_instance(updated[0], includes=updated[1:])
            data.setdefault('included', []).insert(0, data.pop('data'))
            # response needs a top level meta attribute if data is missing
            data.setdefault('meta', {})
            data = self.add_updates(updated, data)
        else:
            data = self.get_empty()
        return JsonApiResource(OK, self.add_deleted(deleted, instance, data))

    def perform_destroy(self, instance):
        return instance.delete()
