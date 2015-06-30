import functools
import requests

from twisted.internet.threads import deferToThread
from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET

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
        cb = functools.partial(self.end_response, request, url, tabid)
        if not user:
            d = deferToThread(requests.get, url, headers={'referer': referer})
            d.addCallback(cb)
            return NOT_DONE_YET

        if request.auth_info['username'] != user.auth['username']:
            return self._error(request, 403, "You don't own that browser session")

        user.tab.http_client.get(url, cb, headers={'referer': referer})
        return NOT_DONE_YET

    def end_response(self, request, original_url, tabid, reply):
        if hasattr(reply, 'readAll'):
            content = str(reply.readAll())
        else:
            content = ''.join(chunk for chunk in reply.iter_content(65535))
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
