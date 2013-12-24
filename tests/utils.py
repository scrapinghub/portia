from cStringIO import StringIO
from twisted.internet.defer import succeed
from twisted.web import server
from twisted.web.test.test_web import DummyRequest
from scrapy.settings import CrawlerSettings
from slyd.crawlerspec import CrawlerSpecManager
import tests.settings as test_settings


def test_spec_manager():
    """Create a CrawlerSpecManager configured to use test settings"""
    crawler_settings = CrawlerSettings(settings_module=test_settings)
    return CrawlerSpecManager(crawler_settings)


class _SlydDummyRequest(DummyRequest):
    def __init__(self, method, url, project='test', data=None, args=None, headers=None):
        DummyRequest.__init__(self, url.split('/'))
        if data is not None:
            self.content = StringIO(data)
        if project is not None:
            self.project = project
        self.method = method
        self.headers.update(headers or {})
        # set args
        args = args or {}
        for k, v in args.items():
            self.addArg(k, v)

    def value(self):
        return "".join(self.written)


class TestSite(server.Site):
    """A Site used for test_settings

    Adds some convenience methods for GET and POST and result
    capture
    """

    def __init__(self, resource, project='test'):
        server.Site.__init__(self, resource)
        self.project = project

    def get(self, url, args=None, headers=None):
        return self._request("GET", url, args, headers, None)

    def post(self, url, data, args=None, headers=None):
        return self._request("POST", url, args, headers, data)

    def _request(self, method, url, args, headers, data):
        request = _SlydDummyRequest(method, url, self.project,
            data, args, headers)
        resource = self.getResourceFor(request)
        result = resource.render(request)
        return self._resolveResult(request, result)

    def _resolveResult(self, request, result):
        if isinstance(result, str):
            request.write(result)
            request.finish()
            return succeed(request)
        elif result is server.NOT_DONE_YET:
            if request.finished:
                return succeed(request)
            else:
                return request.notifyFinish().addCallback(lambda _: request)
        else:
            raise ValueError("Unexpected return value: %r" % (result,))
