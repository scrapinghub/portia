import json, errno
from twisted.web.resource import Resource, NoResource, ErrorPage


class SlydJsonResource(Resource):
    """Base Resource for Slyd Resources

    This sets the content type to JSON and handles errors
    """

    def render(self, request):
        request.setResponseCode(200)
        request.setHeader('Content-Type', 'application/json')
        try:
            return Resource.render(self, request)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return NoResource().render(request)
            else:
                raise
        except ErrorPage as ex:
            return ex.render(request)

    def error(self, request, status, why):
        raise ErrorPage(request, status, why)

    def bad_request(self, why):
        self.error(400, "Bad Request", why)

    def read_json(self, request):
        try:
            return json.load(request.content)
        except ValueError as ex:
            self.bad_request("Error parsing json. %s" % ex.message)


class SlydJsonObjectResource(SlydJsonResource):
    """Extends SlydJsonResource, converting
    the returned data to JSON
    """

    def render(self, request):
        resp = SlydJsonResource.render(self, request)
        if resp is not None:
            return json.dumps(resp)
