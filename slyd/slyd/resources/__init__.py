from __future__ import absolute_import
from .projects import download


class Route(object):
    __slots__ = ('path', 'get', 'post', 'patch', 'delete')

    def __init__(self, path, get=None, post=None, patch=None, delete=None):
        self.path = path
        self.get = get
        self.post = post
        self.patch = patch
        self.delete = delete

    @property
    def methods(self):
        return ('get', 'post', 'patch', 'delete')

    def __repr__(self):
        return 'Route(%s)' % str(self)

    def __str__(self):
        methods = '", "'.join(method.upper() for method in self.methods
                              if getattr(self, method) is not None)
        return 'path="%s", methods=["%s"]' % (self.path, methods or None)

project_download = Route(
    'projects/{project_id}/download',
    get=download
)
spider_download = Route(
    'projects/{project_id}/download/{spider_id}',
    get=download
)
routes = [
    project_download,
    spider_download,
]
