from __future__ import absolute_import
from functools import partial
import json
import os
import copy
import re

from six.moves.urllib_parse import urlparse

from autobahn.twisted.resource import WebSocketResource
from autobahn.twisted.websocket import (WebSocketServerFactory,
                                        WebSocketServerProtocol)
from weakref import WeakKeyDictionary, WeakValueDictionary
from twisted.internet import defer, task
from twisted.python import log

from scrapy.settings import Settings
from scrapy.utils.serialize import ScrapyJSONEncoder
from splash import defaults
from splash.engines.webkit.browser_tab import WebkitBrowserTab, skip_if_closing
from splash.network_manager import SplashQNetworkAccessManager
from splash.qtutils import drop_request
from splash.render_options import RenderOptions

from slybot.spider import IblSpider
from slybot.utils import decode
from portia_api.errors import BaseHTTPError

from django.conf import settings
from django.db import close_old_connections

from storage import create_project_storage

from portia_orm.models import Project
from portia_orm.datastore import data_store_context
from portia_orm.utils import short_guid
from portia_api.utils.spiders import load_spider_data

from .qtutils import QObject, pyqtSlot, QWebElement
from .cookies import PortiaCookieJar
from .commands import Commands
from .css_utils import process_css, wrap_url
from .utils import _DEFAULT_VIEWPORT, ProjectsDict
import six
text = six.text_type  # unicode in py2, str in py3

import txaio
txaio.use_twisted()

_DEFAULT_USER_AGENT = ('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36')
IGNORED_TYPES = (b'video/', b'audio/', b'application/ogg')
MEDIA_EXTENSIONS = (
    b'.aac', b'.avi', b'.mid', b'.mpeg', b'.oga', b'.ogv', b'.ogx', b'.swf',
    b'.wav', b'.weba', b'.webm', b'.xul', b'.3gp', b'.3g2'
)
STORED_TYPES = (b'text/html', b'text/xhtml', b'text/xml', b'text/plain',
                b'text/css', b'image/', b'application/font')
STORED_EXTENSIONS = (b'.jpg', b'.jpeg', b'.png', b'.webp', b'.gif', b'.svg',
                     b'.css', b'.xml', b'.html', b'.htm', b'.xhtml', b'.woff',
                     b'.woff2', b'.ttf', b'.otf', b'.eot')


def _is_xml(accepts):
    if accepts.startswith(b'application/'):
        has_xml = accepts.find(b'xml')
        if has_xml > 0:
            semicolon = accepts.find(b';')
            if semicolon < 0 or has_xml < semicolon:
                return True
    return False


def wrap_callback(connection, callback, retries=0, **parsed):
    result = callback(**parsed)
    if hasattr(parsed.get('storage'), '_working_tree'):
        parsed['storage'].commit()
    return result


def create_ferry_resource(factory):
    return FerryWebSocketResource(factory)


class PortiaNetworkManager(SplashQNetworkAccessManager):
    _raw_html = None

    def createRequest(self, operation, request, outgoingData=None):
        reply = super(PortiaNetworkManager, self).createRequest(
            operation, request, outgoingData)
        if getattr(self, 'closed', False):
            return reply
        try:
            url = six.binary_type(request.url().toEncoded())
            frame_url = six.binary_type(
                self.tab.web_page.mainFrame().requestedUrl().toEncoded())
            if url == frame_url:
                self._raw_html = ''
                self._url = ''
                reply.readyRead.connect(self._ready_read)
        except:
            log.err()
        finally:
            return reply

    def _ready_read(self):
        reply = self.sender()
        self._raw_html = (self._raw_html + six.binary_type(
            reply.peek(reply.bytesAvailable())))
        self._url = six.text_type(reply.url().toString())


