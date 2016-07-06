from operator import attrgetter

from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import ItemSchema
from ..orm.base import AUTO_PK
from ..orm.exceptions import ProtectedError
from ..orm.models import Project, Schema, Field, Sample


class ItemRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    list_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                 '/{sample_id}/items')
    detail_path = ('projects/{project_id}/spiders/{spider_id}'
                   '/samples/{sample_id}/items/{item_id}')
    serializer_class = ItemSchema

    def perform_create(self, data):
        relationships = data.get('data', {}).get('relationships')
        if (relationships and 'schema' in relationships and
                relationships['schema'].get('data') is None):
            del relationships['schema']

        item = super(ItemRoute, self).perform_create(data)

        if item.schema is None:
            project = Project(self.storage, id=self.args.get('project_id'))
            sample = item.sample
            schema_names = set(map(attrgetter('name'), project.schemas))
            counter = 1
            while True:
                schema_name = u'{}{}'.format(sample.name, counter)
                if schema_name not in schema_names:
                    break
                counter += 1
            schema = Schema(self.storage, id=AUTO_PK, name=schema_name,
                            project=project, auto_created=True)
            schema.items.add(item)
            schema.save()

        return item

    def perform_update(self, instance, data, type_=None):
        if type_ is not None:
            return super(ItemRoute, self).perform_update(instance, data, type_)

        current_schema = instance.schema
        deleted = super(ItemRoute, self).perform_update(instance, data, type_)
        new_schema = instance.schema
        if new_schema != current_schema:
            field_map = {field.name: field for field in new_schema.fields}
            for annotation in instance.annotations:
                current_field = annotation.field
                if current_field.name in field_map:
                    new_field = field_map[current_field.name]
                    if new_field.auto_created:
                        new_field.auto_created = False
                        new_field.save(only=('auto_created',))
                else:
                    new_field = Field(self.storage, id=AUTO_PK,
                                      name=current_field.name,
                                      type=current_field.type,
                                      schema=new_schema,
                                      auto_created=True)
                    field_map[new_field.name] = new_field
                    new_field.save()
                annotation.field = new_field
                annotation.save(only=('field',))
                if current_field.auto_created:
                    deleted.extend(current_field.delete())
            if current_schema.auto_created:
                deleted.extend(current_schema.delete())
            if new_schema.auto_created:
                new_schema.auto_created = False
                new_schema.save(only=('auto_created',))
        return deleted

    def perform_destroy(self, instance):
        sample = instance.sample
        items = sample.items
        if len(items) == 1 and items[0] == instance:
            raise ProtectedError(
                u"Cannot delete item {} because it is the only item in "
                u"sample {}".format(instance, sample))
        return super(ItemRoute, self).perform_destroy(instance)

    def get_instance(self):
        return self.get_collection()[self.args.get('item_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return (project.spiders[self.args.get('spider_id')]
                       .samples[self.args.get('sample_id')]
                       .items)

    def deserialize_related_model(self, model, id_):
        if model is Sample:
            project = Project(self.storage, id=self.args.get('project_id'))
            return project.spiders[self.args.get('spider_id')].samples[id_]
        return super(ItemRoute, self).deserialize_related_model(model, id_)

    def get_detail_kwargs(self):
        return {
            'include_data': [
                'schema.fields',
                'annotations.field.schema.fields',
                'annotations.extractors',
            ],
        }
