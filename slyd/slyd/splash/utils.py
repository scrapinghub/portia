import six

from scrapy.http import HtmlResponse, Request
from scrapy.item import DictItem

from slyd.html import descriptify
from slyd.errors import BaseHTTPError
from slybot.baseurl import insert_base_url
from slybot.utils import encode, decode
_DEFAULT_VIEWPORT = '1240x680'


def clean(html, url):
    return insert_base_url(descriptify(html, url), url)


def decoded_html(tab, type_=None):
    if type_ == 'raw':
        stated_encoding = tab.evaljs('document.characterSet')
        return decode(tab.network_manager._raw_html or tab.html(),
                      default=stated_encoding)
    return tab.html()


def extract_data(url, html, spider, templates):
    items, links = [], []
    if isinstance(html, six.text_type):
        html = encode(html)
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


def _html_path(sample):
    path = sample.storage_path(sample)[:-len('.json')].strip('/')
    return '{}/{{}}.html'.format(path)


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


class ProjectsDict(dict):
    def __init__(self, auth):
        self.allow_all = False
        if 'projects_data' in auth:
            for project in auth['projects_data']:
                self[project['id']] = project['name']
        elif 'authorized_projects' in auth:
            for project_id in auth['authorized_projects']:
                self[project_id] = project_id
        else:
            self.allow_all = True
        self.staff = auth.get('staff', False)

    def __getitem__(self, key):
        try:
            return super(ProjectsDict, self).__getitem__(key)
        except KeyError:
            if self.allow_all or self.staff:
                return key
            raise

    def __contains__(self, key):
        if self.allow_all or self.staff:
            return True
        return super(ProjectsDict, self).__contains__(key)
