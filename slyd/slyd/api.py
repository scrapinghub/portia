import json
from six.moves.urllib.parse import unquote

from itertools import groupby
from operator import itemgetter

from jsonschema.exceptions import ValidationError as jsValidationError
from marshmallow.exceptions import ValidationError as mwValidationError
from parse import compile

from .resources import routes
from .errors import BadRequest, NotFound, BaseError, InternalServerError


class APIResource(object):
    isLeaf = True
    children = routes
    method_map = {'PUT': 'PATCH'}

    def __init__(self, spec_manager):
        self.spec_manager = spec_manager
        if getattr(spec_manager, 'api_routes', None):
            self.children = spec_manager.api_routes
        self.routes = self._build_routes()

    def _build_routes(self):
        routes = sorted(((method.upper(), len(route.path.split('/')),
                          route.path, getattr(route, method))
                         for route in self.children
                         for method in route.methods
                         if getattr(route, method)), reverse=True)
        return {method: sorted(((compile(p), cb)
                                for _, _, p, cb in info),
                               reverse=True,
                               key=lambda x: len(x[0]._format.split('/')))
                for method, info in groupby(routes, itemgetter(0))}

    def _parse(self, route, path):
        path = '/'.join(path).strip('/')
        if len(path.split('/')) > len(route._format.split('/')):
            raise NotFound('No route found for path "/api/%s"' % path)
        return route.parse(path)

    def render(self, request):
        method = request.method.upper()
        method = self.method_map.get(method, method)
        # TODO (SPEC): get content-type/accept and return error if it has media
        #              extensions
        try:
            for i in range(1):
                # TODO (SPEC): Check content-type and raise error when needed
                for route, callback in self.routes[method]:
                    parsed = self._parse(route, request.postpath)
                    if parsed:
                        if 'project_id' in parsed.named:
                            manager = self.spec_manager.project_spec(
                                parsed.named.pop('project_id'),
                                request.auth_info)
                            manager.pm = self.spec_manager.project_manager(
                                request.auth_info)
                        else:
                            manager = self.spec_manager.project_manager(
                                request.auth_info)
                        parsed = {k: unquote(v)
                                  for k, v in parsed.named.items()}
                        parsed['attributes'] = load_attributes(request)
                        return self.format_response(request,
                                                    callback(manager,
                                                             **parsed))
        except KeyError as ex:
            if isinstance(ex, KeyError):
                ex = NotFound('Resource not found',
                              'The resource at "%s" could not be'
                              ' found' % request.path)
            return self.format_error(request, ex)
        except (AssertionError, jsValidationError, mwValidationError) as ex:
            return self.format_error(request,
                                     BadRequest('The input data was not valid.'
                                                ' Validation failed with the '
                                                'error: %s.' % str(ex)))
        except BaseError as ex:
            return self.format_error(request, ex)
        except Exception as ex:
            return self.format_error(request,
                                     self._handle_uncaught_exception(ex))
        return self.format_error(request, NotFound('Resource not found',
                                                   'No route matches: '
                                                   '"%s"' % request.path))

    def format_response(self, request, data):
        status = 200
        if request.method == 'POST':
            status = 204 if data is None else 201
        request.setResponseCode(status)
        request.setHeader(b'content-type', b"application/vnd.api+json")
        return json.dumps(data)

    def format_error(self, request, error):
        request.setResponseCode(error.status)
        request.setHeader(b'content-type', b"application/vnd.api+json")
        data = {
            'status': error.status,
            'title': error.title,
            'detail': error.body,
        }
        _id = getattr(error, 'id', None)
        if _id is not None:
            data['id'] = _id
        return json.dumps({'errors': [data]})

    def _handle_uncaught_exception(self, ex):
        # TODO: log and return traceback
        return InternalServerError('An unexpected error has occurred')


def load_attributes(request):
    try:
        data = json.loads(request.content.read())
    except ValueError:
        data = {}
    data['arguments'] = request.args
    return data
