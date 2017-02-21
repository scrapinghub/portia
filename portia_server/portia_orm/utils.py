from collections import OrderedDict
from uuid import uuid4

from django.utils.functional import cached_property
from six import iteritems

from .exceptions import ValidationError

__all__ = [
    'cached_property',
    'cached_property_ignore_set',
    'class_property',
    'short_guid',
    'unspecified',
    'uuid4'
    'validate_type',
    'AttributeDict',
]
JSON_LEN = len('.json')


class cached_property_ignore_set(cached_property):
    def __set__(self, instance, value):
        pass


class class_property(object):
    """A read-only descriptor that works on the class too"""
    def __init__(self, fget=None):
        if fget is not None and not isinstance(fget, classmethod):
            fget = classmethod(fget)
        self.fget = fget

    def __get__(self, instance, instance_type=None):
        return self.fget.__get__(instance, instance_type)()


def short_guid():
    return '-'.join(str(uuid4()).split('-')[1:4])


unspecified = object()


def validate_type(value, model):
    if not isinstance(value, model):
        raise ValidationError(
            "'{!r}' is not an instance of type '{}'".format(
                value, model.__name__))


def unwrap_envelopes(data, many, pk_field, remove_key):
    unwrapped = []
    for pk, obj in iteritems(data):
        if not remove_key:
            try:
                if obj[pk_field] != pk:
                    raise ValidationError(
                        u"Envelope id does not match value of primary key "
                        u"field")
            except KeyError:
                pass
        obj[pk_field] = pk
        unwrapped.append(obj)
    if not many and len(unwrapped) == 1:
        return unwrapped[0]
    return unwrapped


def wrap_envelopes(data, many, pk_field, remove_key):
    if not many:
        data = [data]
    wrapped = OrderedDict()
    for obj in data:
        pk = obj[pk_field]
        if remove_key:
            del obj[pk_field]
        wrapped[pk] = obj
    return wrapped


class AttributeDict(dict):
    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(
                u"'{}' object has no attribute '{}'".format(
                    self.__class__.__name__, name))


def strip_json(fname):
    if fname.endswith('.json'):
        return fname[:-JSON_LEN]
    return fname
