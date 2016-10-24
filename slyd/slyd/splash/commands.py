import contextlib
import hashlib
import json
import logging
import re
import six
import socket as _socket

from six.moves.urllib.parse import urlparse
from django.utils.functional import cached_property

from scrapy import Request
from scrapy.settings import Settings
from splash.browser_tab import JsError
from splash.har.qt import cookies2har

from slybot.plugins.scrapely_annotations import Annotations as BotAnnotations

from portia_orm.models import Project

from .utils import open_tab, extract_data, _get_viewport, _decode
_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')
_SPIDER_LOG = logging.getLogger('spider')
_SETTINGS = Settings()
_SETTINGS.set('SPLASH_URL', 'http://splash')


def cookies(socket):
    cookies_list = socket.tab.network_manager.cookiejar.allCookies()
    message = {
        '_command': 'cookies',
        'cookies': cookies2har(cookies_list)
    }
    socket.sendMessage(message)


def save_html(data, socket):
    c = ItemChecker(socket, data['project'], data['spider'],
                    data['sample'])
    project = Project(socket.storage, id=data['project'])
    socket.spiderspec.project = project
    spider = project.spiders[data['spider']]
    samples = spider.samples
    sample = samples[data['sample']]
    if sample.rendered_body and not data.get('update'):
        return
    if 'use_live' not in data:
        data['use_live'] = c.using_js
    sample.body = 'rendered_body' if data.get('use_live') else 'original_body'
    sample.rendered_body = c.html
    sample.original_body = c.raw_html
    _update_sample(data, socket, sample, save=True)


@open_tab
def extract_items(data, socket):
    """Use latest annotations to extract items from current page"""
    project, spider, sample = data['project'], data['spider'], data.get('sample')
    if not all((project, spider)):
        return {'type': 'raw'}
    c = ItemChecker(socket, project, spider, sample)
    # TODO: add option for user to view raw and js items in UI from WS
    items, changes, changed_values, links = c.extract()
    print '----------------------------------'
    print 'Items:', items
    print '----------------------------------'
    return {'links': links, 'items': items, 'changes': changes,
            'changed': changed_values, 'type': 'js' if c.using_js else 'raw'}


def _update_sample(data, socket, sample=None, project=None, save=False,
                   use_live=False):
    """Recompile sample with latest annotations"""
    if sample is None:
        project = project or socket.spiderspec.project
        spiders = project.spiders
        spider = spiders[data['spider']]
        samples = spider.samples
        sample = samples[data['sample']].dump()
    if use_live:
        try:
            sample['original_body'] = socket.tab.html()
        except (TypeError, ValueError):
            pass
    if save and hasattr(sample, 'save'):
        sample.save()
        return sample.dump()
    return sample


def update_spider(data, socket, spider=None):
    if not socket.spiderspec:
        return
    if spider is None:
        spider = socket.spiderspec.project.spiders[data['spider']].dump()
    socket.spider._configure_js(spider, _SETTINGS)
    socket.spider.plugins['Annotations'].build_url_filter(spider)
    return extract(socket)


@open_tab
def load_page(data, socket):
    """Load page in virtual url from provided url"""
    if 'url' not in data:
        return {'error': 4001, 'message': 'Required parameter url'}

    socket.tab.loaded = False
    meta = data.get('_meta', {})

    def on_complete(is_error, error_info=None):
        extra_meta = {'id': meta.get('id')}
        if is_error:
            msg = 'Unknown error' if error_info is None else error_info.text
            extra_meta.update(error=4500, reason=msg)
        else:
            socket.tab.loaded = True
        socket.sendMessage(metadata(socket, extra_meta))
        cookies(socket)

    # Specify the user agent directly in the headers
    # Workaround for https://github.com/scrapinghub/splash/issues/290
    headers = {}
    if "user_agent" in meta:
        headers['User-Agent'] = meta['user_agent']
    socket.tab.go(data['url'],
                  lambda: on_complete(False),
                  lambda err=None: on_complete(True, err),
                  baseurl=data.get('baseurl'),
                  headers=headers)


@open_tab
def interact_page(data, socket):
    """Execute JS event from front end on virtual tab"""
    event = json.dumps(data.get('interaction', {}))
    try:
        socket.tab.evaljs('window.livePortiaPage.sendEvent(%s);' % event)
    except JsError as e:
        print(e)
    cookies(socket)


def resolve(data, socket):
    result = {'id': data.get('_meta', {}).get('id')}
    try:
        url = data['url']
        parsed = urlparse(url)
        port = 443 if parsed.scheme == 'https' else 80
        _socket.getaddrinfo(parsed.hostname, port)
    except KeyError:
        result['error'] = 'Can\'t create a spider without a start url'
    except _socket.gaierror:
        result['error'] = 'Could not resolve "%s"' % url
    return result


def metadata(socket, extra={}):
    if not socket.tab:
        return {'_command': 'metadata', 'loaded': False}
    res = {'_command': 'metadata', 'loaded': socket.tab.loaded}
    if socket.tab.loaded:
        url = socket.tab.url
        response = {'headers': {},  # TODO: Get headers
                    'status': socket.tab.last_http_status()}
        res.update(url=url, fp=hashlib.sha1(url.encode('utf8')).hexdigest(),
                   response=response)
        res.update(extract(socket))
    res.update(extra)
    return res


