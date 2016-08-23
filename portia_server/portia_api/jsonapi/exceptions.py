from collections import OrderedDict

from rest_framework.exceptions import APIException, ValidationError
from rest_framework.status import (HTTP_400_BAD_REQUEST, HTTP_409_CONFLICT,
                                   HTTP_404_NOT_FOUND)

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
