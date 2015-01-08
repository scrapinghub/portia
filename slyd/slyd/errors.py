class BaseError(Exception):
    def __init__(self, status, title, body=''):
        self.status = status
        self.title = title
        self.body = body


class BaseHTTPError(BaseError):
    status = 999

    def __init__(self, title, body=''):
        super(BaseHTTPError, self).__init__(self.status, title, body)


class BadRequest(BaseHTTPError):
    status = 400


class Forbidden(BaseHTTPError):
    status = 403


class NotFound(BaseHTTPError):
    status = 404


class InternalServerError(BaseHTTPError):
    status = 500