class PortiaBrowserTab(WebkitBrowserTab):
    # fix: AttributeError: 'PortiaBrowserTab' object has no attribute 'url'
    # WebkitBrowserTab._closing was removed
    # TODO? use @skip_if_closing decorator?
    #@skip_if_closing
    #@property
    #def url(self):
    #    """ Current URL """
    #    if self._closing: # throws
    #        return ''
    #    return super().url

    @skip_if_closing
    def evaljs(self, *args, **kwargs):
        return super(PortiaBrowserTab, self).evaljs(*args, **kwargs)


class FerryWebSocketResource(WebSocketResource):
    def __init__(self, factory):
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
        self.project_map = ProjectsDict(auth)
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
    def __init__(self, project, name, spider, items, extractors):
        self.project = project
        self.name = name
        self._spider = spider
        self._items = items
        self._extractors = extractors

    @property
    def spider(self):
        return copy.deepcopy(self._spider)

    @property
    def items(self):
        return copy.deepcopy(self.items)

    @property
    def extractors(self):
        return copy.deepcopy(self._extractors)

    @property
    def templates(self):
        return self.spider['templates']

    def __repr__(self):
        return '{}({})'.format(self.__class__.__name__, str(self))

    def __str__(self):
        return '{}, {}'.format(self.project, self.name)


class PortiaJSApi(QObject):
    def __init__(self, protocol):
        super(PortiaJSApi, self).__init__()
        self.protocol = protocol
        self.call = None

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
        # Allocation bug somewhere leaves null characters at the end.
        message = message.strip('\x00')
        try:
            command, data = json.loads(message)
        except ValueError as e:
            return log.err(ValueError(
                "%s JSON head: %r tail: %r" % (e.message, message[:100],
                                               message[-100:])
            ))
        self.protocol.sendMessage({
            '_command': command,
            '_data': data
        })
        if command == 'mutation' and not self.call:
            self.call = task.deferLater(self.protocol.factory.reactor, 1,
                                        self.extract)

    def extract(self):
        commands = Commands({}, self.protocol, None)
        self.protocol.sendMessage(commands.metadata())
        self.call = None


def is_blacklisted(url):
    return urlparse(url).netloc in settings.BLACKLIST_URLS


def blacklist_error(data, socket):
    meta = data.get('_meta', {})
    extra_meta = {'id': meta.get('id')}
    msg = "Sorry Portia doesn't support this page :("
    extra_meta.update(error=4500, reason=msg)
    commands = Commands({}, socket, None)
    socket.sendMessage(commands.metadata(extra_meta))


