from operator import attrgetter

from slyd.jsonapi.schema import JsonApiSchema
from slyd.orm.base import AUTO_PK
from slyd.orm.exceptions import ProtectedError
from slyd.orm.models import (Project, Schema, Field, Extractor, Spider, Sample,
                             Item, Annotation)
from slyd.utils.projects import unique_name


def clear_auto_created(instance):
    if instance.auto_created:
        instance.auto_created = False
        instance.save(only=('auto_created',))


class ProjectSchema(JsonApiSchema):
    class Meta:
        model = Project
        url = '/api/projects/{self.id}'
        links = {
            'spiders': {
                'related': '/api/projects/{self.id}/spiders',
            },
            'schemas': {
                'related': '/api/projects/{self.id}/schemas',
            },
            'extractors': {
                'related': '/api/projects/{self.id}/extractors',
            },
        }


class SchemaSchema(JsonApiSchema):
    class Meta:
        model = Schema
        url = '/api/projects/{self.project.id}/schemas/{self.id}'
        links = {
            'project': {
                'related': '/api/projects/{self.project.id}',
            },
            'fields': {
                'related': '/api/projects/{self.project.id}/schemas'
                           '/{self.id}/fields',
            },
        }
        default_kwargs = {
            'include_data': [
                'fields',
            ],
            'exclude_map': {
                'schemas': [
                    'auto-created',
                    'items',
                ]
            }
        }

    def update(self, instance, validated_data):
        instance = super(SchemaSchema, self).update(instance, validated_data)
        clear_auto_created(instance)
        return instance


class FieldSchema(JsonApiSchema):
    class Meta:
        model = Field
        url = ('/api/projects/{self.schema.project.id}/schemas'
               '/{self.schema.id}/fields/{self.id}')
        links = {
            'schema': {
                'related': '/api/projects/{self.schema.project.id}/schemas'
                           '/{self.schema.id}',
            },
        }
        default_kwargs = {
            'exclude_map': {
                'fields': [
                    'auto-created',
                    'annotations',
                ]
            }
        }

    def create(self, validated_data):
        field = super(FieldSchema, self).create(validated_data)
        clear_auto_created(field.schema)
        return field

    def update(self, instance, validated_data):
        instance = super(FieldSchema, self).update(instance, validated_data)
        clear_auto_created(instance)
        clear_auto_created(instance.schema)
        return instance

    def delete(self):
        clear_auto_created(self.instance.schema)
        super(FieldSchema, self).delete()


class ExtractorSchema(JsonApiSchema):
    class Meta:
        model = Extractor
        url = '/api/projects/{self.project.id}/extractors/{self.id}'
        links = {
            'project': {
                'related': '/api/projects/{self.project.id}',
            },
        }
        default_kwargs = {
            'exclude_map': {
                'extractors': [
                    'annotations',
                ]
            }
        }


class SpiderSchema(JsonApiSchema):
    class Meta:
        model = Spider
        url = '/api/projects/{self.project.id}/spiders/{self.id}'
        links = {
            'project': {
                'related': '/api/projects/{self.project.id}',
            },
            'samples': {
                'related': '/api/projects/{self.project.id}/spiders/{self.id}'
                           '/samples',
            },
        }
        default_kwargs = {
            'exclude_map': {
                'spiders': [
                    'samples',
                ]
            }
        }

    def delete(self):
        project = self.instance.project
        project.schemas  # preload schemas and fields
        super(SpiderSchema, self).delete()


class SampleSchema(JsonApiSchema):
    class Meta:
        model = Sample
        url = ('/api/projects/{self.spider.project.id}/spiders'
               '/{self.spider.id}/samples/{self.id}')
        links = {
            'spider': {
                'related': '/api/projects/{self.spider.project.id}/spiders'
                           '/{self.spider.id}',
            },
            'items': {
                'related': '/api/projects/{self.spider.project.id}/spiders'
                           '/{self.spider.id}/samples/{self.id}/items'
                           '?filter[parent]=null',
            },
        }
        default_kwargs = {
            'exclude_map': {
                'samples': [
                    'page-id',
                    'page-type',
                    'original-body',
                    'annotated-body',
                ]
            }
        }

    def create(self, validated_data):
        sample = super(SampleSchema, self).create(validated_data)

        project = sample.spider.project
        schema_names = map(attrgetter('name'), project.schemas)
        schema_name = unique_name(sample.name, schema_names)
        schema = Schema(self.storage, id=AUTO_PK, name=schema_name,
                        project=project, auto_created=True)
        schema.save()

        item = Item(self.storage, id=AUTO_PK, sample=sample, schema=schema)
        item.save()

        return sample


