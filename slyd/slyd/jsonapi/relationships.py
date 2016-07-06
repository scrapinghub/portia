from django.utils.functional import cached_property
from marshmallow_jsonapi.fields import Relationship as BaseRelationship

from slyd.jsonapi.registry import get_schema
from slyd.jsonapi.utils import (TOP_LEVEL_OBJECT_ORDER, LINKS_OBJECT_ORDER,
                                order_dict, cached_property_ignore_set)


class Relationship(BaseRelationship):
    @cached_property
    def schema(self):
        schema = get_schema(self.type_)
        return schema(fields_map=self.root.fields_map,
                      exclude_map=self.root.exclude_map,
                      include_data=self.root.include_map.get(self.name, []))

    @cached_property_ignore_set
    def include_resource_linkage(self):
        return self.name in self.root.relationship_set

    def get_related_url(self, obj):
        if self.related_url:
            return self.related_url.format(self=obj)
        return None

    def get_self_url(self, obj):
        if self.self_url:
            return self.self_url.format(self=obj)
        return None

    def get_resource_linkage(self, value):
        data = super(Relationship, self).get_resource_linkage(value)
        if self.many:
            return [order_dict(item, TOP_LEVEL_OBJECT_ORDER) for item in data]
        return order_dict(data, TOP_LEVEL_OBJECT_ORDER)

    def _serialize(self, value, attr, obj):
        data = super(Relationship, self)._serialize(value, attr, obj)
        if 'links' in data:
            data['links'] = order_dict(data['links'], LINKS_OBJECT_ORDER)
        return order_dict(data, TOP_LEVEL_OBJECT_ORDER)


