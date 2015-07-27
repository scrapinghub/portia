from cStringIO import StringIO
from twisted.internet.defer import succeed
from twisted.web import server
from twisted.web.http_headers import Headers
from twisted.web.test.test_web import DummyRequest
from scrapy.settings import Settings as ScrapySettings
from slyd.specmanager import SpecManager
from slyd.projects import ProjectsManagerResource
import tests.settings as test_settings


def create_spec_manager(projects_dir=None):
    """Create a CrawlerSpecManager configured to use test settings"""
    crawler_settings = ScrapySettings()
    crawler_settings.setmodule(test_settings)
    projects_dir = projects_dir or test_settings.SPEC_DATA_DIR
    test_settings.SPEC_FACTORY['PARAMS']['location'] = projects_dir
    return SpecManager(crawler_settings)


def create_projects_resource(temp_projects_dir):
    """Create a ProjectsResource configured to use test settings"""
    return ProjectsManagerResource(create_spec_manager(temp_projects_dir))


class _SlydDummyRequest(DummyRequest):
    def __init__(self, method, url, project='test', data=None, args=None,
                 headers=None, ajax=False):
        DummyRequest.__init__(self, url.split('/'))
        if data is not None:
            self.content = StringIO(data)
        if project is not None:
            self.project = project
        self.method = method
        self.headers.update(headers or {})
        self.auth_info = {"username": "testuser", "staff": True}
        self._is_ajax = ajax
        self.requestHeaders = Headers({'user-agent': ["DummyRequester/1.0, khtml like gecko, chrome, chromium, safari, IE, webkit, etc..."]})

        # set args
        args = args or {}
        for k, v in args.items():
            self.addArg(k, v)

    def value(self):
        return "".join(self.written)

    def is_ajax(self):
        return self._is_ajax


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
        return self._resolve_result(request, result)

    def _resolve_result(self, request, result):
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
