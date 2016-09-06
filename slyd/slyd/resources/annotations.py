from .route import JsonApiModelRoute
from portia_orm.utils import cached_property
from portia_orm.models import Project, BaseAnnotation, Annotation


class AnnotationRoute(JsonApiModelRoute):
    list_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                 '/{sample_id}/annotations')
    detail_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                   '/{sample_id}/annotations/{annotation_id}')
    default_model = Annotation
    polymorphic = BaseAnnotation

    @cached_property
    def project(self):
        return Project(self.storage, id=self.args.get('project_id'))

    @cached_property
    def sample(self):
        return (self.project.spiders[self.args.get('spider_id')]
                            .samples[self.args.get('sample_id')])

    def perform_create(self, serializer):
        self.sample.ordered_children  # preload items and annotations
        return super(AnnotationRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.args.get('annotation_id')]

    def get_collection(self):
        project = self.project
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return self.sample.ordered_children

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
