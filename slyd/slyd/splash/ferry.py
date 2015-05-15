import json

from urlparse import urlparse

from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import (WebSocketServerFactory,
                                        WebSocketServerProtocol)
from weakref import WeakKeyDictionary

from scrapy.utils.serialize import ScrapyJSONEncoder
from splash import defaults
from splash import network_manager
from splash.browser_tab import BrowserTab
from splash.render_options import RenderOptions

from slybot.spider import IblSpider

from .commands import (fetch_page, fetch_response, interact_page, close_tab,
                       extract, updates, resize)

_DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
_DEFAULT_VIEWPORT = '1240x680'


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
        'extract': extract,
        'heartbeat': lambda d, s: {},
        'updates': updates,
        'resize': resize,
        'loadCurrent': fetch_response
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
            command = data['_command']
            result = self._handlers[command](data, self) or {}
            if '_command' not in result:
                result['_command'] = data.get('_callback') or command
            self.sendMessage(result)
        else:
            command = data.get('_command')
            if command:
                message = 'No command named "%s" found.' % command
            else:
                message = "No command received"
            self.sendMessage({'error': 4000,
                              'reason': message})

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

        self.factory[self].tab = BrowserTab(
            network_manager=manager,
            splash_proxy_factory=None,
            verbosity=2,
            render_options=RenderOptions(data, defaults.MAX_TIMEOUT),
            visible=True,
        )
        self.tab.set_images_enabled(False)
        self.tab.set_viewport(meta.get('viewport', _DEFAULT_VIEWPORT))
        self.tab.set_user_agent(meta.get('user_agent', _DEFAULT_USER_AGENT))
        self.tab.web_page.mainFrame().loadStarted.connect(
            self._on_load_started)
        self.tab.web_page.mainFrame().loadFinished.connect(
            self._on_load_finished)
        # self.tab._jsconsole_enable()
        self.tab.loaded = False

    def _on_load_started(self):
        self.sendMessage({'_command': 'loadStarted'})

    def _on_load_finished(self):
        self.sendMessage({'_command': 'loadFinished',
                          'url': self.tab.url})

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
                spec.remove_template(spider, template)
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
