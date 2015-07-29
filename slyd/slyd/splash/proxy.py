from __future__ import absolute_import
import functools
import requests

from twisted.internet.threads import deferToThread
from twisted.internet.defer import CancelledError
from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET

from PyQt4.QtNetwork import QNetworkRequest

from .ferry import User
from .css_utils import process_css

class ProxyResource(Resource):
    def render_GET(self, request):
        if not request.auth_info or not request.auth_info.get('username', None):
            return self._error(request, 403, 'Auth required')
        for arg in 'url', 'referer', 'tabid':
            if arg not in request.args or len(request.args[arg]) != 1:
                return self._error(request, 400, 'Argument required: {}'.format(arg))

        url = request.args['url'][0]
        referer = request.args['referer'][0]
        tabid = int(request.args['tabid'][0])
        user = User.findById(tabid)

        # It's not easy to cancel a request that's being made by splash, because it does't
        # return the QNetworkReply and when redirecting the current QNetworkReply changes,
        # so if the client closes the connection while fetching the content we simply note
        # it in this object and let the request finish without aborting.
        connection_status = { "finished": False }
        cb = functools.partial(self.end_response, request, url, connection_status, tabid)
        if not user or not user.tab:
            d = deferToThread(requests.get, url, headers={'referer': referer})
            d.addCallback(cb)
            d.addErrback(self._requestError, request)
            request.notifyFinish().addErrback(self._requestDisconnect, deferred=d)
            return NOT_DONE_YET

        if request.auth_info['username'] != user.auth['username']:
            return self._error(request, 403, "You don't own that browser session")

        request.notifyFinish().addErrback(self._requestDisconnect, None, connection_status)
        user.tab.http_client.get(url, cb, headers={'referer': referer})
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

    def end_response(self, request, original_url, connection_status, tabid, reply):
        if connection_status["finished"]:
            return

        if hasattr(reply, 'readAll'):
            content = str(reply.readAll())
            status_code = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute).toPyObject()
            request.setResponseCode(status_code or 500)
        else:
            content = ''.join(chunk for chunk in reply.iter_content(65535))
            redirect_url = None
            request.setResponseCode(reply.status_code)

        headers = {
            'cache-control': 'private',
            'pragma': 'no-cache',
            'content-type': 'application/octet-stream',
        }
        for header in ('content-type', 'cache-control', 'pragma', 'vary',
                       'max-age'):
            if hasattr(reply, 'hasRawHeader') and reply.hasRawHeader(header):
                headers[header] = str(reply.rawHeader(header))
            elif hasattr(reply, 'headers') and header in reply.headers:
                headers[header] = str(reply.headers.get(header))
            if header in headers:
                request.setHeader(header, headers[header])

        if headers['content-type'].strip().startswith('text/css'):
            content = process_css(content, tabid, original_url)
        request.write(content)
        request.finish()

    def _error(self, request, code, message):
        request.setResponseCode(code)
        return message
