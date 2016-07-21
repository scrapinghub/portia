from six.moves.urllib.parse import unquote

from functools import partial
from itertools import groupby
from operator import itemgetter

from twisted.internet.defer import maybeDeferred
from twisted.web.http import RESPONSES, FORBIDDEN
from twisted.web.server import NOT_DONE_YET
from jsonschema.exceptions import ValidationError as jsValidationError
from marshmallow.exceptions import ValidationError as mwValidationError
from parse import compile

from .resources.annotations import AnnotationRoute
from .resources.extractors import ExtractorRoute
from .resources.fields import FieldRoute
from .resources.items import ItemRoute
from .resources.projects import ProjectRoute
from .resources.response import (JsonApiError, JsonApiErrorResponse,
                                 JsonApiNotFoundResponse)
from .resources.spiders import SpiderRoute
from .resources.samples import SampleRoute
from .resources.schemas import SchemaRoute
from .errors import BadRequest, BaseError, Forbidden

FORBIDDEN_TEXT = 'You do not have access to this project.'
VALIDATION_ERRORS = (AssertionError, jsValidationError, mwValidationError)


class APIResource(object):
    isLeaf = True
    children = [
        AnnotationRoute,
        ExtractorRoute,
        FieldRoute,
        ItemRoute,
        ProjectRoute,
        SampleRoute,
        SchemaRoute,
        SpiderRoute,
    ]

    def __init__(self, spec_manager):
        self.spec_manager = spec_manager
        if getattr(spec_manager, 'api_routes', None):
            self.children = spec_manager.api_routes
        self.routes = self._build_routes()

    def _build_routes(self):
        routes = sorted(((method, len(path.split('/')), path, route)
                         for route in self.children
                         for method, path in route.get_resources()),
                        reverse=True)
        return {method: sorted(((compile(p), p, route)
                                for _, _, p, route in info),
                               reverse=True,
                               key=lambda x: len(x[0]._format.split('/')))
                for method, info in groupby(routes, itemgetter(0))}

    def _parse(self, parser, path):
        path = '/'.join(path).strip('/')
        if len(path.split('/')) > len(parser._format.split('/')):
            return
        return parser.parse(path)

    def render(self, request):
        method = request.method.lower()
        # TODO (SPEC): get content-type/accept and return error if it has media
        #              extensions
        # TODO (SPEC): Check content-type and raise error when needed
        for parser, path, route_class in self.routes[method]:
            parsed = self._parse(parser, request.postpath)
            if parsed:
                if 'project_id' in parsed.named:
                    if not self._has_auth(request, parsed.named['project_id']):
                        return JsonApiErrorResponse(
                            Forbidden(
                                RESPONSES[FORBIDDEN],
                                FORBIDDEN_TEXT)).render(request)

                    project_spec = self.spec_manager.project_spec(
                        parsed.named.get('project_id'),
                        request.auth_info)
                    project_manager = self.spec_manager.project_manager(
                        request.auth_info)
                    project_spec.pm = project_manager
                    project_manager.request = request
                else:
                    project_manager = self.spec_manager.project_manager(
                        request.auth_info)
                    project_spec = None

                parsed = {k: unquote(v) for k, v in parsed.named.items()}
                route = route_class(route_path=path,
                                    request=request,
                                    args=parsed,
                                    project_manager=project_manager,
                                    project_spec=project_spec)

                deferred = maybeDeferred(route.dispatch)
                deferred.addErrback(partial(self.deferred_failed, request))
                deferred.addCallback(partial(self.deferred_finished, request))
                return NOT_DONE_YET

        return JsonApiNotFoundResponse().render(request)

    def deferred_finished(self, request, response):
        response.render_async(request)

    def deferred_failed(self, request, failure):
        error = failure.value
        if isinstance(error, JsonApiError):
            return error
        if isinstance(error, VALIDATION_ERRORS):
            error = BadRequest('The input data was not valid. Validation '
                               'failed with the error: %s.' % str(error))
        if isinstance(error, BaseError):
            return JsonApiErrorResponse(error)
        else:
            request.setResponseCode(500)
            request.setHeader(b'content-type', b'text/plain')
            request.write(failure.getTraceback())
        request.finish()
        return failure

    def _has_auth(self, request, project_id):
        auth_info = request.auth_info
        if ('authorized_projects' not in auth_info or
                auth_info.get('staff', False) or
                project_id in auth_info['authorized_projects']):
            return True
        return False
