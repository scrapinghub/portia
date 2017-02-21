import re

from marshmallow import fields, Schema, validate
from marshmallow.utils import get_value, missing
from six import iteritems, itervalues

from .collection import ListDescriptor
from .deletion import CASCADE, CLEAR, PROTECT
from .exceptions import ImproperlyConfigured, ValidationError
from .relationships import BelongsTo, HasMany, HasOne
from .validators import OneOf

__all__ = [
    'Boolean',
    'Domain',
    'Field',
    'List',
    'Integer',
    'Regexp',
    'String',
    'Url',
    'BelongsTo',
    'HasMany',
    'HasOne',
    'StartUrl',
    'CASCADE',
    'CLEAR',
    'PROTECT',
]


class FieldDescriptor(object):
    """Descriptor for interacting with model fields"""
    def __init__(self, attrname, field):
        self.attrname = attrname
        self.field = field

    @property
    def default(self):
        # may raise an AttributeError
        if callable(self.field.default):
            return self.field.default()
        else:
            return self.field.default

    def __get__(self, instance, instance_type=None):
        if instance is None:
            return self
        if instance.has_data(self.attrname):
            return instance.get_data(self.attrname)
        default = self.default
        if default is not missing:
            # if using default set it on the instance, since it may be
            # mutable
            instance.set_data(self.attrname, default)
            return default

        raise AttributeError(
            u"'{}' object has no attribute '{}'".format(
                instance_type.__name__, self.attrname))

    def __set__(self, instance, value):
        # validate the value against the field
        self.field.deserialize(value, attr=self.attrname, data=instance)
        instance.set_data(self.attrname, value)


class Field(fields.Field):
    def __init__(self, **kwargs):
        ignore_in_file = kwargs.pop('ignore_in_file', False)
        primary_key = kwargs.pop('primary_key', False)
        if primary_key:
            kwargs['required'] = True
        super(Field, self).__init__(**kwargs)
        self.primary_key = primary_key
        self.ignore_in_file = ignore_in_file

    def contribute_to_class(self, cls, attrname):
        setattr(cls, attrname, FieldDescriptor(attrname, self))

    def get_dependencies(self, cls):
        if self.primary_key:
            return set()
        return {cls._pk_field}

    def serialize(self, attr, obj, accessor=None):
        if self._CHECK_ATTRIBUTE:
            value = self.get_value(attr, obj, accessor=accessor)
            self._validate_missing(value)
            self._validate(value)
        return super(Field, self).serialize(attr, obj, accessor)


class ValidatedField(fields.ValidatedField, Field):
    default_error_messages = {
        'invalid': u"Invalid value.",
    }

    class Validator(validate.Validator):
        default_message = u"Invalid value."

        def __init__(self, error=None):
            self.error = error or self.default_message

        def _format_error(self, value):
            return self.error.format(input=value)

        def fail(self, value):
            raise ValidationError(self._format_error(value))

        def __call__(self, value):
            raise NotImplementedError

    validator = Validator

    def __init__(self, *args, **kwargs):
        super(ValidatedField, self).__init__(*args, **kwargs)
        self.validators.insert(0, self.validator())

    def _validated(self, value):
        self._validate(value)
        return value


class String(fields.String, Field):
    pass


class Boolean(fields.Boolean, Field):
    pass


class Integer(fields.Integer, Field):
    pass


class Url(fields.Url, Field):
    pass


class Domain(ValidatedField, String):
    default_error_messages = {
        'invalid': u"Not a valid domain.",
    }

    class ValidDomain(ValidatedField.Validator):
        # based on marshmallow's Url validator
        DOMAIN_REGEX = re.compile(
            r'^'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+'
            r'(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
            r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
            r'(?::\d+)?'  # optional port
            r'$', re.IGNORECASE)

        default_message = u"Not a valid domain."

        def __call__(self, value):
            if value and self.DOMAIN_REGEX.search(value):
                return value

            self.fail(value)

    validator = ValidDomain


class Regexp(ValidatedField, String):
    default_error_messages = {
        'invalid': u"Not a valid regular expression.",
    }

    class ValidRegexp(ValidatedField.Validator):
        default_message = u"Not a valid regular expression."

        def __call__(self, value):
            try:
                re.compile(value)
            except re.error:
                self.fail(value)
            return value

    validator = ValidRegexp


class DependantField(Field):
    default_error_messages = {
        'unknown_condition': u"Value '{value}' for field '{field}' is not "
                             u"supported",
    }

    def __init__(self, when, then, **kwargs):
        for key, field in iteritems(then):
            if not isinstance(field, Field):
                raise ImproperlyConfigured(
                    u"Invalid field for the value {!r}".format(key))
        super(DependantField, self).__init__(**kwargs)
        self.when = when
        self.then = then

    def get_dependencies(self, cls):
        return super(DependantField, self).get_dependencies(cls) | {self.when}

    def serialize(self, attr, obj, accessor=None):
        field = self._field_for_data(obj)
        return field.serialize(attr, obj, accessor)

    def deserialize(self, value, attr=None, data=None):
        field = self._field_for_data(data)
        return field.deserialize(value, attr, data)

    def _add_to_schema(self, field_name, schema):
        super(DependantField, self)._add_to_schema(field_name, schema)
        for field in itervalues(self.then):
            field._add_to_schema(field_name, schema)

    def _field_for_data(self, data):
        condition = get_value(self.when, data)
        try:
            return self.then[condition]
        except KeyError:
            self.fail('unknown_condition', value=condition, field=self.when)


class List(fields.List, Field):
    def contribute_to_class(self, cls, attrname):
        setattr(cls, attrname, ListDescriptor(attrname=attrname))


class Fragment(ValidatedField, Field):
    class ValidType(ValidatedField.Validator):
        default_message = u'The fragment type is not list, range or fixed'

        def __call__(self, value):
            if value['type'] in ['list', 'range', 'fixed']:
                return value

            self.fail(value)

    class ValidValue(ValidatedField.Validator):
        default_message = u"Invalid value for the given fragment type"
        ALL_LETTERS = r'^[a-zA-Z]+-[a-zA-Z]+$'
        ALL_NUMBERS = r'^\d+-\d+$'

        def invalid_range(self, value):
            all_letters = re.match(self.ALL_LETTERS, value['value'])
            all_numbers = re.match(self.ALL_NUMBERS, value['value'])

            return value['type'] == 'range' and not (all_letters or all_numbers)

        def __call__(self, value):
            if self.invalid_range(value):
                self.fail(value)
            return value

    def __init__(self, *args, **kwargs):
        super(Fragment, self).__init__(*args, **kwargs)
        self.validators = [self.ValidType(), self.ValidValue()]


class StartUrl(Schema):
    url = String(default='', required=True)
    type = String(validate=OneOf(['url', 'generated', 'feed']), required=True)
    fragments = List(Fragment)
