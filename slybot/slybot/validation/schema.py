"""Simple validation of specifications passed to slybot"""
from __future__ import absolute_import
from os.path import dirname, join
import json
import rfc3987

from urlparse import urlparse, parse_qsl
from urllib import urlencode
from urllib2 import unquote

from jsonschema import (Draft3Validator, RefResolver, FormatChecker,
                        ValidationError)
import six


_PATH = dirname(__file__)


def load_schemas():
    filename = join(_PATH, "schemas.json")
    return dict((s["id"], s) for s in json.load(open(filename)))

_SCHEMAS = load_schemas()


class SlybotJsonSchemaValidator(Draft3Validator):
    DEFAULT_TYPES = Draft3Validator.DEFAULT_TYPES.copy()
    DEFAULT_TYPES.update({
        "mapping": dict,
    })


def get_schema_validator(schema):
    resolver = RefResolver("", schema, _SCHEMAS)

    @FormatChecker.cls_checks('url', (ValueError,))
    def is_valid_uri(instance):
        if not isinstance(instance, six.string_types):
            return True
        uri = urlparse(instance)
        query = urlencode(parse_qsl(unquote(uri.query.encode('utf-8'))))
        return rfc3987.parse(uri._replace(query=query).geturl(),
                             rule='URI')

    return SlybotJsonSchemaValidator(_SCHEMAS[schema], resolver=resolver,
                                     format_checker=FormatChecker())


def validate_project_schema(specs):

    project = specs["project"]
    get_schema_validator("project").validate(project)

    items = specs["items"]
    get_schema_validator("items").validate(items)

    extractors = specs["extractors"]
    get_schema_validator("extractors").validate(extractors)

    spider_schema_validator = get_schema_validator("spider")
    for spider in specs["spiders"].values():
        spider_schema_validator.validate(spider)

    return True
