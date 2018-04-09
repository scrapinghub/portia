from collections import OrderedDict
from itertools import islice
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
    'uuid4',
    'validate_type',
    'AttributeDict',
    'OrderedIndexedTransformDict',
]
JSON_LEN = len('.json')
_SENTINEL = object()


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


class OrderedIndexedTransformDict(object):
    __slots__ = ('_transform', '_data')

    def __init__(self, transform, init_dict=None, **kwargs):
        if not callable(transform):
            raise TypeError('expected callable, got %r' % transform.__class__)
        self._transform = transform
        self._data = OrderedDict()
        if init_dict:
            self.update(init_dict)
        if kwargs:
            self.update(kwargs)

    def getitem(self, key):
        transformed = self._transform(key)
        value = self._data[transformed]
        return transformed, value

    def __len__(self):
        return len(self._data)

    def __iter__(self):
        return iter(self._data.keys())

    def __getitem__(self, key):
        try:
            return self._data[key]
        except KeyError:
            return self._data[self._transform(key)]

    def __setitem__(self, key, value=None):
        transformed = self._transform(key)
        self._data[transformed] = len(self._data)

    def __delitem__(self, key):
        if hasattr(key, 'indices'):
            data_len = len(self._data)
            indices = key.indices(len(self))
            if data_len <= len(range(*indices)):
                self._data = OrderedDict()
                return
            keys_to_remove = list(islice(self._data.keys(), *indices))
            for key in keys_to_remove:
                del self._data[key]
            self._data = OrderedDict((k, i) for i, k in enumerate(self._data))
        else:
            transformed = self._transform(key)
            self._remove(transformed)
            del self._data[transformed]

    def clear(self):
        self._data.clear()

    def __contains__(self, key):
        return self._transform(key) in self._data

    def get(self, key, default=None):
        return self._data.get(self._transform(key), default)

    def pop(self, key, default=_SENTINEL):
        transformed = self._transform(key)
        self._remove(transformed)
        if default is _SENTINEL:
            return self._data.pop(transformed)
        else:
            return self._data.pop(transformed, default)

    def items(self):
        return self._data.items()

    def update(self, value, **kws):
        self._data.update(value, **kws)

    def insert(self, index, value):
        data = self._data
        for k, v in data.items():
            if v >= index:
                data[k] += 1
        data[value] = index

    def replace(self, key, value):
        key = self._transform(key)
        value = self._transform(value)
        if key == value:
            return
        self._data = OrderedDict((value if k == key else k, i)
                                 for k, i in self._data.items())

    def _remove(self, key):
        data = self._data
        if key not in data:
            return
        index = data[key]
        for key, value in data.items():
            if value > index:
                data[key] = value - 1

    def popitem(self):
        transformed, value = self._data.popitem()
        return transformed, value

    def copy(self):
        other = self.__class__(self._transform)
        other._data = self._data.copy()
        return other

    __copy__ = copy

    def __getstate__(self):
        return self._transform, self._data

    def __setstate__(self, state):
        self._transform, self._data = state

    def __repr__(self):
        try:
            equiv = dict(self)
        except TypeError:
            # Some keys are unhashable, fall back on .items()
            equiv = list(self.items())
        return '{}({!r}, {})'.format(self.__class__.__name__,
                                     self._transform, equiv)
