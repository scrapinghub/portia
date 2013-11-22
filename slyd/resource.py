from twisted.web.resource import Resource, NoResource
from twisted.web.error import Error

class SlydJsonResource(Resource):
    """Base Resource for Slyd Resources

    This sets the content type to JSON and handles errors
    """

    def render(self, request):
        request.setHeader('Content-Type', 'application/json')
        try:
            return Resource.render(self, request)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return NoResource().render(request)
            else:
                raise


class SlydJsonObjectResource(SlydJsonResource):
    """Extends SlydJsonResource, converting
    the returned data to JSON
    """

    def render(self, request):
        resp = SlydJsonResource.render(self, request)
        if resp is not None:
            return json.dumps(resp)
