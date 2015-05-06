import json
import hashlib

from urlparse import urlparse
from collections import namedtuple

from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import (WebSocketServerFactory,
                                        WebSocketServerProtocol)
from weakref import WeakKeyDictionary

from scrapy.http import Request, HtmlResponse
from scrapy.item import DictItem
from scrapy.utils.serialize import ScrapyJSONEncoder
from splash import defaults
from splash import network_manager
from splash.browser_tab import BrowserTab, JsError
from splash.render_options import RenderOptions

from slyd.html import descriptify
from slybot.baseurl import insert_base_url

from slybot.spider import IblSpider


Auth = namedtuple('Auth', ('staff', 'authorized_projects', 'username',
                           'service_token'))


def clean(html, url):
    return insert_base_url(descriptify(html, url), url)


def create_ferry_resource(spec_manager, factory):
    return FerryWebSocketResource(spec_manager, factory)


class FerryWebSocketResource(WebSocketResource):
    def __init__(self, spec_manager, factory):
        self.spec_manager = spec_manager
        settings = spec_manager.settings
        self.settings = spec_manager.settings
        FerryServerProtocol.spec_manager = spec_manager
        FerryServerProtocol.settings = settings
        WebSocketResource.__init__(self, factory)

    def render(self, request):
        request.requestHeaders.setRawHeaders('X-Auth-Info',
                                             [json.dumps(request.auth_info)])
        return WebSocketResource.render(self, request)


def build_response(data, socket):
    def _get_template_name(template_id, templates):
        for template in templates:
            if template['page_id'] == template_id:
                return template['name']

    socket.tab.run_js_files('/app/slyd/public/interact', handle_errors=False)
    socket.tab.loaded = True
    url = socket.tab.url
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    links, items = [], []
    templates = socket.spiderspec.templates
    for value in socket.spider.parse(page(url, html)):
        if isinstance(value, Request):
            links.append(value.url)
        elif isinstance(value, DictItem):
            value['_template_name'] = _get_template_name(value['_template'],
                                                         templates)
            items.append(value._values)
        else:
            raise ValueError("Unexpected type %s from spider" %
                             type(value))
    return {
        'id': data['_meta'].get('id'),
        'fp': hashlib.sha1(socket.tab.url).hexdigest(),
        'page': clean(html, url),
        'original': html,
        'items': items,
        'links': links,
        'response': {
            'headers': {},
            'status': socket.tab.last_http_status()
        }
    }


def open_tab(func):
    def wrapper(data, socket):
        if socket.tab is None:
            socket.open_tab(data.get('_meta'))
            socket.open_spider(data.get('_meta'))
        return func(data, socket)
    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper


@open_tab
def fetch_page(data, socket):
    if 'url' in data:
        socket.tab.loaded = False
        socket.tab.go(data['url'],
                      lambda: socket.sendMessage(build_response(data, socket)),
                      lambda: socket.sendMessage({'error': 4500,
                                                  'message': 'Unknown error'}))
        return {'message': 'loading "%s" in tab' % data['url']}


@open_tab
def interact_page(data, socket):
    data.pop('_meta', {})
    data.pop('_command', {})
    try:
        interaction = json.dumps(data.get('interaction', {}))
        try:
            result = socket.tab.evaljs(
                'window.livePortiaPage.interact(%s);' % interaction
            )
        except JsError:
            result = None
        if result:
            return {'diff': result}
        else:
            return {}
    except JsError as exc:
        return {'error': str(exc)}


def extract_data(data, socket):
    """Use scrapely and templates to extract data from the page"""
    return {
        'items': socket.spider.parse_html(page(socket.tab))
    }


def page(url, html):
    return HtmlResponse(url, 200, {}, html, encoding='utf-8')


def follow_links(data, socket):
    """Return the links that will be followed in the page according to the
    exclude and follow patterns of the spider"""


def close_tab(data, socket):
    if socket.tab is not None:
        socket.tab.close()
        socket.factory[socket] = None
    return {}


def heartbeat(data, socket):
    res = {'heartbeat': True}
    if socket.tab and socket.tab.loaded:
        try:
            diff = socket.tab.evaljs('window.livePortiaPage.interact()')
        except JsError:
            diff = None
        if diff:
            res['diff'] = diff
    return res


