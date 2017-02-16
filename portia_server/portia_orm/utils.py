import itertools
import chardet
import six

from collections import OrderedDict
from uuid import uuid4

from w3lib.encoding import html_body_declared_encoding
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
# Encodings: https://w3techs.com/technologies/overview/character_encoding/all
ENCODINGS = ['UTF-8', 'ISO-8859-1', 'Windows-1251', 'Shift JIS',
             'Windows-1252', 'GB2312', 'EUC-KR', 'EUC-JP', 'GBK', 'ISO-8859-2',
             'Windows-1250', 'ISO-8859-15', 'Windows-1256', 'ISO-8859-9',
             'Big5', 'Windows-1254', 'Windows-874']
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


def encode(html, default=None):
    return _encode_or_decode_string(html, type(html).encode, default)


def decode(html, default=None):
    return _encode_or_decode_string(html, type(html).decode, default)


def _encode_or_decode_string(html, method, default):
    if not default:
        encoding = html_body_declared_encoding(html)
        if encoding:
            default = [encoding]
        else:
            default = []
    elif isinstance(default, six.string_types):
        default = [default]
    for encoding in itertools.chain(default, ENCODINGS):
        try:
            return method(html, encoding)
        except UnicodeDecodeError:
            pass
    encoding = chardet.detect(html).get('encoding')
    return method(html, encoding)


def strip_json(fname):
    if fname.endswith('.json'):
        return fname[:-JSON_LEN]
    return fname
