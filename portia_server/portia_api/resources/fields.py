from portia_orm.models import Field

from .projects import BaseProjectModelRoute
from ..jsonapi.exceptions import JsonApiBadRequestError


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

    def destroy(self, *args, **kwargs):
        annotation_count = self._annotation_count
        if annotation_count > 0:
            raise JsonApiBadRequestError(self._destroy_error(annotation_count))
        return super(FieldRoute, self).destroy(*args, **kwargs)

    def _destroy_error(self, annotation_count):
        field = self.get_instance()
        annotation = 'annotation' if annotation_count == 1 else 'annotations'
        return ('Unable to delete the field "{}" as it has {} {}.'
                .format(field.name, annotation_count, annotation))

    @property
    def _annotation_count(self):
        self._load_annotations()
        return len(self.get_instance().annotations)

    def _load_annotations(self):
        for spider in self.project.spiders:
            for sample in spider.samples:
                sample.annotations
