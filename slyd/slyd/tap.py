"""
The module is used by the Twisted plugin system
(twisted.plugins.slyd_plugin) to register twistd command to manage
slyd server. The command can be used with 'twistd slyd'.
"""
from os.path import join, dirname
from twisted.python import usage
from twisted.web.resource import Resource
from twisted.application.internet import TCPServer
from twisted.web.server import Site
from twisted.web.static import File
from .resource import SlydJsonObjectResource

DEFAULT_PORT = 9001
DEFAULT_DOCROOT = join(dirname(dirname(__file__)), 'media')


class Options(usage.Options):
    optParameters = [
        ['port', 'p', DEFAULT_PORT, 'Port number to listen on.', int],
        ['docroot', 'd', DEFAULT_DOCROOT, 'Default doc root for static media.'],
    ]


class Capabilities(SlydJsonObjectResource):
    
    isLeaf = True

    def __init__(self, config_manager):
        self.config_manager = config_manager

    def render_GET(self, request):
        return {
            'version_control': self.config_manager.supports_version_control,
        }


def create_root(config):
    from scrapy import log
    from scrapy.settings import Settings 
    from .configmanager import ConfigManager
    from .projectspec import create_project_resource
    from slyd.bot import create_bot_resource
    from slyd.projects import create_projects_manager_resource

    import slyd.settings

    root = Resource()
    root.putChild("static", File(config['docroot']))

    settings = Settings()
    settings.setmodule(slyd.settings)
    config_manager = ConfigManager(settings)

    # add server capabilities at /server_capabilities
    capabilities = Capabilities(config_manager)
    root.putChild('server_capabilities', capabilities)

    # add projects manager at /projects
    projects = create_projects_manager_resource(config_manager)
    root.putChild('projects', projects)

    # add crawler at /projects/PROJECT_ID/bot
    projects.putChild("bot", create_bot_resource(config_manager))

    # add project spec at /projects/PROJECT_ID/spec
    spec = create_project_resource(config_manager)
    projects.putChild("spec", spec)
    return config_manager.resource_protector(root, 'portia')


def makeService(config):
    root = create_root(config)
    site = Site(root)
    return TCPServer(config['port'], site)
