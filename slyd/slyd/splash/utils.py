from scrapy.http import HtmlResponse, Request
from scrapy.item import DictItem

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


def extract_data(url, html, spider, templates):
    items, links = [], []
    for value in spider.parse(page(url, html)):
        if isinstance(value, Request):
            links.append(value.url)
        elif isinstance(value, DictItem):
            value['_template_name'] = _get_template_name(value['_template'],
                                                         templates)
            items.append(value._values)
        else:
            raise ValueError("Unexpected type %s from spider" %
                             type(value))
    return items, links


def page(url, html):
    return HtmlResponse(url, 200, {}, html, encoding='utf-8')


def _get_template_name(template_id, templates):
    for template in templates:
        if template['page_id'] == template_id:
            return template['name']


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
