from .projects import BaseProjectModelRoute
from ..jsonapi.utils import cached_property
from portia_orm.models import Item


class ItemRoute(BaseProjectModelRoute):
    lookup_url_kwarg = 'item_id'
    default_model = Item

    @cached_property
    def spider(self):
        return self.project.spiders[self.kwargs.get('spider_id')]

    def perform_create(self, serializer):
        self.spider.samples  # preload samples
        return super(ItemRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('item_id')]

    def get_collection(self):
        project = self.project
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return self.spider.samples[self.kwargs.get('sample_id')].ordered_items

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