class User(object):
    def __init__(self, auth, tab=None, spider=None, spiderspec=None):
        self.auth = auth
        self.tab = tab
        self.spider = spider
        self.spiderspec = spiderspec

    def __getattr__(self, key):
        try:
            return self.auth[key]
        except KeyError:
            name = self.__class__.__name__
            raise AttributeError('"%s" has no attribute "%s"' % (name, key))


class SpiderSpec(object):
    def __init__(self, spider, items, extractors):
        self.spider = spider
        self.items = items
        self.extractors = extractors

    @property
    def templates(self):
        return self.spider['templates']


class FerryServerProtocol(WebSocketServerProtocol):

    _handlers = {
        'fetch': fetch_page,
        'interact': interact_page,
        'close_tab': close_tab,
        'follow_links': follow_links,
        'extract_data': extract_data,
        'heartbeat': heartbeat,
    }
    spec_manager = None
    settings = None

    @property
    def tab(self):
        return self.factory[self].tab

    @property
    def spider(self):
        return self.factory[self].spider

    @property
    def spiderspec(self):
        return self.factory[self].spiderspec

    @property
    def user(self):
        return self.factory[self]

    def onConnect(self, request):
        try:
            request.auth_info = json.loads(request.headers['x-auth-info'])
        except (KeyError, TypeError):
            return
        self.factory[self] = User(request.auth_info)

    def onOpen(self):
        if self not in self.factory:
            self.sendClose(1000, 'Invalid Connection missing required '
                                 'parameters')

    def onMessage(self, payload, isbinary):
        if isbinary:
            payload = payload.decode('utf-8')
        data = json.loads(payload)
        if '_command' in data and data['_command'] in self._handlers:
            self.sendMessage(self._handlers[data['_command']](data, self))
        else:
            self.sendMessage({'error': 4000,
                              'reason': 'No matching command found.'})

    def onClose(self, was_clean, code, reason):
        if self in self.factory and self.tab is not None:
            # TODO: Any other clean up logic
            self.tab.close()

    def sendMessage(self, payload, is_binary=False):
        super(FerryServerProtocol, self).sendMessage(
            json.dumps(payload, cls=ScrapyJSONEncoder, sort_keys=True),
            is_binary
        )

    def open_tab(self, meta=None):
        if meta is None:
            meta = {}
        manager = network_manager.create_default()

        data = {}
        data['uid'] = id(data)

        # TODO: Fill in appropriate config
        #       user agent and other properties
        self.factory[self].tab = BrowserTab(
            network_manager=manager,
            splash_proxy_factory=None,
            verbosity=2,
            render_options=RenderOptions(data, defaults.MAX_TIMEOUT),
            visible=True,
        )
        self.tab.set_images_enabled(False)
        self.tab.set_viewport(meta.get('viewport', '1240x680'))
        # self.tab._jsconsole_enable()
        self.tab.loaded = False

    def open_spider(self, meta):
        if ('project' not in meta or 'spider' not in meta or
                (meta['project'] not in self.user.authorized_projects and
                 not self.user.staff)):
            return {'error': 4004,
                    'reason': 'Project "%s" not found' % meta['project']}
        spider_name = meta['spider']
        spec = self.spec_manager.project_spec(meta['project'], self.user.auth)
        spider = spec.resource('spiders', spider_name)
        items = spec.resource('items')
        extractors = spec.resource('extractors')
        templates = []
        for template in spider.get('template_names', []):
            try:
                templates.append(spec.resource('spiders', spider_name,
                                               template))
            except TypeError:
                # Template names not consistent with templates
                self.spec.remove_template(spider, template)
        spider['templates'] = templates
        self.factory[self].spider = IblSpider(spider_name, spider, items,
                                              extractors, self.settings)
        self.factory[self].spiderspec = SpiderSpec(spider, items, extractors)


class FerryServerFactory(WebSocketServerFactory):
    def __init__(self, uri, debug=False):
        WebSocketServerFactory.__init__(self, uri, debug=debug)
        self._peers = WeakKeyDictionary()

    def __getitem__(self, key):
        if key in self._peers:
            return self._peers[key]
        return None

    def __setitem__(self, key, value):
        self._peers[key] = value

    def __contains__(self, key):
        if self._peers.get(key) is not None:
            return True
        return False

    def __repr__(self):
        return 'Ferry(%s)' % ', '.join('User(%s)' % (
                                       urlparse(user.tab.url).netloc
                                       for user in self._peers.values()
                                       if user.tab))
