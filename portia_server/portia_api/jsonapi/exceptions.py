from collections import OrderedDict

from rest_framework.exceptions import APIException, ValidationError
from rest_framework.status import HTTP_409_CONFLICT

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


class JsonApiDeleteConflictError(APIException):
    status_code = HTTP_409_CONFLICT
    default_detail = u'You cannot delete this resource.'
