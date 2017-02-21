from marshmallow_jsonapi.fields import Relationship as BaseRelationship

from portia_api.jsonapi.registry import get_schema
from portia_api.jsonapi.utils import (
    TOP_LEVEL_OBJECT_ORDER, LINKS_OBJECT_ORDER, type_from_model_name,
    order_dict, cached_property, cached_property_ignore_set)


class Relationship(BaseRelationship):
    def __init__(self, **kwargs):
        self._serializer = kwargs.get('serializer')
        super(Relationship, self).__init__(**kwargs)

    @cached_property
    def schema(self):
        schema = self._serializer or get_schema(self.type_)
        return schema(fields_map=self.root.fields_map,
                      exclude_map=self.root.exclude_map,
                      include_data=self.root.include_map.get(self.name, []),
                      include_data_map=self.root.include_data_map)

    @cached_property_ignore_set
    def include_resource_linkage(self):
        return self.name in self.root.relationship_set

    def get_related_url(self, obj):
        if self.related_url:
            try:
                return self.related_url.format(self=obj)
            except AttributeError:
                pass
        return None

    def get_self_url(self, obj):
        if self.self_url:
            try:
                return self.self_url.format(self=obj)
            except AttributeError:
                pass
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


class PolymorphicRelationship(Relationship):
    def __init__(self, **kwargs):
        super(PolymorphicRelationship, self).__init__(**kwargs)

    def _serialize(self, value, attr, obj):
        if not self.many:
            value = [value]

        links = None
        result = []
        if value:
            for instance in value:
                field = Relationship(
                    type_=type_from_model_name(instance.__class__.__name__),
                    id_field='pk',
                    self_url=self.self_url,
                    related_url=self.related_url,
                    many=False)
                field._add_to_schema(self.name, self.parent)
                field.include_data = self.include_data
                data = field._serialize(instance, attr, obj)
                if links is None and 'links' in data:
                    links = data['links']
                result.append(data.get('data'))
        else:
            data = super(PolymorphicRelationship, self)._serialize(
                None, attr, obj)
            if links is None and 'links' in data:
                links = data['links']

        if not self.many:
            result = result[0]
        data = {}
        if links is not None:
            data['links'] = order_dict(links, LINKS_OBJECT_ORDER)
        if self.include_resource_linkage or self.include_data:
            data['data'] = result
        return order_dict(data, TOP_LEVEL_OBJECT_ORDER)

    def _deserialize(self, value, attr, data):
        return value
