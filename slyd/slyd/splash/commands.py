from __future__ import absolute_import
import hashlib
import json
import re
import socket as _socket
import six.moves.urllib_parse as urlparse
import traceback
import chardet
import six
import itertools
from monotonic import monotonic

from scrapy.settings import Settings

import slyd.splash.utils

from twisted.python import log
from jsonschema.exceptions import ValidationError

from splash.browser_tab import JsError

from slyd.utils.projects import ProjectModifier
from slyd.resources.utils import _load_sample
from slybot.plugins.scrapely_annotations.builder import Annotations
from slybot.plugins.scrapely_annotations import Annotations as BotAnnotations
from .utils import open_tab, extract_data, BaseWSError, BadRequest, NotFound


_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')


def save_html(data, socket):
    manager = socket.manager
    path = [s.encode('utf-8') for s in (data['spider'], data['sample'])]
    sample = _load_sample(manager, *path)
    stated_encoding = socket.tab.evaljs('document.characterSet')
    try:
        sample['original_body'] = _decode(socket.tab.network_manager._raw_html,
                                          stated_encoding)
        # XXX: Some pages only show a 301 page. Load the browser html instead
        assert len(sample['original_body']) > 500
    except (AttributeError, AssertionError):
        sample['original_body'] = socket.tab.html()
    _update_sample(data, socket, sample, save=True)


def extract_items(data, socket):
    """Use latest annotations to extract items from current page"""
    if not socket.tab:
        return {}
    url = socket.tab.evaljs('location.href')
    html = socket.tab.html()
    if (socket.spiderspec is None or
            (data['spider'] and socket.spiderspec.name != data['spider'])):
        result = socket.open_spider(data)
        if result and result.get('error'):
            return {}
    sample_names = socket.spiderspec.templates
    annotations = socket.spider.plugins['Annotations']
    sid = data.get('sample')
    if sid:
        sample_names = [_update_sample(data, socket, use_live=True)]
        spider = {k: sample_names if k == 'templates' else v
                  for k, v in socket.spiderspec.spider.items()}
        items, extractors = _load_items_and_extractors(data, socket)
        extraction = BotAnnotations()
        extraction.setup_bot(Settings(), spider, items, extractors)
        socket.spider.plugins['Annotations'] = extraction
    items, links = extract_data(url, html, socket.spider, sample_names)
    if not items:
        items, links = extract_data(url, socket.tab.network_manager._raw_html,
                                    socket.spider, sample_names)
    socket.spider.plugins['Annotations'] = annotations
    items = _process_items(items)
    return {'links': links, 'items': items}


def _update_sample(data, socket, sample=None, save=False, use_live=False):
    """Recompile sample with latest annotations"""
    spec = socket.manager
    if sample is None:
        sample = spec.resource('spiders', data['spider'], data['sample'])
    # TODO: Handle js enabled
    if use_live:
        try:
            sample['original_body'] = socket.tab.html()
        except (TypeError, ValueError):
            pass
    try:
        Annotations().save_extraction_data(
            sample['plugins']['annotations-plugin'], sample,
            options={'body': 'original_body'})
    except (StopIteration, KeyError):
        sample['annotated_body'] = sample.get('original_body', u'')
    if save:
        spec.savejson(sample, ['spiders', data['spider'], data['sample']])
    return sample


def update_spider(data, socket, spider=None):
    if not socket.spider:
        return
    spec = socket.manager
    if spider is None:
        spider = spec.resource('spiders', data['spider'])
    socket.spider.plugins['Annotations'].build_url_filter(spider)
    return extract(socket)


def _load_items_and_extractors(data, socket):
    spec = socket.manager
    try:
        items = spec.resource('items')
    except IOError:
        items = {}
    try:
        extractors = spec.resource('extractors')
    except IOError:
        extractors = {}
    return items, extractors


def _decode(html, default=None):
    if default is None:
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

    # Specify the user agent directly in the headers
    # Workaround for https://github.com/scrapinghub/splash/issues/290
    headers = {}
    if "user_agent" in meta:
        headers['User-Agent'] = meta['user_agent']
    socket.open_spider(meta)
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


