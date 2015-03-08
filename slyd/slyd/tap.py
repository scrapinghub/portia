"""
The module is used by the Twisted plugin system
(twisted.plugins.slyd_plugin) to register twistd command to manage
slyd server. The command can be used with 'twistd slyd'.
"""
from os import listdir
from os.path import join, dirname, isfile
from twisted.python import usage
from twisted.web.resource import Resource
from twisted.application.internet import TCPServer
from twisted.web.server import Site
from twisted.web.static import File
from .resource import SlydJsonObjectResource

DEFAULT_PORT = 9001
DEFAULT_DOCROOT = join(dirname(dirname(__file__)), 'dist')


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
        return self.spec_manager.capabilities


def create_root(config):
    from scrapy import log
    from scrapy.settings import Settings
    from .specmanager import SpecManager
    from .authmanager import AuthManager
    from .projectspec import create_project_resource
    from slyd.bot import create_bot_resource
    from slyd.projects import create_projects_manager_resource

    import slyd.settings

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

    settings = Settings()
    settings.setmodule(slyd.settings)
    spec_manager = SpecManager(settings)

    # add server capabilities at /server_capabilities
    capabilities = Capabilities(spec_manager)
    root.putChild('server_capabilities', capabilities)

    # add projects manager at /projects
    projects = create_projects_manager_resource(spec_manager)
    root.putChild('projects', projects)

    # add crawler at /projects/PROJECT_ID/bot
    projects.putChild('bot', create_bot_resource(spec_manager))

    # add project spec at /projects/PROJECT_ID/spec
    spec = create_project_resource(spec_manager)
    projects.putChild('spec', spec)

    auth_manager = AuthManager(settings)
    return auth_manager.protectResource(root)


def makeService(config):
    root = create_root(config)
    site = Site(root)
    return TCPServer(config['port'], site)
