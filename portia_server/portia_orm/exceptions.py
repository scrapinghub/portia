from marshmallow.exceptions import ValidationError

__all__ = [
    'ImproperlyConfigured',
    'ValidationError',
]


class ImproperlyConfigured(Exception):
    pass


class PathResolutionError(Exception):
    pass


class ProtectedError(Exception):
    pass