def resolve(data, socket):
    result = {'id': data.get('_meta', {}).get('id')}
    try:
        url = data['url']
        parsed = urlparse.urlparse(url)
        port = 443 if parsed.scheme == 'https' else 80
        _socket.getaddrinfo(parsed.hostname, port)
    except KeyError:
        result['error'] = 'Can\'t create a spider without a start url'
    except _socket.gaierror:
        result['error'] = 'Could not resolve "%s"' % url
    return result


def metadata(socket, extra={}):
    if not socket.tab:
        return {
            '_command': 'metadata',
            'loaded': False
        }
    res = {
        '_command': 'metadata',
        'loaded': socket.tab.loaded
    }
    if socket.tab.loaded:
        # Workarround for https://github.com/scrapinghub/splash/issues/259
        url = socket.tab.evaljs('location.href')
        res.update(
            url=url,
            fp=hashlib.sha1(url.encode('utf8')).hexdigest(),
            response={
                'headers': {},  # TODO: Get headers
                'status': socket.tab.last_http_status()
            }
        )
        if socket.spiderspec:
            res.update(extract(socket))
    res.update(extra)
    return res


def extract(socket):
    """Run spider on page URL to get extracted links and items"""
    if socket.tab is None or not socket.tab.loaded:
        return {
            'items': [],
            'links': {},
        }
    templates = socket.spiderspec.templates
    # Workarround for https://github.com/scrapinghub/splash/issues/259
    url = socket.tab.evaljs('location.href')
    html = socket.tab.html()
    js_items, js_links = extract_data(url, html, socket.spider, templates)
    raw_html = socket.tab.network_manager._raw_html
    if raw_html:
        raw_items, links = extract_data(url, raw_html, socket.spider,
                                        templates)
    else:
        raw_items = []
        links = []
    raw = {l: 'raw' for l in links}
    js = {l: 'js' for l in js_links}
    js.update(raw)
    items = js_items
    if not (socket.spider.js_enabled and socket.spider._filter_js_urls(url)):
        items = raw_items
    return {
        'items': items,
        'links': js,
    }


def pause(data, socket):
    socket.spent_time += monotonic() - socket.start_time


def resume(data, socket):
    socket.start_time = monotonic()


def resize(data, socket):
    """Resize virtual tab viewport to match user's viewport"""
    try:
        if 'size' in data and _VIEWPORT_RE.search(data['size']):
            socket.tab.set_viewport(data['size'])
    except (KeyError, AttributeError):
        pass  # Tab isn't open. The size will be set when opened


def close_tab(data, socket):
    """Close virtual tab if it is open"""
    if socket.tab is not None:
        socket.tab.close()
        socket.factory[socket].tab = None

_valid_params = {
    "suggestions.title": ('accepted', 'rejected', 'accepted_all', 'rejected_all'),
    "suggestions.image": ('accepted', 'rejected', 'accepted_all', 'rejected_all'),
    "suggestions.microdata": ('accepted', 'rejected', 'accepted_all', 'rejected_all'),
    "suggestions.all": ('accepted', 'rejected'),
}
def log_event(data, socket):
    event = data.get('event')
    param = data.get('param')

    if event not in _valid_params or param not in _valid_params[event]:
        return

    msg_data = {'session': socket.session_id,
                'session_time': 0,
                'user': socket.user.name,
                'command': '%s.%s' % (event, param)}
    msg = (u'Stat: id=%(session)s t=%(session_time)s '
           u'user=%(user)s command=%(command)s' % (msg_data))
    log.err(msg)


