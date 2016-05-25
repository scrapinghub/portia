import contextlib
import hashlib
import json
import logging
import re
import socket as _socket

from six.moves.urllib.parse import urlparse

from scrapy import Request
from scrapy.settings import Settings
from splash.browser_tab import JsError
from splash.har.qt import cookies2har

from slyd.resources.utils import _load_sample
from slybot.plugins.scrapely_annotations.builder import Annotations
from slybot.plugins.scrapely_annotations import Annotations as BotAnnotations
from .utils import (open_tab, extract_data, _get_viewport, _decode,
                    _load_items_and_extractors)
_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')
_SPIDER_LOG = logging.getLogger('spider')


def cookies(socket):
    cookies_list = socket.tab.network_manager.cookiejar.allCookies()
    message = {
        '_command': 'cookies',
        'cookies': cookies2har(cookies_list)
    }
    socket.sendMessage(message)


def save_html(data, socket):
    manager = socket.manager
    path = [s.encode('utf-8') for s in (data['spider'], data['sample'])]
    sample = _load_sample(manager, *path)
    if sample.get('rendered_body') and not data.get('update'):
        return
    stated_encoding = socket.tab.evaljs('document.characterSet')
    if 'use_live' not in data:
        data['use_live'] = _check_js_required(socket)
    if data.get('use_live'):
        sample['body'] = 'rendered_body'
    else:
        sample['body'] = 'original_body'
    html = socket.tab.html()
    sample['rendered_body'] = html
    try:
        sample['original_body'] = _decode(
            socket.tab.network_manager._raw_html, stated_encoding)
        # XXX: Some pages only show a 301 page. Load the browser html
        assert len(sample['original_body']) > 500
    except (AttributeError, AssertionError):
        sample['original_body'] = html
    _update_sample(data, socket, sample, save=True)


def extract_items(data, socket):
    """Use latest annotations to extract items from current page"""
    if not socket.tab or not socket.spider or not data.get('sample'):
        return {}
    url = socket.tab.evaljs('location.href')
    html = socket.tab.html()
    try:
        raw_html = socket.spiderspec.spider['original_body']
    except (TypeError, KeyError):
        stated_encoding = socket.tab.evaljs('document.characterSet')
        raw_html = _decode(
            socket.tab.network_manager._raw_html, stated_encoding)
    if (socket.spiderspec is None or
            (data['spider'] and socket.spiderspec.name != data['spider'])):
        result = socket.open_spider(data)
        if result and result.get('error'):
            return {}
    schemas, extractors = _load_items_and_extractors(data, socket)
    using_js = _check_js_required(socket, url)
    with _restore(socket.spider):
        js_live_items, js_raw_items, links = _load_items(
            data, socket, schemas, extractors, url, html, raw_html,
            'rendered_body', True)
        live_items, raw_items, links = _load_items(
            data, socket, schemas, extractors, url, html, raw_html)
        # Decide which items to use
        if using_js:
            changes, changed_values = _compare_items(js_live_items, raw_items)
            sample_change, _ = _compare_items(js_live_items, live_items)
            items = js_live_items
        else:
            changes, changed_values = _compare_items(raw_items, js_raw_items)
            changes.extend(_compare_items(live_items, js_live_items)[0])
            sample_change, _ = _compare_items(raw_items, js_raw_items)
            items = raw_items if raw_items else live_items
    # TODO: add option for user to view raw and js items in UI from WS
    items = _process_items(items)
    return {'links': links, 'items': items, 'changes': changes,
            'changed': changed_values, 'type': 'js' if using_js else 'raw'}


def _check_js_required(socket, url=None):
    if url is None:
        url = socket.tab.evaljs('location.href')
    return 'splash' in socket.spider._add_splash_meta(Request(url)).meta


@contextlib.contextmanager
def _restore(spider):
    annotations = spider.plugins['Annotations']
    yield
    spider.plugins['Annotations'] = annotations


def _load_items(data, socket, schemas, extractors, url, live_html, raw_html,
                body_field='original_body', live=False):
    spider = socket.spiderspec.spider.copy()
    spider['body'] = body_field
    samples = [_update_sample(data, socket, use_live=live)]
    spider['templates'] = samples
    extraction = BotAnnotations()
    extraction.setup_bot(Settings(), spider, schemas, extractors, _SPIDER_LOG)
    socket.spider.plugins['Annotations'] = extraction
    live_items, links = extract_data(url, live_html, socket.spider, samples)
    raw_items, links = extract_data(url, raw_html, socket.spider, samples)
    return live_items, raw_items, links


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


def _update_sample(data, socket, sample=None, save=False, use_live=False):
    """Recompile sample with latest annotations"""
    spec = socket.manager
    if sample is None:
        sample = spec.resource('spiders', data['spider'], data['sample'])
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
            items[i] = _process_items(value)
    return items
