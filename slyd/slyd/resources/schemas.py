from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import SchemaSchema
from ..orm.models import Project


class SchemaRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                  CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    list_path = 'projects/{project_id}/schemas'
    detail_path = 'projects/{project_id}/schemas/{schema_id}'
    serializer_class = SchemaSchema

    def perform_update(self, instance, data, type_=None):
        if type_ is not None:
            return super(SchemaRoute, self).perform_update(
                instance, data, type_)

        deleted = super(SchemaRoute, self).perform_update(instance, data, type_)
        if instance.auto_created:
            instance.auto_created = False
            instance.save(only=('auto_created',))
        return deleted

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
