from portia_orm.exceptions import ImproperlyConfigured


__all__ = [
    'get_serializer',
]

serializers = {}


def get_serializer(schema_type):
    try:
        return serializers[schema_type]
    except KeyError:
        raise ImproperlyConfigured(
            u"No schema for type '{}' exists".format(schema_type))
