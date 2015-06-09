import functools

from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET

from .ferry import User
from .css_utils import process_css

class ProxyResource(Resource):
    def render_GET(self, request):
        if not request.auth_info or not request.auth_info.get('username', None):
            return self._error(request, 403, 'Auth required')
        for arg in 'url', 'referer':
            if arg not in request.args or len(request.args[arg]) != 1:
                return self._error(request, 400, 'Argument required: {}'.format(arg))

        url = request.args['url'][0]
        referer = request.args['referer'][0]
        username = request.auth_info['username'].lower()
        user = User.findByUserName(username)
        if not user or not user.tab:
            return self._error(request, 403, 'No session active')

        cb = functools.partial(self.end_response, request, url)
        user.tab.http_client.get(url, cb, headers={'referer': referer})
        return NOT_DONE_YET

    def end_response(self, request, original_url, reply):
        content = str(reply.readAll())
        headers = {
            'cache-control': 'private',
            'pragma': 'no-cache',
            'content-type': 'application/octet-stream',
        }
        for header in 'content-type', 'cache-control', 'pragma':
            if reply.hasRawHeader(header):
                headers[header] = str(reply.rawHeader(header))
                request.setHeader(header, headers[header])

        if headers['content-type'].strip().startswith('text/css'):
            content = process_css(content, original_url)
        request.write(content)
        request.finish()

    def _error(self, request, code, message):
        request.setResponseCode(code)
        return message
