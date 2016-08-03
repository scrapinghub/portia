from .projects import BaseProjectModelRoute
from portia_orm.models import Field


class FieldRoute(BaseProjectModelRoute):
    lookup_url_kwarg = 'field_id'
    default_model = Field

    def perform_create(self, serializer):
        self.project.schemas  # preload schemas
        super(FieldRoute, self).perform_create(serializer)

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('field_id')]

    def get_collection(self):
        return self.project.schemas[self.kwargs.get('schema_id')].fields
