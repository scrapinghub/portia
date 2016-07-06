from operator import attrgetter

from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import SampleSchema
from ..orm.base import AUTO_PK
from ..orm.models import Project, Schema, Spider, Item


class SampleRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                  CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    list_path = 'projects/{project_id}/spiders/{spider_id}/samples'
    detail_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                   '/{sample_id}')
    serializer_class = SampleSchema

    def perform_create(self, data):
        project = Project(self.storage, id=self.args.get('project_id'))
        sample = super(SampleRoute, self).perform_create(data)

        schema_name = sample.name
        schema_names = set(map(attrgetter('name'), project.schemas))
        counter = 1
        while schema_name in schema_names:
            schema_name = u'{}{}'.format(sample.name, counter)
            counter += 1
        schema = Schema(self.storage, id=AUTO_PK, name=schema_name,
                        project=project, auto_created=True)
        schema.save()

        item = Item(self.storage, id=AUTO_PK, sample=sample, schema=schema)
        item.save()

        return sample

    def get_instance(self):
        return self.get_collection()[self.args.get('sample_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return project.spiders[self.args.get('spider_id')].samples

    def deserialize_related_model(self, model, id_):
        if model is Spider:
            project = Project(self.storage, id=self.args.get('project_id'))
            return project.spiders[id_]
        return super(SampleRoute, self).deserialize_related_model(model, id_)

    def get_detail_kwargs(self):
        return {
            'include_data': [
                'items.schema.fields',
                'items.annotations.field.schema.fields',
                'items.annotations.extractors',
            ],
        }

    def get_list_kwargs(self):
        excludes = SampleSchema.opts.default_kwargs['exclude_map']['samples']
        return {
            'exclude_map': {
                'samples': excludes + [
                    'items',
                ]
            }
        }
