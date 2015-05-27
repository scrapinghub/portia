from scrapy.http import HtmlResponse

from slyd.html import descriptify
from slyd.errors import BaseHTTPError
from slybot.baseurl import insert_base_url


def clean(html, url):
    return insert_base_url(descriptify(html, url), url)


def open_tab(func):
    def wrapper(data, socket):
        if socket.tab is None:
            socket.open_tab(data.get('_meta'))
            socket.open_spider(data.get('_meta'))
        return func(data, socket)
    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper


def page(url, html):
    return HtmlResponse(url, 200, {}, html, encoding='utf-8')


class BaseWSError(BaseHTTPError):
    @property
    def status(self):
        return self._status + 4000


class BadRequest(BaseWSError):
    _status = 400


class Forbidden(BaseWSError):
    _status = 403


class NotFound(BaseWSError):
    _status = 404


class InternalServerError(BaseWSError):
    _status = 500
