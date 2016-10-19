class BaseError(Exception):
    def __init__(self, status, title, body=''):
        self._status = status
        self._title = title
        self._body = body

    @property
    def title(self):
        return self._title

    @property
    def body(self):
        return self._body

    @property
    def status(self):
        return self._status

    def __repr__(self):
        return '%s(%s)' % (self.__class__.__name__, str(self))

    def __str__(self):
        return '%s: %s' % (self.status, self.title)


class BaseHTTPError(BaseError):
    _status = 999

    def __init__(self, title, body=''):
        super(BaseHTTPError, self).__init__(self._status, title, body)


class BadRequest(BaseHTTPError):
    _status = 400
