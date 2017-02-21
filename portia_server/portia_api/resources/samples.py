from .projects import BaseProjectModelRoute
from .serializers import SampleSerializer
from portia_orm.models import Sample


class SampleRoute(BaseProjectModelRoute):
    lookup_url_kwarg = 'sample_id'
    default_model = Sample

    def perform_create(self, serializer):
        self.project.spiders  # preload spiders
        super(SampleRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('sample_id')]

    def get_collection(self):
        project = self.project
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        spider = project.spiders[self.kwargs.get('spider_id')]
        for sample in spider.samples:
            sample = sample.load(sample.storage, sample)
            sample.url
            spider.samples.add(sample)
        return spider.samples

    def get_detail_kwargs(self):
        return {
            'include_data': [
                'items',
            ],
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

    def get_list_kwargs(self):
        excludes = (SampleSerializer.opts
                                    .default_kwargs['exclude_map']['samples'])
        return {
            'exclude_map': {
                'samples': excludes + [
                    'items',
                ]
            }
        }
