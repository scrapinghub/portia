from operator import attrgetter

from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import AnnotationSchema
from ..orm.base import AUTO_PK
from ..orm.models import Project, Field, Item


class AnnotationRoute(JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                      CreateModelMixin, UpdateModelMixin, DestroyModelMixin):
    list_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                 '/{sample_id}/annotations')
    detail_path = ('projects/{project_id}/spiders/{spider_id}/samples'
                   '/{sample_id}/annotations/{annotation_id}')
    serializer_class = AnnotationSchema

    def perform_create(self, data):
        relationships = data.get('data', {}).get('relationships')
        if (relationships and 'field' in relationships and
                relationships['field'].get('data') is None):
            del relationships['field']

        annotation = super(AnnotationRoute, self).perform_create(data)

        if annotation.field is None:
            project = Project(self.storage, id=self.args.get('project_id'))
            project.schemas  # preload schemas and fields
            item = annotation.parent
            schema = item.schema
            field_names = set(map(attrgetter('name'), schema.fields))
            counter = 1
            while True:
                field_name = u'field{}'.format(counter)
                if field_name not in field_names:
                    break
                counter += 1
            field = Field(self.storage, id=AUTO_PK, name=field_name,
                          schema=schema, auto_created=True)
            field.annotations.add(annotation)
            field.save()

        return annotation

    def perform_update(self, instance, data, type_=None):
        if type_ is not None:
            return super(AnnotationRoute, self).perform_update(
                instance, data, type_)

        current_field = instance.field
        deleted = super(AnnotationRoute, self).perform_update(
            instance, data, type_)
        new_field = instance.field
        if new_field != current_field:
            if current_field.auto_created:
                deleted.extend(current_field.delete())
            if new_field.auto_created:
                new_field.auto_created = False
                new_field.save(only=('auto_created',))
        return deleted

    def get_instance(self):
        return self.get_collection()[self.args.get('annotation_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        project.schemas  # preload schemas and fields
        project.extractors  # preload extractors
        return (project.spiders[self.args.get('spider_id')]
                       .samples[self.args.get('sample_id')]
                       .ordered_annotations)

    def deserialize_related_model(self, model, id_):
        if model is Item:
            project = Project(self.storage, id=self.args.get('project_id'))
            return (project.spiders[self.args.get('spider_id')]
                           .samples[self.args.get('sample_id')]
                           .items[id_])
        return super(AnnotationRoute, self).deserialize_related_model(
            model, id_)

    def get_detail_kwargs(self):
        return {
            'include_data': [
                'field.schema.fields',
                'extractors',
            ],
        }
