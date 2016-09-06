from collections import Sequence
import json
from operator import attrgetter

from django.utils.functional import cached_property
from marshmallow import ValidationError
from marshmallow_jsonapi.exceptions import IncorrectTypeError
from six import iteritems
from six.moves import map
from twisted.web.http import RESPONSES, OK, CREATED, NO_CONTENT, CONFLICT

from .response import (JsonApiResource, JsonApiErrorResponse,
                       JsonApiNotFoundResponse, JsonApiValidationErrorResponse)
from ..errors import BadRequest, BaseError
from portia_api.jsonapi.serializers import JsonApiPolymorphicSerializer
from portia_api.jsonapi.registry import get_schema
from portia_api.jsonapi.utils import type_from_model_name
from portia_orm.collection import ModelCollection
from portia_orm.exceptions import ProtectedError
from portia_orm.relationships import BelongsTo, HasMany


class JsonApiRoute(object):
    list_path = None
    detail_path = None
    default_model = None
    polymorphic = None

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

    def filter_collection(self, collection):
        if 'filter[id]' in self.query:
            if not isinstance(collection, ModelCollection):
                raise BadRequest(u"Cannot filter this collection.")

            ids = []
            for id_list in self.query.pop('filter[id]'):
                ids.extend(id_list.split(','))

            collection = collection.__class__((collection[id_] for id_ in ids))

        for key, values in iteritems(self.query):
            if key.startswith('filter[') and key[-1] == ']':
                field_name = key[7:-1]
                field_values = set()
                for field_list in values:
                    field_values.update(field_list.split(','))

                filtered = []
                for obj in collection:
                    try:
                        field = obj._fields[field_name]
                        if isinstance(field, BelongsTo):
                            related = getattr(obj, field_name)
                            filter_values = {related.pk if related else 'null'}
                        elif isinstance(field, HasMany):
                            filter_values = set(map(attrgetter('pk'),
                                                    getattr(obj, field_name)))
                        else:
                            value = getattr(obj, field_name)
                            if isinstance(value, Sequence):
                                filter_values = set(value)
                            else:
                                filter_values = {value}
                        if filter_values.intersection(field_values):
                            filtered.append(obj)

                    except (AttributeError, KeyError, TypeError):
                        # skip objects which don't have a field
                        pass
                collection = collection.__class__(filtered)

        return collection

    def get_serializer(self, instance=None, data=None, many=False, **kwargs):
        params = {}
        if self.method == 'get':
            params.update({
                'current_url': self.path,
            })
        if many:
            params.update(self.get_list_kwargs())
        else:
            params.update(self.get_detail_kwargs())
        params.update(self.get_request_kwargs())
        params.update(kwargs)

        if self.polymorphic:
            return JsonApiPolymorphicSerializer(
                base=self.polymorphic, default_model=self.default_model,
                instance=instance, data=data, many=many, **params)

        type_ = type_from_model_name(self.default_model.__name__)
        return get_schema(type_)(instance=instance, data=data, many=many,
                                 **params)

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


class CreateModelMixin(object):
    def create(self):
        serializer = self.get_serializer(data=self.data, storage=self.storage,
                                         partial={'id'})

        try:
            self.perform_create(serializer)
        except ValidationError as err:
            raise JsonApiValidationErrorResponse(err.messages)

        return JsonApiResource(CREATED, serializer.data)

    def perform_create(self, serializer):
        serializer.save()


class ListModelMixin(object):
    def list(self):
        try:
            collection = self.filter_collection(self.get_collection())
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        serializer = self.get_serializer(collection, many=True)
        return JsonApiResource(OK, serializer.data)


class RetrieveModelMixin(object):
    def retrieve(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        serializer = self.get_serializer(instance)
        return JsonApiResource(OK, serializer.data)


class UpdateModelMixin(object):
    def update(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        serializer = self.get_serializer(
            instance, data=self.data,
            partial=set(instance.__class__._ordered_fields).difference({'id'}))

        try:
            self.perform_update(serializer)
        except (ValidationError, IncorrectTypeError) as err:
            raise JsonApiValidationErrorResponse(err.messages)

        return JsonApiResource(OK, serializer.data)

    def perform_update(self, serializer):
        serializer.save()


class DestroyModelMixin(object):
    def destroy(self):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise JsonApiNotFoundResponse()

        serializer = self.get_serializer(instance, data=self.data)

        try:
            self.perform_destroy(serializer)
        except (ValidationError, IncorrectTypeError) as err:
            raise JsonApiValidationErrorResponse(err.messages)
        except ProtectedError:
            raise JsonApiErrorResponse(
                BaseError(CONFLICT, RESPONSES[CONFLICT],
                          u'You cannot delete this resource.'))

        data = serializer.data
        if data:
            return JsonApiResource(OK, data)
        return JsonApiResource(NO_CONTENT)

    def perform_destroy(self, serializer):
        return serializer.delete()


class JsonApiModelRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                        CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    pass
