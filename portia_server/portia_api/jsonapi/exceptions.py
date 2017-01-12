from collections import OrderedDict
from uuid import uuid4

from rest_framework.exceptions import APIException, ValidationError
from rest_framework.status import (HTTP_400_BAD_REQUEST, HTTP_409_CONFLICT,
                                   HTTP_404_NOT_FOUND)
from rest_framework.views import exception_handler


from .utils import get_status_title


class JsonApiValidationError(ValidationError):
    def __init__(self, detail):
        super(JsonApiValidationError, self).__init__({
            'errors': [OrderedDict([
                ('status', self.status_code),
                ('title', get_status_title(self.status_code)),
                ('detail', error['detail']),
                ('source', error['source']),
            ]) for error in detail.get('errors', [])]
        })


def render_exception(status_code, detail):
    return {
        'errors': [OrderedDict([
            ('id', str(uuid4())),
            ('status', status_code),
            ('title', get_status_title(status_code)),
            ('detail', detail)
        ])]
    }


class JsonApiBadRequestError(APIException):
    status_code = HTTP_400_BAD_REQUEST
    default_detail = (u"The server cannot process the request due to invalid "
                      u"data.")


class JsonApiNotFoundError(APIException):
    status_code = HTTP_404_NOT_FOUND
    default_detail = u"Could not find the resource specified"


class JsonApiConflictError(APIException):
    status_code = HTTP_409_CONFLICT
    default_detail = u"The server cannot process the request due to a conflict."


class JsonApiFeatureNotAvailableError(JsonApiBadRequestError):
    default_detail = u"This feature is not available for your project."


class JsonApiGeneralException(APIException):
    def __init__(self, detail=None, status_code=None):
        assert status_code is not None
        self.status_code = status_code
        super(JsonApiGeneralException, self).__init__(detail)


def jsonapi_exception_handler(exc, context):
    accepts = context['request'].accepted_media_type or ''
    if accepts.startswith('application/vnd.api+json'):
        try:
            exc.detail = render_exception(exc.status_code, exc.detail)
        except AttributeError:
            pass  # Ignore django exceptions
    response = exception_handler(exc, context)
    return response
