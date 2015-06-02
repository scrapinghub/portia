import hashlib
import json
import re
import traceback

import slyd.splash.utils

from twisted.python import log
from jsonschema.exceptions import ValidationError

from splash.browser_tab import JsError

from slyd.utils.projects import ProjectModifier
from .utils import (clean, open_tab, extract_data, BaseWSError, BadRequest,
                    NotFound, InternalServerError)


_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')


@open_tab
def fetch_page(data, socket):
    """Load page in virtual url from provided url"""
    if 'url' in data:
        socket.tab.loaded = False
        socket.tab.go(data['url'],
                      lambda: socket.sendMessage(fetch_response(data, socket)),
                      lambda: InternalServerError('Unknown Error'),
                      baseurl=data['url'])
        return {'message': 'loading "%s" in tab' % data['url']}


@open_tab
def interact_page(data, socket):
    """Execute JS event from front end on virtual tab"""
    data.pop('_meta', {})
    data.pop('_command', {})
    event = json.dumps(data.get('interaction', {}))
    try:
        diff = socket.tab.evaljs('window.livePortiaPage.interact(%s);' % event)
    except JsError as e:
        print('Error: %s' % e)
        diff = None
    if diff:
        return {'diff': diff}


def fetch_response(data, socket):
    socket.tab.run_js_files('/app/slyd/public/interact', handle_errors=False)
    socket.tab.loaded = True
    url = socket.tab.url
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    return {
        'id': data['_meta'].get('id'),
        'fp': hashlib.sha1(socket.tab.url).hexdigest(),
        'page': clean(html, url),
        'url': url,
        'original': html,
        'items': [],
        'links': [],
        'response': {
            'headers': {},  # TODO: Get headers
            'status': socket.tab.last_http_status()
        },
        '_command': 'fetch',
    }


def extract(data, socket):
    """Run spider on page URL to get extracted links and items"""
    if socket.tab is None:
        return {
            'items': [],
            'links': {},
        }
    templates = socket.spiderspec.templates
    url = str(socket.tab.url)
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    js_items, js_links = extract_data(url, html, socket.spider, templates)
    raw_html = getattr(socket.tab, '_raw_html', None)
    if raw_html:
        _, links = extract_data(url, raw_html, socket.spider, templates)
    else:
        links = []
    raw = {l: 'raw' for l in links}
    js = {l: 'js' for l in js_links}
    js.update(raw)
    return {
        'items': js_items,
        'links': js,
    }


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


def updates(data, socket):
    """Get any changes that might have occurred asynchronously"""
    if socket.tab and socket.tab.loaded:
        data['interaction'] = {}
        return interact_page(data, socket)


class ProjectData(ProjectModifier):
    errors = slyd.splash.utils

    def save_spider(self, data, socket):
        spider, meta = data.get('spider'), data.get('_meta')
        spider = self.save_data(['spiders', meta.get('spider')], 'spider',
                                data=spider, socket=socket, meta=meta)

    def save_template(self, data, socket):
        sample, meta = data.get('template'), data.get('_meta')
        path = ['spiders', meta.get('spider'), sample.get('name')]
        sample = self.save_data(path, 'template', data=sample, socket=socket,
                                meta=meta)

    def save_extractors(self, data, socket):
        extractors, meta = data.get('extractors'), data.get('_meta')
        self.save_data(['extractors'], data=extractors, socket=socket,
                       meta=meta)

    def save_items(self, data, socket):
        items, meta = data.get('items'), data.pop('_meta', None)
        self.save_data(['items'], data=items, socket=socket, meta=meta)

    def save_data(self, path, type=None, data=None, socket=None, meta=None):
        if type is None:
            type = path[0]
        if any(v is None for v in (data, meta, socket)):
            raise BadRequest('No data provided')
        spec = socket.spec_manager.project_spec(meta['project'],
                                                socket.user.auth)
        try:
            obj = self.verify_data(path, data, spec)
        except (KeyError, IndexError) as ex:
            raise NotFound('"%s.json" could not be found' % '/'.join(path))
        except ValidationError as ex:
            print('Not Valid: %s' % ex)
            raise BadRequest(str(ex))
        except BaseWSError as ex:
            print('Other: %s' % ex)
            raise ex
        except Exception as ex:
            # XXX: Catch any other errors and log them leaving Websocket open
            log.err(traceback.format_exc(ex))
        else:
            try:
                spec.savejson(obj, [s.encode('utf-8') for s in path])
            except Exception as ex:
                # XXX: Catch errors in saving to the backend
                log.err(traceback.format_exc(ex))
            socket.update_spider(meta, **{type: obj})
            return obj


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
        command(data, socket)
    resp = {}
    id = meta.get('id')
    if id:
        resp['id'] = id
    return resp


def delete_project_data(data, socket):
    """Use project and spider metadata along with a resource name to delete
    spiders and templates
    """
    try:
        meta = data['_meta']
        spec = socket.spec_manager.project_spec(meta['project'],
                                                socket.user.auth)
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
    return {'id': meta.get('id')}


def rename_project_data(data, socket):
    """Use project and spider metadata along with old and new names to rename
    spiders and templates
    """
    try:
        meta = data['_meta']
        spec = socket.spec_manager.project_spec(meta['project'],
                                                socket.user.auth)
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
