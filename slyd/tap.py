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

DEFAULT_PORT = 9001
DEFAULT_DOCROOT = join(dirname(dirname(__file__)), 'media')


class Options(usage.Options):
    optParameters = [
        ['port', 'p', DEFAULT_PORT, 'Port number to listen on.'],
        ['docroot', 'd', DEFAULT_DOCROOT, 'Default doc root for static media.'],
    ]


def create_root(config):
    from scrapy import log
    from scrapy.settings import CrawlerSettings
    from slyd.crawlerspec import (CrawlerSpecManager,
        create_crawler_spec_resource)
    from slyd.bot import create_bot_resource
    import slyd.settings
    from slyd.project import Project

    root = Resource()
    root.putChild("static", File(config['docroot']))

    # api/PROJECTID/child
    project = Project()
    root.putChild('api', project)

    # add crawler at api/PROJECT/bot
    crawler_settings = CrawlerSettings(settings_module=slyd.settings)
    spec_manager = CrawlerSpecManager(crawler_settings)
    log.msg("Slybot specs loading from %s/[PROJECT]" % spec_manager.basedir,
        level=log.DEBUG)
    project.putChild("bot", create_bot_resource(spec_manager))

    # spec at api/PROJECT/spec
    spec = create_crawler_spec_resource(spec_manager)
    project.putChild("spec", spec)
    return root


def makeService(config):
    root = create_root(config)
    site = Site(root)
    return TCPServer(config['port'], site)
