"""
The module is used by the Twisted plugin system
(twisted.plugins.slyd_plugin) to register twistd command to manage
slyd server. The command can be used with 'twistd slyd'.
"""
from __future__ import absolute_import
from os import listdir
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


def create_root(config, settings_module):
    from scrapy.settings import Settings
    from .specmanager import SpecManager
    from .authmanager import AuthManager
    from .projectspec import create_project_resource
    from slyd.api import APIResource
    from slyd.bot import create_bot_resource
    from slyd.projects import create_projects_manager_resource

    from slyd.splash.ferry import (FerryServerProtocol, FerryServerFactory,
                                   create_ferry_resource)
    from slyd.splash.proxy import ProxyResource

    root = Resource()
    static = Resource()
    for file_name in listdir(config['docroot']):
        file_path = join(config['docroot'], file_name)
        if isfile(file_path):
            static.putChild(file_name, File(file_path))
    static.putChild('main.html', File(join(config['docroot'], 'index.html')))

    root.putChild('static', static)
    root.putChild('assets', File(join(config['docroot'], 'assets')))
    root.putChild('fonts', File(join(config['docroot'], 'assets', 'fonts')))
    root.putChild('', File(join(config['docroot'], 'index.html')))

    settings = Settings()
    settings.setmodule(settings_module)
    spec_manager = SpecManager(settings)

    # add server capabilities at /server_capabilities
    capabilities = Capabilities(spec_manager)
    root.putChild('server_capabilities', capabilities)

    # add projects manager at /projects
    projects = create_projects_manager_resource(spec_manager)
    root.putChild('projects', projects)

    # # add json api routes
    root.putChild('api', APIResource(spec_manager))

    # add crawler at /projects/PROJECT_ID/bot
    projects.putChild('bot', create_bot_resource(spec_manager))

    # add project spec at /projects/PROJECT_ID/spec
    spec = create_project_resource(spec_manager)
    projects.putChild('spec', spec)

    # add websockets for communicating with splash
    factory = FerryServerFactory("ws://127.0.0.1:%s" % config['port'],
                                 assets=config['docroot'])
    factory.protocol = FerryServerProtocol
    websocket = create_ferry_resource(spec_manager, factory)
    root.putChild("ws", websocket)

    root.putChild('proxy', ProxyResource())

    auth_manager = AuthManager(settings)
    return auth_manager.protectResource(root)


def makeService(config, settings_module=None):
    if settings_module is None:
        import slyd.settings as settings_module
    root = create_root(config, settings_module)
    site = Site(root, logFormatter=debugLogFormatter)
    return site
