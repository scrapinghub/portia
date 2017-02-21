from portia_orm.exceptions import ImproperlyConfigured


__all__ = [
    'schema',
]

schemas = {}


def get_schema(schema_type):
    try:
        return schemas[schema_type]
    except KeyError:
        raise ImproperlyConfigured(
            u"No schema for type '{}' exists".format(schema_type))
