from .route import JsonApiModelRoute
from .serializers import SampleSerializer
from portia_orm.utils import cached_property
from portia_orm.models import Project, Sample


class SampleRoute(JsonApiModelRoute):
    list_path = 'projects/{project_id}/spiders/{spider_id}/samples'
    detail_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                   '/{sample_id}')
    default_model = Sample

    @cached_property
    def project(self):
        return Project(self.storage, id=self.args.get('project_id'))

    def perform_create(self, serializer):
        self.project.spiders  # preload spiders
        super(SampleRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.args.get('sample_id')]

    def get_collection(self):
        project = self.project
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return project.spiders[self.args.get('spider_id')].samples

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
