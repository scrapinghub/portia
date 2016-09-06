from .route import JsonApiModelRoute
from portia_orm.models import Project, Schema


class SchemaRoute(JsonApiModelRoute):
    list_path = 'projects/{project_id}/schemas'
    detail_path = 'projects/{project_id}/schemas/{schema_id}'
    default_model = Schema

    def get_instance(self):
        return self.get_collection()[self.args.get('schema_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        return project.schemas

    def get_list_kwargs(self):
        return {
            'fields_map': {
                'schemas': [
                    'name',
                    'project',
                ],
            }
        }
