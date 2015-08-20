from __future__ import absolute_import
import json
import os

from six.moves.urllib_parse import urlparse

from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import (WebSocketServerFactory,
                                        WebSocketServerProtocol)
from weakref import WeakKeyDictionary, WeakValueDictionary

from scrapy.utils.serialize import ScrapyJSONEncoder
from splash import defaults
from splash import network_manager
from splash.browser_tab import BrowserTab
from splash.render_options import RenderOptions

from PyQt4.QtCore import QObject
from PyQt4.QtCore import pyqtSlot
from PyQt4.QtWebKit import QWebElement

from slybot.spider import IblSpider
from slyd.errors import BaseHTTPError

from .cookies import PortiaCookieJar
from .commands import (load_page, interact_page, close_tab, metadata, resize,
                       resolve, update_project_data, rename_project_data,
                       delete_project_data)
from .css_utils import process_css, wrap_url
import six
text = six.text_type  # unicode in py2, str in py3

_DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
_DEFAULT_VIEWPORT = '1240x680'


def create_ferry_resource(spec_manager, factory):
    return FerryWebSocketResource(spec_manager, factory)


class PortiaBrowserTab(BrowserTab):
    def set_content(self, data, callback, errback, mime_type=None,
                    baseurl=None):
        self._raw_html = str(data)
        super(PortiaBrowserTab, self).set_content(data, callback, errback,
                                                  mime_type, baseurl)


class FerryWebSocketResource(WebSocketResource):
    def __init__(self, spec_manager, factory):
        self.spec_manager = spec_manager
        settings = spec_manager.settings
        self.settings = spec_manager.settings
        FerryServerProtocol.spec_manager = spec_manager
        FerryServerProtocol.settings = settings
        FerryServerProtocol.assets = factory.assets
        WebSocketResource.__init__(self, factory)

    def render(self, request):
        request.requestHeaders.setRawHeaders('X-Auth-Info',
                                             [json.dumps(request.auth_info)])
        return WebSocketResource.render(self, request)


class User(object):
    _by_id = WeakValueDictionary()

    def __init__(self, auth, tab=None, spider=None, spiderspec=None):
        self.auth = auth
        self.authorized_projects = auth.get('authorized_projects', None)
        self.tab = tab
        self.spider = spider
        self.spiderspec = spiderspec
        self.tabid = id(self)
        User._by_id[self.tabid] = self

    @classmethod
    def findById(cls, tabid):
        return cls._by_id.get(tabid, None)

    def __getattr__(self, key):
        try:
            return self.auth[key]
        except KeyError:
            name = self.__class__.__name__
            raise AttributeError('"%s" has no attribute "%s"' % (name, key))


class SpiderSpec(object):
    def __init__(self, name, spider, items, extractors):
        self.name = name
        self.spider = spider
        self.items = items
        self.extractors = extractors

    @property
    def templates(self):
        return self.spider['templates']


class PortiaJSApi(QObject):
    def __init__(self, protocol):
        super(PortiaJSApi, self).__init__()
        self.protocol = protocol

    @pyqtSlot(QWebElement)
    def returnElement(self, element):
        """Hack to return an DOM node as a QWebElement instead of
        QVariant(QVariantMap) """
        self.element = element

    def getReturnedElement(self):
        element = self.element
        self.element = None
        return element

    @pyqtSlot('QString', 'QString', result='QString')
    def processCss(self, css, baseuri):
        return process_css(text(css), self.protocol.user.tabid, text(baseuri))

    @pyqtSlot('QString', 'QString', result='QString')
    def wrapUrl(self, url, baseuri):
        return wrap_url(text(url), self.protocol.user.tabid, text(baseuri))

    @pyqtSlot('QString')
    def sendMessage(self, message):
        message = text(message)
        try:
            command, data = json.loads(message)
        except ValueError:  # XXX: Possibly null terminated string
            command, data = json.loads(message[:-1])
        self.protocol.sendMessage({
            '_command': command,
            '_data': data
        })
        if command == 'mutation':
            self.protocol.sendMessage(metadata(self.protocol))


