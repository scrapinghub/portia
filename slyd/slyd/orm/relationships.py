from collections import Mapping

from marshmallow import fields, utils
from six import string_types

from slyd.orm.collection import set_related, clear_related, ListDescriptor
from slyd.orm.exceptions import ImproperlyConfigured, ValidationError
from slyd.orm.registry import get_model
from slyd.orm.utils import cached_property, validate_type

__all__ = [
    'BelongsTo',
    'HasMany',
]


class BaseRelationshipDescriptor(object):
    """Descriptor for interacting with model relationships"""
    def __init__(self, model, attrname, related_name):
        self._model = model
        self.attrname = attrname
        self.related_name = related_name

    def __get__(self, instance, instance_type=None):
        raise NotImplementedError

    def __set__(self, instance, value):
        raise AttributeError

    def __repr__(self):
        return '{}({}, attrname={!r}, related_name={!r})'.format(
            self.__class__.__name__, self.model.__name__,
            self.attrname, self.related_name)

    @cached_property
    def model(self):
        if isinstance(self._model, string_types):
            self._model = get_model(self._model)
        return self._model

    def _validate(self, value):
        if value is not None:
            validate_type(value, self.model)


class BelongsToDescriptor(BaseRelationshipDescriptor):
    def __get__(self, instance, instance_type=None):
        if instance is None:
            return self
        return instance.get_data(self.attrname, None)

    def __set__(self, instance, value):
        self._validate(value)
        current_value = self.__get__(instance)

        if value != current_value:
            instance.set_data(self.attrname, value and value.with_snapshots())
            if current_value:
                current_value = current_value.with_snapshots(instance.snapshots)
                clear_related(current_value, self.related_name, instance)
            if value:
                value = value.with_snapshots(instance.snapshots)
                set_related(value, self.related_name, instance)


class HasManyDescriptor(ListDescriptor, BaseRelationshipDescriptor):
    def __init__(self, *args, **kwargs):
        BaseRelationshipDescriptor.__init__(self, *args, **kwargs)

    def new_collection(self, instance):
        # if we got here then the collection could not be loaded from instance's
        # file, so we load it through the related model
        model = self.model
        collection = model.collection(
            owner=instance,
            attrname=self.attrname,
            snapshots=('committed',))
        if (self.attrname not in instance._initializing and
                model.opts.owner in {self.related_name, False}):
            items = model.load(instance.storage, **{
                self.related_name: instance
            })
            if isinstance(items, model.collection) and items:
                collection.extend(items)
        return collection


class BaseRelationship(fields.Nested):
    descriptor_class = None

    def __init__(self, model, related_name, on_delete, ignore_in_file=False,
                 envelope=None, envelope_remove_key=None, **kwargs):
        self._model = model
        self.related_name = related_name

        if not callable(on_delete):
            raise ImproperlyConfigured(
                u"The on_delete property of a relationship must be a callable")
        self.on_delete = on_delete

        self.ignore_in_file = ignore_in_file
        self.envelope = envelope
        self.envelope_remove_key = envelope_remove_key
        super(BaseRelationship, self).__init__(None, **kwargs)

    @cached_property
    def model(self):
        if isinstance(self._model, string_types):
            self._model = get_model(self._model)
        return self._model

    @property
    def nested(self):
        return self.model.file_schema

    @nested.setter
    def nested(self, value):
        pass

    @property
    def schema(self):
        schema = super(BaseRelationship, self).schema
        if self.envelope is not None:
            schema.envelope = self.envelope
        if self.envelope_remove_key is not None:
            schema.envelope_remove_key = self.envelope_remove_key
        return schema

    def contribute_to_class(self, cls, attrname):
        if (not self.ignore_in_file and
                not isinstance(self._model, string_types)):
            if self.related_name not in self._model._fields:
                raise ImproperlyConfigured(
                    u"Model '{}' has not declared field '{}'".format(
                        self._model.__name__, self.related_name))
            related_field = self._model._fields[self.related_name]
            if related_field.related_name != attrname:
                raise ImproperlyConfigured(
                    u"Related name of Model '{}' field '{}' is not '{}'".format(
                        self._model.__name__, self.related_name, attrname))
            class_includes_relationships = \
                self._includes_relationships(self, self._model)
            related_includes_relationships = \
                (not related_field.ignore_in_file and
                 self._includes_relationships(related_field, cls))
            if class_includes_relationships and related_includes_relationships:
                raise ImproperlyConfigured(
                    u"Related fields '{}' of model '{}' and "
                    u"'{}' of model '{}' cannot both include relationships. "
                    u"Use ignore_in_file or only to limit the fields on one "
                    u"side of the relationship.".format(
                        attrname, cls.__name__,
                        self.related_name, self._model.__name__))

        descriptor = self.descriptor_class(
            self._model, attrname=attrname, related_name=self.related_name)
        setattr(cls, attrname, descriptor)

    @staticmethod
    def _includes_relationships(field, model):
        includes_relationships = True
        if field.only:
            includes_relationships = False
            for field in ([field.only]
                          if isinstance(field.only, string_types)
                          else field.only):
                if isinstance(model._fields[field], BaseRelationship):
                    includes_relationships = True
        return includes_relationships


class BelongsTo(BaseRelationship):
    descriptor_class = BelongsToDescriptor


class HasMany(BaseRelationship):
    descriptor_class = HasManyDescriptor

    def __init__(self, *args, **kwargs):
        kwargs['many'] = True
        super(HasMany, self).__init__(*args, **kwargs)

    def _deserialize(self, value, attr, data):
        if self.many and not self._is_collection(value):
            self.fail('type', input=value, type=value.__class__.__name__)
        data, errors = self.schema.load(value)
        if errors:
            raise ValidationError(errors, data=data)
        return data

    def _is_collection(self, value):
        return (isinstance(value, Mapping)
                if (self.envelope
                    if self.envelope is not None
                    else self.model.opts.envelope)
                else utils.is_collection(value))
