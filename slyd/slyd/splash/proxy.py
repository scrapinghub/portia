from __future__ import absolute_import
import functools
import requests

from base64 import b64decode

from twisted.internet.threads import deferToThread
from twisted.internet.defer import CancelledError
from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET
from twisted.python import log

from slybot.utils import encode

from .qtutils import QNetworkRequest, to_py
from .ferry import User, is_blacklisted
from .css_utils import process_css


class ProxyResource(Resource):
    def render_GET(self, request):
        if not request.auth_info or not request.auth_info.get('username', None):
            return self._error(request, 403, 'Auth required')
        for arg in (b'url', b'referer', b'tabid'):
            if arg not in request.args or len(request.args[arg]) != 1:
                return self._error(
                    request, 400, b'Argument required: %s' % arg)

        url = request.args[b'url'][0]
        if is_blacklisted(url):
            return self._error(request, 404, b'Not Found')
        referer = request.args[b'referer'][0]
        try:
            tabid = int(request.args[b'tabid'][0])
        except (ValueError, TypeError):
            return self._error(request, 400, b'Tab must exist' % arg)
        return self._load_resource(request, url, referer, tabid)

    def _load_resource(self, request, url, referer, tabid=None):
        # It's not easy to cancel a request that's being made by splash,
        # because it does't return the QNetworkReply and when redirecting the
        # current QNetworkReply changes, so if the client closes the connection
        # while fetching the content we simply note it in this object and let
        # the request finish without aborting.
        user = User.findById(tabid)
        connection_status = {"finished": False}
        cb = functools.partial(self.end_response, request, url, referer,
                               connection_status, tabid)
        if not (user and user.tab):
            # No browser session active, proxy resource instead
            return self._load_resource_proxy(request, url, referer, cb)
        if request.auth_info['username'] != user.auth['username']:
            return self._error(
                request, 403, b"You don't own that browser session")

        try:
            entry = next((entry for entry in user.tab.har()['log']['entries']
                          if entry['request']['url'] == url), None)
            response = entry['response']
            content = b64decode(response['content']['text'])
            for header in response['headers']:
                name, value = header['name'], header['value']
                name_lower = name.lower()
                if (name.startswith(('c', 'C')) and
                    name_lower == 'content-type' and
                        value.strip().startswith('text/css')):
                    content = process_css(content, tabid, url)
                if (name_lower.startswith('x-') or
                        name_lower in {'server', 'date', 'connection', 'transfer-encoding', 'content-encoding'}):
                    continue
                request.responseHeaders.addRawHeader(name.encode('ascii'),
                                                     value.encode('ascii'))
            request.setResponseCode(response['status'])
            return content
        except (AttributeError, KeyError, AssertionError, TypeError):
            pass

        request.notifyFinish().addErrback(self._requestDisconnect, None,
                                          connection_status)
        try:
            user.tab.http_client.get(url, cb, headers={'referer': referer})
            return NOT_DONE_YET
        except:
            # Sometimes the browser frame has been freed and we get a
            # "underlying C/C++ object has been deleted" error. Not sure if we
            # can do something to avoid it, but if it happens we proxy the
            # resource instead of recovering it from splash.
            log.err()
            return self._load_resource_proxy(request, url, referer, cb)

    def _load_resource_proxy(self, request, url, referer, cb):
        d = deferToThread(requests.get, url, headers={'referer': referer})
        d.addCallback(cb)
        d.addErrback(self._requestError, request)
        request.notifyFinish().addErrback(self._requestDisconnect, deferred=d)
        return NOT_DONE_YET

    def _requestError(self, err, request):
        if not err.check(CancelledError):
            request.setResponseCode(500)
            request.write('Error fetching the content')
            request.finish()

    def _requestDisconnect(self, err, deferred=None, connection_status=None):
        if deferred:
            deferred.cancel()
        if connection_status:
            connection_status["finished"] = True

    def end_response(self, request, original_url, referer, connection_status,
                     tabid, reply):
        if connection_status["finished"]:
            return

        if hasattr(reply, 'readAll'):
            content = bytes(reply.readAll())
            status_code = to_py(reply.attribute(QNetworkRequest.HttpStatusCodeAttribute))
            if status_code == 400:
                return self._load_resource(request, original_url, referer)
            request.setResponseCode(status_code or 500)
        else:
            content = b''.join(chunk for chunk in reply.iter_content(65535))
            request.setResponseCode(reply.status_code)

        headers = {
            b'cache-control': b'private',
            b'pragma': b'no-cache',
            b'content-type': b'application/octet-stream',
        }
        for header in (b'content-type', b'cache-control', b'pragma', b'vary',
                       b'max-age'):
            if hasattr(reply, 'hasRawHeader') and reply.hasRawHeader(header):
                headers[header] = bytes(reply.rawHeader(header))
            elif hasattr(reply, 'headers') and header in reply.headers:
                headers[header] = bytes(reply.headers.get(header))
            if header in headers:
                request.setHeader(header, headers[header])

        if bytes(headers[b'content-type']).strip().startswith(b'text/css'):
            content = encode(process_css(content, tabid, original_url))
        request.write(content)
        request.finish()

    def _error(self, request, code, message):
        request.setResponseCode(code)
        return message