class FerryServerProtocol(WebSocketServerProtocol):

    _handlers = {
        'load': 'load_page',
        'interact': 'interact_page'
    }
    assets = './'
    settings = Settings()

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
            auth_info = json.loads(request.headers['x-auth-info'])
        except (KeyError, TypeError):
            return
        self.session_id = ''
        self.auth_info = auth_info
        self.factory[self] = User(auth_info)

    def onOpen(self):
        if self not in self.factory:
            self.sendClose(1000, 'Invalid Connection missing required '
                                 'parameters')

    def onMessage(self, payload, isbinary):
        close_old_connections()
        payload = payload.decode('utf-8')
        data = json.loads(payload)
        project = data.get('project', data.get('_meta', {}).get('project'))
        storage = create_project_storage(project, author=self.user)
        projects = storage.__class__.get_projects(self.user)
        if project and str(project) not in projects:
            self.sendMessage({'status': 4004, 'message': 'Project not found'})
            return
        deferred = defer.maybeDeferred(
            wrap_callback, None, self._on_message, storage=storage, data=data)
        deferred.addCallbacks(self.sendMessage,
                              partial(self.send_error, data))

    def _on_message(self, storage, data):
        if '_meta' in data and 'session_id' in data['_meta']:
            self.session_id = data['_meta']['session_id']

        if is_blacklisted(data.get('url', '')):
            blacklist_error(data, self)
            return

        command = data['_command']
        command = self._handlers.get(command, command)
        with data_store_context():
            commands = Commands(data, self, storage)
            result = getattr(commands, command, lambda: None)()
        if result:
            result.setdefault('_command', data.get('_callback', command))
            if '_meta' in data and 'id' in data['_meta']:
                result['id'] = data['_meta']['id']
        return result

    def onClose(self, was_clean, code, reason):
        if self in self.factory:
            if self.tab is not None:
                self.tab.close()
                self.tab.network_manager.closed = True
            msg_data = {'session': self.session_id,
                        'session_time': 0,
                        'user': self.user.name}
            msg = (u'Websocket Closed: id=%(session)s t=%(session_time)s '
                   u'user=%(user)s command=' % (msg_data))
            log.err(msg)

    def sendMessage(self, payload, is_binary=False):
        if isinstance(payload, dict) and '_command' in payload:
            data = json.dumps(
                payload, cls=ScrapyJSONEncoder, sort_keys=True).encode('utf-8')
            super(FerryServerProtocol, self).sendMessage(data, is_binary)

    def send_error(self, data, failure):
        e = failure.value
        command = data.get('_callback', data.get('_command'))
        id_ = data.get('_meta', {}).get('id')
        if isinstance(e, BaseHTTPError):
            code, reason, message = e.status, e.title, e.body
        elif isinstance(e, KeyError):
            requested_command = data.get('_command')
            code = 4000
            reason = "Unknown command"
            if requested_command:
                message = 'No command named "%s" found.' % requested_command
            else:
                message = "No command received"
        else:
            code = 500
            reason = "Internal Server Error"
            message = "An unexpected error has occurred."
        log.err(failure)
        event_id = getattr(failure, 'sentry_event_id', None)
        if event_id:
            message = "%s (Event ID: %s)" % (message, event_id)

        response = {
            'error': code,
            'reason': reason,
            'message': message,
        }
        if command:
            response['_command'] = command
        if id_:
            response['id'] = id_

        self.sendMessage(response)

    def getElementByNodeId(self, nodeid):
        self.tab.web_page.mainFrame().evaluateJavaScript(
            'livePortiaPage.pyGetByNodeId(%s)' % nodeid
        )
        return self.js_api.getReturnedElement()

    def open_tab(self, meta=None):
        if meta is None:
            meta = {}
        manager = SplashQNetworkAccessManager(
            request_middlewares=[],
            response_middlewares=[],
            verbosity=defaults.VERBOSITY
        )
        manager.setCache(None)

        data = {}
        data['uid'] = id(data)

        self.factory[self].tab = PortiaBrowserTab(
            network_manager=manager,
            splash_proxy_factory=None,
            verbosity=defaults.VERBOSITY,
            render_options=RenderOptions(data, defaults.MAX_TIMEOUT),
            visible=True,
        )
        manager.tab = self.tab
        self.tab.register_callback('on_request', self._configure_requests)
        self.tab.register_callback('on_response', self._set_tab_html)
        main_frame = self.tab.web_page.mainFrame()
        cookiejar = PortiaCookieJar(self.tab.web_page, self)
        manager.cookiejar = cookiejar
        manager.setCookieJar(cookiejar)
        if meta.get('cookies'):
            cookiejar.put_client_cookies(meta['cookies'])

        self.tab.web_page.loadStarted.connect(self._on_load_started)
        main_frame.loadFinished.connect(self._on_load_finished)

        self.js_api = PortiaJSApi(self)
        main_frame.javaScriptWindowObjectCleared.connect(
            self._on_javascript_window_cleared)
        main_frame.initialLayoutCompleted.connect(self._on_layout_completed)

        self.tab.set_images_enabled(True)
        self.tab.set_viewport(meta.get('viewport') or _DEFAULT_VIEWPORT)
        self.tab.set_user_agent(meta.get('user_agent') or _DEFAULT_USER_AGENT)
        self.tab.loaded = False

    def _on_load_started(self):
        self.load_id = short_guid()
        self.sendMessage({'_command': 'loadStarted', 'id': self.load_id,
                          'url': self.tab.url})
        self.tab.initial_layout_completed = False
        return True

    def _on_load_finished(self, ok=False):
        if getattr(self.tab, '_raw_url', None) != self.tab.url:
            page = self.tab.web_page
            page.triggerAction(page.ReloadAndBypassCache, False)
            # Avoid infinite reload loop
            self.tab._raw_url = self.tab.url
        self.sendMessage({'_command': 'loadFinished', 'url': self.tab.url,
                          'id': getattr(self, 'load_id', None)})
        return True

    def _configure_requests(self, request, operation, data):
        if request.hasRawHeader(b'Accept'):
            url = six.binary_type(request.url().toEncoded())
            url_path = urlparse(url).path.lower()
            accepts = bytes(request.rawHeader(b'Accept')).lower()
            if (accepts.startswith(STORED_TYPES) or _is_xml(accepts) or
                    url_path.endswith(STORED_EXTENSIONS)):
                request.track_response_body = True
            elif (accepts.startswith(IGNORED_TYPES) or
                  url_path.endswith(MEDIA_EXTENSIONS)):
                drop_request(request)

    def _set_tab_html(self, reply, har, content):
        url = reply.url().toString()
        if content is not None and url == self.tab.url:
            self.tab._raw_html = decode(content)
            self.tab._raw_url = decode(url)

    def _on_layout_completed(self):
        if not getattr(self.tab, 'initial_layout_completed', False):
            self.populate_window_object()
            self.tab.initial_layout_completed = True

    def _on_javascript_window_cleared(self):
        if getattr(self.tab, 'initial_layout_completed', False):
            self.populate_window_object()

    def populate_window_object(self):
        main_frame = self.tab.web_page.mainFrame()
        main_frame.addToJavaScriptWindowObject('__portiaApi', self.js_api)
        path = os.path.join(
            self.assets, b'splash_content_scripts').decode('utf-8')
        self.tab.run_js_files(path, handle_errors=False)

    def open_spider(self, meta, storage=None, project=None):
        if not (meta.get('project') and meta.get('spider')):
            return {'error': 4005, 'reason': 'No project specified'}

        if (self.user.authorized_projects is not None and
                meta['project'] not in self.user.authorized_projects and
                not self.user.staff):
            return {'error': 4004,
                    'reason': 'Project "%s" not found' % meta['project']}
        spider_name = meta['spider']

        if project is None:
            project = Project(storage, id=meta.get('project'))

        try:
            spider_model = project.spiders[spider_name]
        except (IOError, KeyError):
            return {'error': 4004,
                    'reason': 'Spider "%s" not found' % spider_name}
        spider_name, spider, items, extractors = load_spider_data(spider_model)
        if not self.settings.get('SPLASH_URL'):
            self.settings.set('SPLASH_URL', 'portia')
        self.factory[self].spider = IblSpider(spider_name, spider, items,
                                              extractors, self.settings)
        self.factory[self].spiderspec = SpiderSpec(
            project, spider_name, spider, items, extractors)

    def __repr__(self):
        return '{}({})'.format(self.__class__.__name__, str(self))

    def __str__(self):
        tab, spider, spec = '', '', ''
        if self.tab:
            try:
                tab = '{}({})'.format(
                    self.tab.__class__.__name__, self.tab.url)
            except RuntimeError:
                tab = 'MISSING'
        if self.spider:
            spider = '{}({})'.format(
                self.spider.__class__.__name__, self.spider.name)
        if self.spiderspec:
            spec = str(self.spiderspec)
        return ', '.join(filter(bool, (tab, spider, spec)))


class FerryServerFactory(WebSocketServerFactory):
    def __init__(self, uri, assets='./'):
        WebSocketServerFactory.__init__(self, uri)
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
