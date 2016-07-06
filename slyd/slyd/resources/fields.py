from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import FieldSchema
from ..orm.models import Project, Schema


class FieldRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                 CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    list_path = 'projects/{project_id}/schemas/{schema_id}/fields'
    detail_path = 'projects/{project_id}/schemas/{schema_id}/fields/{field_id}'
    serializer_class = FieldSchema

    def perform_create(self, data):
        instance = super(FieldRoute, self).perform_create(data)
        self.clear_auto_created(instance.schema)
        return instance

    def perform_update(self, instance, data, type_=None):
        if type_ is not None:
            return super(FieldRoute, self).perform_update(instance, data, type_)

        deleted = super(FieldRoute, self).perform_update(instance, data, type_)
        self.clear_auto_created(instance)
        self.clear_auto_created(instance.schema)
        return deleted

    def perform_destroy(self, instance):
        self.clear_auto_created(instance.schema)
        return super(FieldRoute, self).perform_destroy(instance)

    def get_instance(self):
        return self.get_collection()[self.args.get('field_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        return project.schemas[self.args.get('schema_id')].fields

    def deserialize_related_model(self, model, id_):
        if model is Schema:
            project = Project(self.storage, id=self.args.get('project_id'))
            return project.schemas[id_]
        return super(FieldRoute, self).deserialize_related_model(model, id_)

    @staticmethod
    def clear_auto_created(instance):
        if instance.auto_created:
            instance.auto_created = False
            instance.save(only=('auto_created',))
