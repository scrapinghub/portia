from __future__ import absolute_import
import json
import os

from six.moves.urllib_parse import urlparse

from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import (WebSocketServerFactory,
                                        WebSocketServerProtocol)
from weakref import WeakKeyDictionary, WeakValueDictionary
from monotonic import monotonic
from twisted.python import log
from twisted.python.failure import Failure

from scrapy.utils.serialize import ScrapyJSONEncoder
from splash import defaults
from splash.browser_tab import BrowserTab
from splash.network_manager import SplashQNetworkAccessManager
from splash.render_options import RenderOptions

from slybot.spider import IblSpider
from slyd.errors import BaseHTTPError

from .qtutils import QObject, pyqtSlot, QWebElement
from .cookies import PortiaCookieJar
from .commands import (load_page, interact_page, close_tab, metadata, resize,
                       resolve, update_project_data, rename_project_data,
                       delete_project_data, pause, resume, extract_items,
                       save_html, log_event)
from .css_utils import process_css, wrap_url
import six
text = six.text_type  # unicode in py2, str in py3

import txaio
txaio.use_twisted()

_DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
_DEFAULT_VIEWPORT = '1240x680'


def create_ferry_resource(spec_manager, factory):
    return FerryWebSocketResource(spec_manager, factory)


class PortiaNetworkManager(SplashQNetworkAccessManager):
    _raw_html = None

    def createRequest(self, operation, request, outgoingData=None):
        reply = super(PortiaNetworkManager, self).createRequest(operation, request, outgoingData)
        try:
            url = six.binary_type(request.url().toEncoded())
            frame_url = six.binary_type(self.tab.web_page.mainFrame().requestedUrl().toEncoded())
            if url == frame_url:
                self._raw_html = ''
                reply.readyRead.connect(self._ready_read)
        except:
            log.err()
        finally:
            return reply

    def _ready_read(self):
        reply = self.sender()
        self._raw_html = self._raw_html + six.binary_type(reply.peek(reply.bytesAvailable()))


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

    @property
    def name(self):
        return self.auth.get('username', '')

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
    def log(self, s):
        print(s)

    @pyqtSlot('QString')
    def sendMessage(self, message):
        message = text(message)
        message = message.strip('\x00') # Allocation bug somewhere leaves null characters at the end.
        try:
            command, data = json.loads(message)
        except ValueError as e:
            return log.err(ValueError(
                "%s JSON head: %r tail: %r" % (e.message, message[:100], message[-100:])
            ))
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
        'resolve': resolve,
        'resume': resume,
        'log_event': log_event,
        'pause': pause,
        'extract_items': extract_items,
        'save_html': save_html
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
        self.start_time = monotonic()
        self.spent_time = 0
        self.session_id = ''
        self.factory[self] = User(request.auth_info)

    def onOpen(self):
        if self not in self.factory:
            self.sendClose(1000, 'Invalid Connection missing required '
                                 'parameters')

    def onMessage(self, payload, isbinary):
        payload = payload.decode('utf-8')
        data = json.loads(payload)
        if '_meta' in data and 'session_id' in data['_meta']:
            self.session_id = data['_meta']['session_id']
        if '_command' in data and data['_command'] in self._handlers:
            command = data['_command']
            try:
                result = self._handlers[command](data, self)
            except Exception as e:
                command = data.get('_callback') or command
                if isinstance(e, BaseHTTPError):
                    code = e.status
                    reason = e.title
                else:
                    code = 500
                    reason = "Internal Server Error"

                failure = Failure(e)
                log.err(failure)
                event_id = getattr(failure, 'sentry_event_id', None)
                if event_id:
                    reason = "%s (Event ID: %s)" % (reason, event_id)

                return self.sendMessage({
                    'error': code,
                    '_command': command,
                    'id': data.get('_meta', {}).get('id'),
                    'reason': reason
                })

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
        if self in self.factory:
            if self.tab is not None:
                self.tab.close()
            self._handlers['pause']({}, self)
            msg_data = {'session': self.session_id,
                        'session_time': self.spent_time,
                        'user': self.user.name}
            msg = (u'Websocket Closed: id=%(session)s t=%(session_time)s '
                   u'user=%(user)s command=' % (msg_data))
            log.err(msg)

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
        manager = PortiaNetworkManager(
            request_middlewares=[],
            response_middlewares=[],
            verbosity=defaults.VERBOSITY
        )
        manager.setCache(None)

        data = {}
        data['uid'] = id(data)

        self.factory[self].tab = BrowserTab(
            network_manager=manager,
            splash_proxy_factory=None,
            verbosity=0,
            render_options=RenderOptions(data, defaults.MAX_TIMEOUT),
            visible=True,
        )
        manager.tab = self.tab
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
        main_frame = self.tab.web_page.mainFrame()
        main_frame.addToJavaScriptWindowObject('__portiaApi', self.js_api)
        self.tab.run_js_files(
            os.path.join(self.assets, '..', '..', 'slyd', 'dist', 'splash_content_scripts'),
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

        spider = spec.spider_with_templates(spider_name)
        items = spec.resource('items')
        extractors = spec.resource('extractors')
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
