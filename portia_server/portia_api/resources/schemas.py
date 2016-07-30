from .route import JsonApiModelRoute
from portia_orm.models import Project, Schema


class SchemaRoute(JsonApiModelRoute):
    lookup_url_kwarg = 'schema_id'
    default_model = Schema

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('schema_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.kwargs.get('project_id'))
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