class ItemSchema(JsonApiSchema):
    class Meta:
        model = Item
        url = ('/api/projects/{self.owner_sample.spider.project.id}/spiders'
               '/{self.owner_sample.spider.id}/samples/{self.owner_sample.id}'
               '/items/{self.id}')
        links = {
            'sample': {
                'related': '/api/projects/{self.sample.spider.project.id}'
                           '/spiders/{self.sample.spider.id}/samples'
                           '/{self.sample.id}',
            },
            'parent': {
                'related': '/api/projects/{self.owner_sample.spider.project.id}'
                           '/spiders/{self.owner_sample.spider.id}/samples'
                           '/{self.owner_sample.id}/items/{self.parent.id}',
            },
            'schema': {
                'related': '/api/projects/{self.owner_sample.spider.project.id}'
                           '/schemas/{self.schema.id}',
            },
            'annotations': {
                'related': '/api/projects/{self.owner_sample.spider.project.id}'
                           '/spiders/{self.owner_sample.spider.id}/samples'
                           '/{self.owner_sample.id}/annotations'
                           '?filter[parent]={self.id}',
            },
        }

    def create(self, validated_data):
        item = super(ItemSchema, self).create(validated_data)

        if item.schema is None:
            sample = item.owner_sample
            project = sample.spider.project
            schema_names = map(attrgetter('name'), project.schemas)
            schema_name = unique_name(sample.name, schema_names,
                                      initial_suffix=1)
            schema = Schema(self.storage, id=AUTO_PK, name=schema_name,
                            project=project, auto_created=True)
            schema.items.add(item)
            schema.save()

        if item.parent and item.name is None:
            sample = item.owner_sample
            item_names = map(attrgetter('name'), sample.ordered_items)
            item.name = unique_name('subitem', item_names, initial_suffix=1)
            item.save(only=('name',))

        return item

    def update(self, instance, validated_data):
        current_schema = instance.schema

        instance = super(ItemSchema, self).update(instance, validated_data)

        new_schema = instance.schema
        if new_schema != current_schema:
            field_map = {field.name: field for field in new_schema.fields}
            for annotation in instance.annotations:
                current_field = annotation.field
                if current_field.name in field_map:
                    new_field = field_map[current_field.name]
                    clear_auto_created(new_field)
                else:
                    new_field = Field(self.storage, id=AUTO_PK,
                                      name=current_field.name,
                                      type=current_field.type,
                                      schema=new_schema,
                                      auto_created=True)
                    field_map[new_field.name] = new_field
                    new_field.save()
                annotation.field = new_field
                annotation.save(only=('field',))
                if current_field.auto_created:
                    self.deleted.extend(current_field.delete())
            if current_schema.auto_created:
                self.deleted.extend(current_schema.delete())
            clear_auto_created(new_schema)

        return instance

    def delete(self):
        instance = self.instance
        sample = instance.owner_sample
        items = sample.items
        if len(items) == 1 and items[0] == instance:
            raise ProtectedError(
                u"Cannot delete item {} because it is the only item in the "
                u"sample {}".format(instance, sample))
        super(ItemSchema, self).delete()


class AnnotationSchema(JsonApiSchema):
    class Meta:
        model = Annotation
        url = ('/api/projects/{self.owner_sample.spider.project.id}/spiders'
               '/{self.owner_sample.spider.id}/samples/{self.owner_sample.id}'
               '/annotations/{self.id}')
        links = {
            'parent': {
                'related': '/api/projects'
                           '/{self.owner_sample.spider.project.id}/spiders'
                           '/{self.owner_sample.spider.id}/samples'
                           '/{self.owner_sample.id}/items/{self.parent.id}',
            },
            'field': {
                'related': '/api/projects'
                           '/{self.owner_sample.spider.project.id}/schemas'
                           '/{self.parent.schema.id}/fields/{self.field.id}',
            },
        }

    def create(self, validated_data):
        annotation = super(AnnotationSchema, self).create(validated_data)

        if annotation.field is None:
            project = annotation.owner_sample.spider.project
            project.schemas  # preload schemas and fields
            item = annotation.parent
            schema = item.schema
            field_names = map(attrgetter('name'), schema.fields)
            field_name = unique_name('field', field_names, initial_suffix=1)
            field = Field(self.storage, id=AUTO_PK, name=field_name,
                          schema=schema, auto_created=True)
            field.annotations.add(annotation)
            field.save()

        return annotation

    def update(self, instance, validated_data):
        current_field = instance.field

        instance = super(AnnotationSchema, self).update(
            instance, validated_data)

        new_field = instance.field
        if new_field != current_field:
            if current_field.auto_created:
                self.deleted.extend(current_field.delete())
            clear_auto_created(new_field)

        return instance
