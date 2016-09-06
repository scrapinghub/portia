from .route import JsonApiModelRoute
from portia_orm.utils import cached_property
from portia_orm.models import Project, Item


class ItemRoute(JsonApiModelRoute):
    list_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                 '/{sample_id}/items')
    detail_path = ('projects/{project_id}/spiders/{spider_id}'
                   '/samples/{sample_id}/items/{item_id}')
    default_model = Item

    @cached_property
    def project(self):
        return Project(self.storage, id=self.args.get('project_id'))

    @cached_property
    def spider(self):
        return self.project.spiders[self.args.get('spider_id')]

    def perform_create(self, serializer):
        self.spider.samples  # preload samples
        return super(ItemRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.args.get('item_id')]

    def get_collection(self):
        project = self.project
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return self.spider.samples[self.args.get('sample_id')].ordered_items

    def get_detail_kwargs(self):
        return {
            'include_data_map': {
                'items': [
                    'schema.fields',
                    'annotations',
                ],
                'annotations': [
                    'field.schema.fields',
                    'extractors',
                ],
            },
        }