def extract(socket):
    """Run spider on page URL to get extracted links and items"""
    if socket.tab is None or not socket.tab.loaded or not socket.spider:
        return {
            'items': [],
            'links': {},
        }
    c = ItemChecker(socket, socket.spiderspec.project, socket.spiderspec.name)
    items, changes, changed_values, links = c.extract()
    return {'links': links, 'items': items, 'changes': changes,
            'changed': changed_values, 'type': 'js' if c.using_js else 'raw'}


def resize(data, socket):
    """Resize virtual tab viewport to match user's viewport"""
    try:
        socket.tab.set_viewport(_get_viewport(data['size']))
    except (KeyError, AttributeError):
        pass  # Tab isn't open. The size will be set when opened


def close_tab(data, socket):
    """Close virtual tab if it is open"""
    if socket.tab is not None:
        socket.tab.close()
        socket.factory[socket].tab = None


def _process_items(items):
    for i, item in enumerate(items):
        if isinstance(item, dict):
            new = {}
            for key, value in item.items():
                if key and key.startswith('_'):
                    continue
                new[key] = _process_items(value) if isinstance(value, list) \
                    else value
            items[i] = new
        elif isinstance(item, list):
            items[i] = _process_items(item)
    return items


@contextlib.contextmanager
def _restore(spider):
    annotations = spider.plugins['Annotations']
    yield
    spider.plugins['Annotations'] = annotations


def _compare_items(a, b):
    change, changes = set(), []
    lena, lenb = len(a), len(b)
    if lenb > lena:
        change = {'missing_items'}
    for aitem, bitem in zip(a, b):
        item_changes = {}
        if aitem == bitem:
            continue
        afields, bfields = set(aitem.keys()), set(bitem.keys())
        b_not_a = bfields ^ afields
        if b_not_a:
            change.add('missing_fields')
            item_changes.update({k: None for k in b_not_a})
        for field in afields:
            afield, bfield = aitem.get(field), bitem.get(field)
            if afield == bfield:
                continue
            item_changes.update({field: (afield, bfield)})
        changes.append(item_changes)
    return list(change), changes


class ItemChecker(object):
    def __init__(self, socket, project, spider=None, sample=None):
        self.socket = socket
        if isinstance(project, six.string_types):
            project_name = socket.user.project_map.get(project, project)
            project = Project(socket.storage, id=project, name=project_name)
        self.project = project
        if not socket.spiderspec:
            socket.open_spider({'project': self.project.id, 'spider': spider},
                               project)
        self.spider = spider
        self.sample = sample
        if (self.spider and (not self.socket.spider or
                             self.socket.spiderspec.name != spider)):
            self.socket.open_spider({'project': self.project,
                                     'spider': self.spider},
                                    project)

    @property
    def raw_html(self):
        stated_encoding = self.socket.tab.evaljs('document.characterSet')
        try:
            raw_html = _decode(
                self.socket.tab.network_manager._raw_html, stated_encoding)
            # XXX: Some pages only show a 301 page. Load the browser html
            assert len(raw_html) > 500
        except (AttributeError, TypeError, AssertionError):
            raw_html = self.html
        return raw_html

    @cached_property
    def html(self):
        return self.socket.tab.html()

    @cached_property
    def url(self):
        return self.socket.tab.evaljs('location.href')

    @cached_property
    def using_js(self):
        add_splash_meta = self.socket.spider._add_splash_meta
        url = self.url
        return 'splash' in add_splash_meta(Request(url)).meta

    @cached_property
    def schemas(self):
        return self.project.schemas.dump()

    @cached_property
    def extractors(self):
        return self.project.extractors.dump()

    def data(self):
        return {
            'project': self.project,
            'spider': self.spider,
            'sample': self.sample
        }

    def extract(self):
        check = self._check_items_with_sample if self.sample else \
            self._check_items
        return check()

    def _load_items(self, body_field='original_body', live=False):
        socket, raw_html, html = self.socket, self.raw_html, self.html
        schemas, extractors, url = self.schemas, self.extractors, self.url
        spider = socket.spiderspec.spider.copy()
        spider['body'] = body_field
        if self.sample:
            samples = [_update_sample(self.data(), socket,
                                      project=self.project, use_live=live)]
        else:
            samples = socket.spiderspec.templates
        spider['templates'] = samples
        extraction = BotAnnotations()
        extraction.setup_bot(_SETTINGS, spider, schemas, extractors,
                             _SPIDER_LOG)
        self.socket.spider.plugins['Annotations'] = extraction
        live_items, js_links = extract_data(url, html, socket.spider, samples)
        raw_items, links = extract_data(url, raw_html, socket.spider, samples)
        return live_items, raw_items, links, js_links

    def _check_items(self):
        js_live_items, js_raw_items, links, js_links = self._load_items(
            'rendered_body', True)
        live_items, raw_items, _, _ = self._load_items()
        raw_links = {l: 'raw' for l in links}
        links = {l: 'js' for l in js_links}
        links.update(raw_links)
        # Decide which items to use
        if self.using_js:
            changes, changed_values = _compare_items(js_live_items, raw_items)
            items = js_live_items
            if items and not raw_items:
                changes.append('no_items')
        else:
            changes, changed_values = _compare_items(raw_items, js_raw_items)
            changes.extend(_compare_items(live_items, js_live_items)[0])
            items = raw_items if raw_items else live_items
        items = _process_items(items)
        return items, changes, changed_values, links

    def _check_items_with_sample(self):
        with _restore(self.socket.spider):
            return self._check_items()
