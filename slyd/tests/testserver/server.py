import splash.server
import settings
import tempfile
import shutil
import os
import txaio
txaio.use_twisted()

test_server_path = os.path.dirname(os.path.abspath(__file__))
test_path = os.path.join(test_server_path, '..')
slyd_path = os.path.join(test_server_path, '../..')
domtest_path = os.path.join(test_path, 'domtest')


def test_resource_server():
    from twisted.internet import reactor
    from twisted.web.static import File
    from twisted.web.resource import Resource
    from twisted.web.server import Site
    root = Resource()
    root.putChild('testresources', File(domtest_path))
    factory = Site(root)
    reactor.listenTCP(8788, factory)

def make_server(*args, **kwargs):
    from twisted.internet import reactor
    from slyd.tap import makeService

    tempdir = os.path.join(tempfile.mkdtemp(), 'data')
    shutil.copytree(
        os.path.join(test_path, 'resources/fixtures/projects'),
        tempdir
    )

    settings.SPEC_FACTORY['PARAMS']['location'] = tempdir

    port = 8787
    splash.defaults.SPLASH_PORT = port
    site = makeService({
        'port': port,
        'docroot': os.path.join(slyd_path, 'dist')
    }, settings)
    site.resource
    reactor.listenTCP(port, site)
    test_resource_server()

if __name__ == '__main__':
    splash.server.main(server_factory=make_server, argv=[])
