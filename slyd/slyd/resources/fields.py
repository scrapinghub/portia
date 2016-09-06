from .route import JsonApiModelRoute
from portia_orm.utils import cached_property
from portia_orm.models import Project, Field


class FieldRoute(JsonApiModelRoute):
    list_path = 'projects/{project_id}/schemas/{schema_id}/fields'
    detail_path = 'projects/{project_id}/schemas/{schema_id}/fields/{field_id}'
    default_model = Field

    @cached_property
    def project(self):
        return Project(self.storage, id=self.args.get('project_id'))

    def perform_create(self, serializer):
        self.project.schemas  # preload schemas
        super(FieldRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.args.get('field_id')]

    def get_collection(self):
        return self.project.schemas[self.args.get('schema_id')].fields
