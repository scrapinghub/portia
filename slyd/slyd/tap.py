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
from slyd.resource import SlydJsonObjectResource
#from txkeystoneauth.shield import ResourceShield, ServiceRoot
from .dashauth import ResourceShield, ServiceRoot

DEFAULT_PORT = 9001
DEFAULT_DOCROOT = join(dirname(dirname(__file__)), 'media')


class Options(usage.Options):
    optParameters = [
        ['port', 'p', DEFAULT_PORT, 'Port number to listen on.', int],
        ['docroot', 'd', DEFAULT_DOCROOT, 'Default doc root for static media.'],
    ]
    optFlags = [
        ['use_git', 'g', 'Use git storage instead of plain json files.']
    ]


class Capabilities(SlydJsonObjectResource):
    isLeaf = True
    version_control = False

    def render_GET(self, request):
        return { 'version_control': self.version_control }


def create_root(config):
    from scrapy import log
    from scrapy.settings import Settings
    from slyd.crawlerspec import (CrawlerSpecManager,
        create_crawler_spec_resource)
    from slyd.bot import create_bot_resource
    import slyd.settings
    from slyd.projects import ProjectsResource

    shield = ResourceShield()
    root = ServiceRoot('portia')
    root.putChild("static", File(config['docroot']))

    use_git = config['use_git']

    # add server capabilities at /server_capabilities
    capabilities = Capabilities()
    capabilities.version_control = bool(use_git)
    root.putChild('server_capabilities', capabilities)

    crawler_settings = Settings()
    crawler_settings.setmodule(slyd.settings)
    spec_manager = CrawlerSpecManager(crawler_settings, use_git)

    # add project management at /projects
    projects = ProjectsResource(crawler_settings, use_git)    
    root.putChild('projects', projects)

    # add crawler at /projects/PROJECT_ID/bot
    log.msg("Slybot specs loading from %s/[PROJECT]" % spec_manager.basedir,
        level=log.DEBUG)
    projects.putChild("bot", create_bot_resource(spec_manager))

    # add spec at /projects/PROJECT_ID/spec
    spec = create_crawler_spec_resource(spec_manager)
    projects.putChild("spec", spec)
    #return root
    return shield.protectResource(root)


def makeService(config):
    root = create_root(config)
    site = Site(root)
    return TCPServer(config['port'], site)
