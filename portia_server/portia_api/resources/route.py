from collections import Sequence, OrderedDict
from operator import attrgetter

from django.db import transaction
from django.http.response import Http404
from django.utils.functional import cached_property
from marshmallow import ValidationError
from marshmallow_jsonapi.exceptions import IncorrectTypeError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import (HTTP_200_OK, HTTP_201_CREATED,
                                   HTTP_204_NO_CONTENT)
from rest_framework.viewsets import ViewSet
from six import iterkeys, text_type
from six.moves import map

from portia_orm.collection import ModelCollection
from portia_orm.exceptions import ProtectedError
from portia_orm.relationships import BelongsTo, HasMany
from storage import create_project_storage
from ..jsonapi.exceptions import (JsonApiBadRequestError,
                                  JsonApiConflictError,
                                  JsonApiValidationError,
                                  render_exception)
from ..jsonapi.parsers import JSONApiParser, JSONParser
from ..jsonapi.registry import get_schema
from ..jsonapi.renderers import JSONApiRenderer, JSONRenderer
from ..jsonapi.serializers import JsonApiPolymorphicSerializer
from ..jsonapi.utils import get_status_title, type_from_model_name


class JsonApiRoute(ViewSet):
    default_model = None
    polymorphic = None
    permission_classes = (IsAuthenticated,)
    parser_classes = (JSONApiParser, JSONParser)
    renderer_classes = (JSONApiRenderer, JSONRenderer)

    def __str__(self):
        return '{} {}'.format(self.method.upper(), self.path)

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
        return self.request.query_params or {}

    @cached_property
    def data(self):
        return self.request.data or {}

    @cached_property
    def user(self):
        return self.request.user

    @cached_property
    def storage(self):
        if 'project_id' in self.kwargs:
            return create_project_storage(
                self.kwargs['project_id'], author=self.user)
        return None

    @transaction.atomic
    def dispatch(self, request, *args, **kwargs):
        return super(JsonApiRoute, self).dispatch(request, *args, **kwargs)

    def handle_exception(self, exc):
        response = super(JsonApiRoute, self).handle_exception(exc)
        if isinstance(exc, Http404):
            response.data['detail'] = "Resource '%s' not found." % self.path
        status_code = response.status_code
        if (isinstance(response.data, dict) and len(response.data) == 1 and
                'detail' in response.data):
            response.data = render_exception(status_code, response.data['detail'])
        return response

    def get_instance(self):
        raise NotImplementedError

    def get_collection(self):
        raise NotImplementedError

    def filter_collection(self, collection):
        if 'filter[id]' in self.query:
            if not isinstance(collection, ModelCollection):
                raise JsonApiBadRequestError(u"Cannot filter this collection.")

            ids = []
            for id_list in self.query.getlist('filter[id]'):
                ids.extend(id_list.split(','))

            collection = collection.__class__((collection[id_] for id_ in ids))

        for key in iterkeys(self.query):
            if key != 'filter[id]' and key.startswith('filter[') and key[-1] == ']':
                field_name = key[7:-1]
                field_values = set()
                for field_list in self.query.getlist(key):
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
        return get_schema(type_)(
            instance=instance, data=data, many=many, **params)

    def get_detail_kwargs(self):
        return {}

    def get_list_kwargs(self):
        return self.get_detail_kwargs()

    def get_request_kwargs(self):
        kwargs = {}

        if 'include' in self.query:
            include = []
            for include_list in self.query.getlist('include'):
                include.extend(include_list.split(','))
            kwargs['include_data'] = include

        fields = {}
        for key in iterkeys(self.query):
            if key.startswith('fields[') and key[-1] == ']':
                field = key[7:-1]
                for field_list in self.query.getlist(key):
                    if field in fields:
                        fields[field].extend(field_list.split(','))
                    else:
                        fields[field] = field_list.split(',')
                    kwargs['fields_map'] = fields

        if 'sort' in self.query:
            sort_ = []
            for sort_list in self.query.getlist('sort'):
                sort_.extend(sort_list.split(','))
            kwargs['ordering'] = sort_

        return kwargs


class CreateModelMixin(object):
    def create(self, *args, **kwargs):
        serializer = self.get_serializer(data=self.data, storage=self.storage,
                                         partial={'id'})

        try:
            self.perform_create(serializer)
        except ValidationError as err:
            raise JsonApiValidationError(err.messages)

        data = serializer.data
        self.storage.commit()
        headers = self.get_success_headers(data)
        return Response(data, status=HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    def get_success_headers(self, data):
        try:
            return {
                'Location': data['data']['links']['self']
            }
        except (TypeError, KeyError):
            return {}


class ListModelMixin(object):
    def list(self, *args, **kwargs):
        try:
            collection = self.filter_collection(self.get_collection())
        except (TypeError, IndexError, KeyError):
            raise Http404

        serializer = self.get_serializer(collection, many=True)
        return Response(serializer.data, status=HTTP_200_OK)


class RetrieveModelMixin(object):
    def retrieve(self, *args, **kwargs):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise Http404

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=HTTP_200_OK)


class UpdateModelMixin(object):
    def update(self, *args, **kwargs):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise Http404

        if kwargs.pop('partial', False):
            partial = set(instance.__class__._ordered_fields).difference({'id'})
        else:
            partial = False

        serializer = self.get_serializer(
            instance, data=self.data, partial=partial)

        try:
            self.perform_update(serializer)
        except (ValidationError, IncorrectTypeError) as err:
            raise JsonApiValidationError(err.messages)

        data = serializer.data
        self.storage.commit()
        return Response(data, status=HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save()


class DestroyModelMixin(object):
    def destroy(self, *args, **kwargs):
        try:
            instance = self.get_instance()
        except (TypeError, IndexError, KeyError):
            raise Http404

        serializer = self.get_serializer(instance, data=self.data)

        try:
            self.perform_destroy(serializer)
        except (ValidationError, IncorrectTypeError) as err:
            raise JsonApiValidationError(err.messages)
        except ProtectedError:
            raise JsonApiConflictError(u"You cannot delete this resource.")

        data = serializer.data
        self.storage.commit()
        if data:
            return Response(data, status=HTTP_200_OK)
        return Response(status=HTTP_204_NO_CONTENT)

    def perform_destroy(self, serializer):
        return serializer.delete()


class JsonApiModelRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                        CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    pass
