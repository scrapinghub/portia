from collections import defaultdict, OrderedDict

from django.utils.text import camel_case_to_spaces
from requests.status_codes import _codes as status_codes
from six import iteritems
from six.moves import reduce

from portia_orm.utils import cached_property, cached_property_ignore_set

__all__ = [
    'cached_property',
    'cached_property_ignore_set',
    'dasherize',
    'deep_getattr',
    'order_dict',
    'should_include_field',
    'type_from_model_name',
    'LINKS_OBJECT_ORDER',
    'RESOURCE_OBJECT_ORDER',
    'TOP_LEVEL_OBJECT_ORDER',
]

TOP_LEVEL_OBJECT_ORDER = (
    'jsonapi',
    'aliases',
    'links',
    'data',
    'errors',
    'included',
    'meta',
)

RESOURCE_OBJECT_ORDER = (
    'type',
    'id',
    'links',
    'attributes',
    'relationships',
    'meta',
)

LINKS_OBJECT_ORDER = (
    'self',
    'related',
    'profile',
)


def camel_case_to_dashes(value):
    return '-'.join(camel_case_to_spaces(value).split(' '))


def dasherize(value):
    return str(value).replace('_', '-')


def type_from_model_name(value):
    return '{}s'.format(camel_case_to_dashes(value))


def deep_getattr(obj, key):
    try:
        return reduce(getattr, key.split('.'), obj)
    except AttributeError:
        return None


def should_include_field(field, include, exclude):
    if include is not None:
        return field in include
    if exclude is not None:
        return field not in exclude
    return True


def order_dict(data, ordered_keys, key_map_cache={}):
    can_cache = True
    try:
        key_map = key_map_cache.get(ordered_keys)
    except TypeError:
        key_map = None
        can_cache = False
    if key_map is None:
        key_map = defaultdict(lambda: float('inf'))
        for i, k in enumerate(ordered_keys):
            if k not in key_map:
                key_map[k] = i
        if can_cache:
            key_map_cache[ordered_keys] = key_map
    return OrderedDict(sorted(iteritems(data), key=lambda kv: key_map[kv[0]]))


def get_status_title(status_code):
    return status_codes[status_code][0].replace('_', ' ').title()
