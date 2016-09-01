import chardet
import itertools
import six

from scrapy.http import HtmlResponse, Request
from scrapy.item import DictItem
from w3lib.encoding import html_body_declared_encoding

from slyd.html import descriptify
from slyd.errors import BaseHTTPError
from slybot.baseurl import insert_base_url
_DEFAULT_VIEWPORT = '1240x680'


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


def _should_load_sample(sample):
    a = sample.get('plugins', {}).get('annotations-plugin', {}).get('extracts')
    if (sample.get('annotated_body', '').count('data-scrapy') > 1 or
            (sample.get('original_body') and a)):
        return True
    return False


def _get_viewport(viewport):
    """Check that viewport is valid and within acceptable bounds.

    >>> f = '99x99 99x100 100x99 4097x4097 1280.720 wxy'.split()
    >>> p = '100x100 1280x720 4096x2160'.split()
    >>> _get_viewport(None) == _DEFAULT_VIEWPORT
    True
    >>> all(_get_viewport(i) == _DEFAULT_VIEWPORT for i in f)
    True
    >>> all(_get_viewport(i) == i for i in p)
    True
    """
    try:
        assert viewport is not None
        v = viewport.split('x')
        if len(v) != 2:
            raise ValueError('Viewport must have width and height')
        w, h = int(v[0]), int(v[1])
        if not (99 < w < 4097 and 99 < h < 4097):
            raise ValueError('Viewport out of bounds')
    except (AssertionError, TypeError, ValueError):
        return _DEFAULT_VIEWPORT
    return viewport


def _load_res(socket, resource):
    spec = socket.manager
    try:
        return spec.resource(resource)
    except IOError:
        return {}


def _load_items_and_extractors(data, socket):
    return _load_res(socket, 'items'), _load_res(socket, 'extractors')


def _decode(html, default=None):
    if not default:
        encoding = html_body_declared_encoding(html)
        if encoding:
            default = [encoding]
        else:
            default = []
    elif isinstance(default, six.string_types):
        default = [default]
    for encoding in itertools.chain(default, ('utf-8', 'windows-1252')):
        try:
            return html.decode(encoding)
        except UnicodeDecodeError:
            pass
    encoding = chardet.detect(html).get('encoding')
    return html.decode(encoding)


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
