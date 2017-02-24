import contextlib
import hashlib
import json
import logging
import re
import six
import sys
import socket as _socket

from six.moves.urllib.parse import urlparse
from django.utils.functional import cached_property

from scrapy import Request
from scrapy.settings import Settings
from splash.browser_tab import JsError
from splash.har.qt import cookies2har

from slybot.plugins.scrapely_annotations import Annotations as BotAnnotations
from slybot.utils import decode

from storage.backends import ContentFile
from portia_orm.datastore import data_store_context
from portia_orm.models import Project

from .utils import extract_data, _get_viewport, _html_path, decoded_html
_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')
_SPIDER_LOG = logging.getLogger('spider')
_SETTINGS = Settings()
_SETTINGS.set('SPLASH_URL', 'http://splash')


class Commands(object):
    def __init__(self, data, socket, storage):
        self.data, self.socket, self.storage = data, socket, storage

    @property
    def tab(self):
        return self.socket.tab

    def cookies(self):
        cookies_list = self.tab.network_manager.cookiejar.allCookies()
        message = {
            '_command': 'cookies',
            'cookies': cookies2har(cookies_list)
        }
        self.socket.sendMessage(message)

    def heartbeat(self):
        return

    def save_html(self, item_checker=None):
        data = self.data
        if item_checker is None:
            item_checker = ItemChecker(self, data['project'], data['spider'],
                                       data['sample'])
        project = Project(self.storage, id=data['project'])
        self.socket.spiderspec.project = project
        spider = project.spiders[data['spider']]
        samples = spider.samples
        try:
            sample = samples[data['sample']]
            self._update_sample(sample)
        except (IOError, KeyError):
            pass  # Sample doesn't exist or may not exist yet
        return {'ok': True}

    def extract_items(self):
        """Use latest annotations to extract items from current page"""
        self._open_tab()
        project = self.data['project']
        spider = self.data['spider']
        sample = self.data.get('sample')
        if not all((project, spider)):
            return {'type': 'raw'}
        c = ItemChecker(self, project, spider, sample)
        # TODO: add option for user to view raw and js items in UI from WS
        items, changes, changed_values, links = c.extract()
        return {'links': links, 'items': items, 'changes': changes,
                'changed': changed_values, 'type':
                'js' if c.using_js else 'raw'}

    def _load_sample(self, data, project=None):
        project = project or self.socket.spiderspec.project
        spiders = project.spiders
        spider = spiders[data['spider']]
        samples = spider.samples
        return samples[data['sample']]

    def _update_sample(self, sample=None, project=None, data=None):
        """Recompile sample with latest annotations"""
        if sample is None:
            sample = self._load_sample(data, project)
            path = 'spiders/{}/{}/{{}}.html'.format(
                self.data['spider'], self.data['sample'])
        else:
            path = _html_path(sample)
        if hasattr(sample, 'dump'):
            sample = sample.dump()
        html_path = path.format
        for name, type_ in (('original_body', 'raw'), ('rendered_body', None)):
            try:
                path = html_path(name)
                html = decode(self.storage.open(path).read())
            except IOError:
                if not self.tab:
                    six.reraise(*sys.exc_info())
                html = decoded_html(self.tab, type_)
                if html:
                    self.storage.save(path, ContentFile(html, path))
                else:
                    html = '<html></html>'
            sample[name] = html
        return sample

    def update_spider(self, spider=None):
        return self.extract()

    def load_page(self):
        """Load page in virtual url from provided url"""
        if 'url' not in self.data:
            return {'error': 4001, 'message': 'Required parameter url'}
        self._open_tab()

        self.tab.loaded = False
        meta = self.data.get('_meta', {})

        def on_complete(is_error, err_info=None):
            extra_meta = {'id': meta.get('id')}
            if is_error:
                msg = 'Unknown error' if err_info is None else err_info.text
                extra_meta.update(error=4500, reason=msg)
            else:
                self.tab.loaded = True
            with data_store_context():
                self.socket.sendMessage(self.metadata(extra_meta))
            self.cookies()

        # Specify the user agent directly in the headers
        # Workaround for https://github.com/scrapinghub/splash/issues/290
        headers = {}
        if "user_agent" in meta:
            headers['User-Agent'] = meta['user_agent']
        self.tab.go(self.data['url'],
                    lambda: on_complete(False),
                    lambda err=None: on_complete(True, err),
                    baseurl=self.data.get('baseurl'),
                    headers=headers)

    def interact_page(self):
        """Execute JS event from front end on virtual tab"""
        self._open_tab()
        event = json.dumps(self.data.get('interaction', {}))
        try:
            self.tab.evaljs('window.livePortiaPage.sendEvent(%s);' % event)
        except JsError as e:
            print(e)
        self.cookies()

    def resolve(self):
        result = {'id': self.data.get('_meta', {}).get('id')}
        try:
            url = self.data['url']
            parsed = urlparse(url)
            port = 443 if parsed.scheme == 'https' else 80
            _socket.getaddrinfo(parsed.hostname, port)
        except KeyError:
            result['error'] = 'Can\'t create a spider without a start url'
        except _socket.gaierror:
            result['error'] = 'Could not resolve "%s"' % url
        return result

    def metadata(self, extra={}):
        if not self.tab:
            return {'_command': 'metadata', 'loaded': False}
        res = {'_command': 'metadata', 'loaded': self.tab.loaded}
        if self.tab.loaded:
            try:
                url = self.tab.url
            except RuntimeError:
                url = ''
            response = {'headers': {},  # TODO: Get headers
                        'status': self.tab.last_http_status()}
            res.update(
                url=url, fp=hashlib.sha1(url.encode('utf8')).hexdigest(),
                response=response)
            res.update(self.extract())
        res.update(extra)
        return res

    def extract(self):
        """Run spider on page URL to get extracted links and items"""
        if (self.tab is None or not self.tab.loaded or
                not (self.socket.spider or (self.data and self.storage))):
            return {
                'items': [],
                'links': {},
            }
        spec = self.socket.spiderspec
        if spec is not None:
            c = ItemChecker(self, spec.project, spec.name)
            items, changes, changed_values, links = c.extract()
            using_js = c.using_js
        else:
            items, changes, changed_values, links, using_js = [], [], [], [], 0
        return {'links': links, 'items': items, 'changes': changes,
                'changed': changed_values,
                'type': 'js' if using_js else 'raw'}

    def resize(self):
        """Resize virtual tab viewport to match user's viewport"""
        try:
            self.tab.set_viewport(_get_viewport(self.data['size']))
        except (KeyError, AttributeError):
            pass  # Tab isn't open. The size will be set when opened

    def close_tab(self):
        """Close virtual tab if it is open"""
        if self.tab is not None:
            self.tab.close()
            self.socket.factory[self.socket].tab = None

    def _open_tab(self):
        if self.tab is None:
            meta = self.data.get('_meta', self.data)
            self.socket.open_tab(meta)


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
    def __init__(self, command, project, spider=None, sample=None):
        self.command, self.socket = command, command.socket
        if isinstance(project, six.string_types):
            project_name = self.socket.user.project_map.get(project, project)
            project = Project(command.storage, id=project, name=project_name)
        self.project = project
        if not self.socket.spider:
            try:
                self.socket.open_spider(
                    {'project': self.project.id, 'spider': spider},
                    project=project)
            except KeyError:
                pass  # Ignore extraction as it is not fully set up yet
        self.spider = spider
        self.sample = sample
        if (self.spider and (not self.socket.spider or
                             self.socket.spiderspec.name != spider)):
            self.socket.open_spider({'project': self.project,
                                     'spider': self.spider},
                                    project=project)

    @property
    def raw_html(self):
        try:
            raw_html = decoded_html(self.socket.tab, 'raw')
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
        try:
            return self.socket.tab.evaljs('location.href')
        except JsError:
            return self.socket.tab.url

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
        if not self.socket.spider:
            # TODO: Investigate why spider is None
            return [], [], [], []
        socket, raw_html, html = self.socket, self.raw_html, self.html
        schemas, extractors, url = self.schemas, self.extractors, self.url
        spider = socket.spiderspec.spider.copy()
        spider['body'] = body_field
        if self.sample:
            samples = [self.command._update_sample(data=self.data(),
                                                   project=self.project)]
            self._check_sample(samples[0])
        else:
            samples = socket.spiderspec.templates
        spider['templates'] = samples
        extraction = BotAnnotations()
        extraction.setup_bot(_SETTINGS, self.socket.spider, spider, schemas,
                             extractors, _SPIDER_LOG)
        self.socket.spider.plugins['Annotations'] = extraction
        live_items, js_links = extract_data(url, html, socket.spider, samples)
        raw_items, links = extract_data(url, raw_html, socket.spider, samples)
        return live_items, raw_items, links, js_links

    def _check_items(self):
        try:
            js_live_items, js_raw_items, links, js_links = self._load_items(
                'rendered_body', True)
            live_items, raw_items, _, _ = self._load_items()
        except MissingRequiredError as e:
            data = [e.schema.id, list(e.fields)]
            return [], ['missing_required_field'], data, []
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

    def _check_sample(self, sample):
        sample = self.command._load_sample(self.data())

        def _check_item(item):
            schema = item.schema
            required = {field.id for field in schema.fields if field.required}
            annotated = set()
            for annotation in item.annotations:
                if hasattr(annotation, 'field'):
                    annotated.add(annotation.field.id)
                else:
                    _check_item(annotation)
            missing = required - annotated
            if missing:
                raise MissingRequiredError(schema, missing)
        for item in sample.items:
            _check_item(item)

    def _check_items_with_sample(self):
        with _restore(self.socket.spider):
            return self._check_items()


class MissingRequiredError(Exception):
    def __init__(self, schema, fields):
        self.schema, self.fields = schema, fields
