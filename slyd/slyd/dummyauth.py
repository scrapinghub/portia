from twisted.web.resource import Resource


def protectResource(resource, config):
    '''Dummy resource protector.'''
    return DummyAuthResource(resource)


class DummyAuthResource(Resource):
    """A wrapper that injects dummy auth info to every passing request."""

    def __init__(self, resource):
        Resource.__init__(self)
        self.wrapped = resource

    def getChildWithDefault(self, path, request):
        request.auth_info = {
            'username': 'defaultuser',
        }
        # Don't consume any segments.
        request.postpath.insert(0, request.prepath.pop())
        return self.wrapped
