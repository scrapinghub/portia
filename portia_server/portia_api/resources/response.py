import json

from django.http.response import HttpResponse
from wsgiref.util import FileWrapper

from six.moves import map
from twisted.python.compat import intToBytes


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


class FileResponse(HttpResponse):
    def __init__(self, name, content, *args, **kwargs):
        content = FileWrapper(content)
        super(FileResponse, self).__init__(
            content=content, content_type='application/zip')
        self['Content-Disposition'] = 'attachment; filename="%s"' % name
