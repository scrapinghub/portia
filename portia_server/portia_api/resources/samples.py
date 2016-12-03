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
        samples = project.spiders[self.kwargs.get('spider_id')].samples
        for sample in samples:
            samples.add(sample.load(sample.storage, sample))
        return samples

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
