from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor
from twisted.web.static import File

import cgi
import json
import uuid

database = {'annotations': {},
            'items': {},
            'item-fields': {},
            'field-mappings': {},}


class Renderer(Resource):
    
    def __init__(self, s_model_name, p_model_name,
                 related_models=[], isLeaf=False, object_id=''):
        Resource.__init__(self)
        self.s_model_name = s_model_name
        self.p_model_name = p_model_name
        self.related_models = related_models
        self.isLeaf = isLeaf
        self.id = object_id

    def render_GET(self, request):
        related = ['"%s": %s' % (model_name, self.serialize(database[model_name].values())) for
            model_name in self.related_models]
        related = related and ', %s' % ','.join(related) or ''
        if self.id:
            return '{"%s": %s %s}' % (self.s_model_name,
                                      self.serialize(database[self.p_model_name][self.id]),
                                      related)
        else:
            return '{"%s": %s %s}' % (self.p_model_name,
                                      self.serialize(database[self.p_model_name].values()),
                                      related)

    def render_POST(self, request):
        new_object = self.parse(request.content.read())[self.s_model_name]
        new_object['id'] = uuid.uuid1().hex
        new_object['name'] = '%s %s' % (self.s_model_name, new_object['id'][:5])
        database[self.p_model_name][new_object['id']] = new_object
        return '{"%s": %s}' % (self.s_model_name,
                               self.serialize(new_object))

    def render_PUT(self, request):
        updated_object = self.parse(request.content.read())[self.s_model_name]
        old_object = database[self.p_model_name][self.id]
        old_object.update(updated_object)
        return '{"%s": %s}' % (self.s_model_name, json.dumps(old_object))
    
    def render_DELETE(self, request):
        del database[self.p_model_name][self.id]
        return ''

    def serialize(self, json_object):
        return json.dumps(json_object)

    def parse(self, str_object):
        return json.loads(str_object)
    
    def getChild(self, name, request):
        return Renderer(self.s_model_name, self.p_model_name, self.related_models,
                        True, name)


root = Resource()
annotation_renderer = Renderer('annotation', 'annotations',
    ['field-mappings', 'item-fields', 'items'])
item_renderer = Renderer('item', 'items', ['item-fields'])
item_field_renderer = Renderer('item-field', 'item-fields')
field_mapping_renderer = Renderer('field-mapping', 'field-mappings')

root.putChild("static", File("."))
root.putChild("annotations", annotation_renderer)
root.putChild("items", item_renderer)
root.putChild("item-fields", item_field_renderer)
root.putChild("field-mappings", field_mapping_renderer)

factory = Site(root)
reactor.listenTCP(9001, factory)
reactor.run()