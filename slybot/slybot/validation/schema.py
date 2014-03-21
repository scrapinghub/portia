"""Simple validation of specifications passed to slybot"""
from os.path import dirname, join
import json, re
from urlparse import urlparse

from jsonschema import Draft3Validator, ValidationError, RefResolver

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
    def validate_format(self, fmt, instance, schema):
        if schema["type"] != "string":
            raise ValidationError("Invalid keyword 'format' for type '%s'" % schema["type"])

        if fmt == "regex":
            try:
                re.compile(instance)
            except:
                raise ValidationError("Invalid regular expression: %s" % repr(instance))
        elif fmt == "url":
            parsed = urlparse(instance)
            if not parsed.scheme or not parsed.netloc:
                raise ValidationError("Invalid url: '%s'" % repr(instance))
               
        return None

def get_schema_validator(schema):
    resolver = RefResolver("", schema, _SCHEMAS)
    return SlybotJsonSchemaValidator(_SCHEMAS[schema], resolver=resolver)

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