class ProjectData(ProjectModifier):
    errors = slyd.splash.utils

    def save_spider(self, data, socket):
        spider, meta = data.get('spider'), data.get('_meta')
        return self.save_data(['spiders', meta.get('spider')], 'spider',
                              data=spider, socket=socket, meta=meta)

    def save_template(self, data, socket):
        sample, meta = data.get('template'), data.get('_meta')
        path = ['spiders', meta.get('spider'), sample.get('name')]
        creating = sample.pop('_new', False)
        if creating:
            if socket.spider is None:
                socket.open_spider(meta)
            uses_js = bool(socket.spider._filter_js_urls(sample['url']))
            if uses_js:
                sample['original_body'] = socket.tab.html()
            else:
                stated_encoding = socket.tab.evaljs('document.characterSet')
                sample['original_body'] = self._decode(socket.tab.network_manager._raw_html,
                                                       stated_encoding)
        obj = self.save_data(path, 'template', data=sample, socket=socket,
                             meta=meta)
        if creating and obj:
            obj['_uses_js'] = uses_js

        return obj

    def save_extractors(self, data, socket):
        extractors, meta = data.get('extractors'), data.get('_meta')
        return self.save_data(['extractors'], data=extractors, socket=socket,
                              meta=meta)

    def save_items(self, data, socket):
        items, meta = data.get('items'), data.pop('_meta', None)
        return self.save_data(['items'], data=items, socket=socket, meta=meta)

    def save_data(self, path, type=None, data=None, socket=None, meta=None):
        if type is None:
            type = path[0]
        if any(v is None for v in (data, meta, socket)):
            raise BadRequest('No data provided')
        spec = socket.manager
        try:
            obj = self.verify_data(path, data, spec)
        except (KeyError, IndexError) as ex:
            raise NotFound('"%s.json" could not be found' % '/'.join(path))
        except ValidationError as ex:
            print(('Not Valid: %s' % ex))
            raise BadRequest(str(ex))
        except BaseWSError as ex:
            print(('Other: %s' % ex))
            raise ex
        else:
            spec.savejson(obj, [s.encode('utf-8') for s in path])
            socket.update_spider(meta, **{type: obj})
            return obj

    def _decode(self, html, default=None):
        if default is None:
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


def update_project_data(data, socket):
    try:
        updater = ProjectData()
        meta = data['_meta'] or {}
        option = meta.get('type', '')
        command = getattr(updater, 'save_%s' % option)
    except KeyError:
        raise BadRequest('No metadata received')
    except AttributeError:
        raise BadRequest('Unknown option "%s" received' % option)
    else:
        resp = {'saved': {option: command(data, socket)}}
    _id = meta.get('id')
    if _id:
        resp['id'] = _id
    resp.update(extract(socket))
    return resp


def delete_project_data(data, socket):
    """Use project and spider metadata along with a resource name to delete
    spiders and templates
    """
    try:
        meta = data['_meta']
        spec = socket.manager
        option = meta.get('type', '')
        command = getattr(spec, 'remove_%s' % option)
        spider = meta['spider'].encode('utf-8')
        name = data.get('name').encode('utf-8')
    except KeyError:
        raise BadRequest('No or incorrect metadata received')
    except AttributeError:
        raise BadRequest('Unknown option "%s" received' % option)
    else:
        if option == 'spider':
            command(spider)
        else:
            command(spider, name)
            if socket.spiderspec:
                socket.open_spider(meta)
    resp = {'id': meta.get('id')}
    resp.update(extract(socket))
    return resp


def rename_project_data(data, socket):
    """Use project and spider metadata along with old and new names to rename
    spiders and templates
    """
    try:
        meta = data['_meta']
        spec = socket.manager
        option = meta.get('type', '')
        command = getattr(spec, 'rename_%s' % option)
        spider = meta['spider'].encode('utf-8')
        old = data['old'].encode('utf-8')
        new = data['new'].encode('utf-8')
    except KeyError:
        raise BadRequest('No or incorrect metadata received')
    except AttributeError:
        raise BadRequest('Unknown option "%s" received' % option)
    else:
        if option == 'spider':
            command(old, new)
            if socket.spiderspec:
                socket.spiderspec.name = new
        else:
            command(spider, old, new)
            if socket.spiderspec:
                socket.open_spider(meta)
    return {'id': meta.get('id')}


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
            items[i] = _process_items(value)
    return items
