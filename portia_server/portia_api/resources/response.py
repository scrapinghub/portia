import json

from six.moves import map
from twisted.python.compat import intToBytes
from twisted.web.server import NOT_DONE_YET


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


class ProjectDownloadResponse(BaseApiResource):
    def __init__(self, project_id, spider_ids, fmt, project_manager):
        self.command = {
            'cmd': 'download',
            'args': [project_id, spider_ids]
        }
        self.file_content = project_manager.download_project(
            project_id, spider_ids, fmt=fmt)
        self.project_manager = project_manager

    def render(self, request):
        file_content = self.project_manager._render_file(
            request, self.command, self.file_content)
        request.write(file_content)
        request.finish()
        return NOT_DONE_YET
