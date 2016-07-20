from collections import OrderedDict
import json

from six.moves import map
from twisted.python.compat import intToBytes
from twisted.web.http import RESPONSES, NOT_FOUND, BAD_REQUEST
from twisted.web.server import NOT_DONE_YET

from ..errors import NotFound


class BaseApiResource(object):
    def render(self, request):
        raise NotImplementedError

    def render_async(self, request):
        body = self.render(request)
        if body is not NOT_DONE_YET:
            if body is not None:
                request.setHeader(b'content-length', intToBytes(len(body)))
                request.write(body)
            request.finish()


class JsonApiResource(BaseApiResource):
    def __init__(self, status, data=None):
        self.status = status
        self.data = data

    def render(self, request):
        request.setResponseCode(self.status)

        data = self.data
        if data is not None:
            content_type = b"application/vnd.api+json"
            profiles = data.get('links', {}).get('profile', [])
            if profiles:
                content_type += b'; profile="{}"'.format(
                    b' '.join(map(bytes, profiles)))
            request.setHeader(b'content-type', content_type)

            return json.dumps(data, indent=2)


class JsonApiError(JsonApiResource, Exception):
    pass


class JsonApiErrorResponse(JsonApiError):
    def __init__(self, error):
        super(JsonApiErrorResponse, self).__init__(None)
        self.error = error

    def render(self, request):
        error = self.error
        self.status = error.status
        self.data = data = OrderedDict([
            ('id', getattr(error, 'id', None)),
            ('status', error.status),
            ('title', error.title),
            ('detail', error.body),
        ])
        if data['id'] is None:
            del data['id']
        return super(JsonApiErrorResponse, self).render(request)


class JsonApiNotFoundResponse(JsonApiErrorResponse):
    def __init__(self):
        super(JsonApiNotFoundResponse, self).__init__(None)

    def render(self, request):
        self.error = NotFound(
            RESPONSES[NOT_FOUND], "Resource '%s' not found." % request.path)
        return super(JsonApiNotFoundResponse, self).render(request)


class JsonApiValidationErrorResponse(JsonApiError):
    def __init__(self, data):
        super(JsonApiValidationErrorResponse, self).__init__(BAD_REQUEST, {
            'errors': [OrderedDict([
                ('status', BAD_REQUEST),
                ('title', RESPONSES[BAD_REQUEST]),
                ('detail', error['detail']),
                ('source', error['source']),
            ]) for error in data.get('errors', [])]
        })


class ProjectDownloadResponse(BaseApiResource):
    def __init__(self, project_id, spider_ids, fmt, version, branch,
                 project_manager):
        self.command = {
            'cmd': 'download',
            'args': [project_id, spider_ids]
        }
        self.file_content = project_manager.download_project(
            project_id, spider_ids, fmt=fmt, version=version, branch=branch)
        self.project_manager = project_manager

    def render(self, request):
        file_content = self.project_manager._render_file(
            request, self.command, self.file_content)
        request.write(file_content)
        request.finish()
        return NOT_DONE_YET
