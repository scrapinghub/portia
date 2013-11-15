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
    from slyd.renderer import Renderer
    from slyd.bot import create_bot_resource

    root = Resource()
    annotation_renderer = Renderer('annotation', 'annotations',
        ['field-mappings', 'item-fields', 'items'])
    item_renderer = Renderer('item', 'items', ['item-fields'])
    item_field_renderer = Renderer('item-field', 'item-fields')
    field_mapping_renderer = Renderer('field-mapping', 'field-mappings')

    root.putChild("static", File(config['docroot']))
    root.putChild("annotations", annotation_renderer)
    root.putChild("items", item_renderer)
    root.putChild("item-fields", item_field_renderer)
    root.putChild("field-mappings", field_mapping_renderer)
    root.putChild("bot", create_bot_resource())
    return root


def makeService(config):
    root = create_root(config)
    site = Site(root)
    return TCPServer(config['port'], site)