class FerryServerProtocol(WebSocketServerProtocol):

    _handlers = {
        'load': load_page,
        'interact': interact_page,
        'close_tab': close_tab,
        'heartbeat': lambda d, s: None,
        'resize': resize,
        'saveChanges': update_project_data,
        'delete': delete_project_data,
        'rename': rename_project_data,
        'resolve': resolve
    }
    spec_manager = None
    settings = None
    assets = './'

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
            try:
                result = self._handlers[command](data, self)
            except BaseHTTPError as e:
                command = data.get('_callback') or command
                return self.sendMessage({'error': e.status,
                                         '_command': command,
                                         'id': data.get('_meta', {}).get('id'),
                                         'reason': e.title})
            if result:
                result.setdefault('_command', data.get('_callback', command))
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

    def getElementByNodeId(self, nodeid):
        self.tab.web_page.mainFrame().evaluateJavaScript(
            'livePortiaPage.pyGetByNodeId(%s)' % nodeid
        )
        return self.js_api.getReturnedElement()

    def open_tab(self, meta=None):
        if meta is None:
            meta = {}
        manager = network_manager.create_default()

        data = {}
        data['uid'] = id(data)

        self.factory[self].tab = PortiaBrowserTab(
            network_manager=manager,
            splash_proxy_factory=None,
            verbosity=0,
            render_options=RenderOptions(data, defaults.MAX_TIMEOUT),
            visible=True,
        )
        main_frame = self.tab.web_page.mainFrame()
        cookiejar = PortiaCookieJar(self.tab.web_page, self)
        self.tab.web_page.cookiejar = cookiejar
        if meta.get('cookies'):
            cookiejar.put_client_cookies(meta['cookies'])

        main_frame.loadStarted.connect(self._on_load_started)
        self.js_api = PortiaJSApi(self)
        main_frame.javaScriptWindowObjectCleared.connect(
            self.populate_window_object
        )

        self.tab.set_images_enabled(False)
        self.tab.set_viewport(meta.get('viewport', _DEFAULT_VIEWPORT))
        self.tab.set_user_agent(meta.get('user_agent', _DEFAULT_USER_AGENT))
        self.tab.loaded = False

    def _on_load_started(self):
        self.sendMessage({'_command': 'loadStarted'})

    def populate_window_object(self):
        self.tab.web_page.mainFrame().addToJavaScriptWindowObject(
            '__portiaApi', self.js_api)
        self.tab.run_js_files(
            os.path.join(self.assets, 'splash_content_scripts'),
            handle_errors=False)

    def open_spider(self, meta):
        if ('project' not in meta or 'spider' not in meta):
            return {'error': 4005, 'reason': 'No project specified'}

        if (self.user.authorized_projects is not None and
                meta['project'] not in self.user.authorized_projects and
                not self.user.staff):
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
                spec.remove_template(spider_name, template)
        spider['templates'] = templates
        if not self.settings.get('SPLASH_URL'):
            self.settings.set('SPLASH_URL', 'portia')
        self.factory[self].spider = IblSpider(spider_name, spider, items,
                                              extractors, self.settings)
        self.factory[self].spiderspec = SpiderSpec(spider_name, spider, items,
                                                   extractors)

    def update_spider(self, meta, spider=None, template=None, items=None,
                      extractors=None):
        if not hasattr(self.factory[self], 'spiderspec'):
            return self.open_spider(meta)
        spec = self.factory[self].spiderspec
        if spec is None or spec.name != meta.get('spider'):
            return self.open_spider(meta)
        items = items or spec.items
        extractors = extractors or spec.extractors
        if spider:
            spider['templates'] = spec.spider['templates']
        else:
            spider = spec.spider
        if template:
            idx = 0
            for idx, tmpl in enumerate(spider['templates']):
                if template['original_body'] == tmpl['original_body']:
                    spider['templates'][idx] = template
                    break
            else:
                spider['templates'].append(template)
            spider['template_names'] = [t['name'] for t in spider['templates']]
        self.factory[self].spider = IblSpider(meta['spider'], spider, items,
                                              extractors, self.settings)
        self.factory[self].spiderspec = SpiderSpec(meta['spider'], spider,
                                                   items, extractors)


class FerryServerFactory(WebSocketServerFactory):
    def __init__(self, uri, debug=False, assets='./'):
        WebSocketServerFactory.__init__(self, uri, debug=debug)
        self._peers = WeakKeyDictionary()
        self.assets = assets

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
