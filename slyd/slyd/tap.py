'''
The module is used by the Twisted plugin system
(twisted.plugins.slyd_plugin) to register twistd command to manage
slyd server. The command can be used with 'twistd slyd'.
'''
from __future__ import absolute_import
from os import listdir, environ
from os.path import join, dirname, isfile, abspath
from twisted.python import usage
from twisted.web.resource import Resource
from twisted.web.static import File
from .resource import SlydJsonObjectResource
from .server import Site, debugLogFormatter

DEFAULT_PORT = 9001
DEFAULT_DOCROOT = abspath(join(dirname(dirname(__file__)), '..', 'portiaui', 'dist'))


class Options(usage.Options):
    optParameters = [
        ['port', 'p', DEFAULT_PORT, 'Port number to listen on.', int],
        ['docroot', 'd', DEFAULT_DOCROOT, 'Default doc root for static media.']
    ]


class Capabilities(SlydJsonObjectResource):

    isLeaf = True

    def __init__(self, spec_manager):
        self.spec_manager = spec_manager

    def render_GET(self, request):
        return {
            'capabilities': self.spec_manager.capabilities,
            'custom': self.spec_manager.customizations,
            'username': request.auth_info.get('username'),
        }


def configure_django(settings):
    import django
    environ.setdefault('DJANGO_SETTINGS_MODULE', settings['DJANGO_SETTINGS'])
    django.setup()


def create_root(config, settings_module):
    from scrapy.settings import Settings
    settings = Settings()
    settings.setmodule(settings_module)
    configure_django(settings)

    from .authmanager import AuthManager

    from slyd.splash.ferry import (FerryServerProtocol, FerryServerFactory,
                                   create_ferry_resource)
    from slyd.splash.proxy import ProxyResource

    root = Resource()
    static = Resource()
    docroot = config['docroot']
    if hasattr(docroot, 'encode'):
        docroot = docroot.encode('utf-8')
    for file_name in listdir(docroot):
        file_path = join(docroot, file_name)
        if isfile(file_path):
            static.putChild(file_name, File(file_path))
    static.putChild(b'main.html', File(join(docroot, b'index.html')))

    root.putChild(b'static', static)
    root.putChild(b'assets', File(join(docroot, b'assets')))
    root.putChild(b'fonts', File(join(docroot, b'assets', b'fonts')))
    root.putChild(b'', File(join(docroot, b'index.html')))

    # add websockets for communicating with splash
    factory = FerryServerFactory('ws://127.0.0.1:%d' % config['port'],
                                 assets=docroot)
    factory.protocol = FerryServerProtocol
    websocket = create_ferry_resource(factory)
    root.putChild(b'ws', websocket)

    root.putChild(b'proxy', ProxyResource())

    auth_manager = AuthManager(settings)
    return auth_manager.protectResource(root)


def makeService(config, settings_module=None):
    if settings_module is None:
        import slyd.settings as settings_module
    root = create_root(config, settings_module)
    site = Site(root, logFormatter=debugLogFormatter)
    return site
