from twisted.web.server import Site
from twisted.web.resource import Resource


class Root(Resource):

    def __init__(self):
        Resource.__init__(self)
        self.putChild("status", Status())

    def getChild(self, name, request):
        return self

    def render(self, request):
        return 'Slyd mock HTTP server\n'

# TODO: make PR for scrapy to share code
if __name__ == "__main__":
    root = Root()
    factory = Site(root)
    httpPort = reactor.listenTCP(8998, factory)

    def print_listening():
        httpHost = httpPort.getHost()
        print("Mock server running at http://%s:%d/" % (
            httpHost.host, httpHost.port))
    reactor.callWhenRunning(print_listening)
    reactor.run()