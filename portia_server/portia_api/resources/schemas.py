from .projects import BaseProjectModelRoute
from portia_orm.models import Schema


class SchemaRoute(BaseProjectModelRoute):
    lookup_url_kwarg = 'schema_id'
    default_model = Schema

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('schema_id')]

    def get_collection(self):
        return self.project.schemas

    def get_list_kwargs(self):
        return {
            'fields_map': {
                'schemas': [
                    'name',
                    'project',
                ],
            }
        }
