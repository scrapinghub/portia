from slyd.jsonapi.schema import JsonApiSchema
from slyd.orm.models import (Project, Schema, Field, Extractor, Spider, Sample,
                             Item, Annotation)


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
                           '/{self.spider.id}/samples/{self.id}/items',
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


class ItemSchema(JsonApiSchema):
    class Meta:
        model = Item
        url = ('/api/projects/{self.sample.spider.project.id}/spiders'
               '/{self.sample.spider.id}/samples/{self.sample.id}/items'
               '/{self.id}')
        links = {
            'annotations': {
                'related': '/api/projects/{self.sample.spider.project.id}'
                           '/spiders/{self.sample.spider.id}/samples'
                           '/{self.sample.id}/annotations'
                           '?filter[parent]={self.id}',
            },
            'sample': {
                'related': '/api/projects/{self.sample.spider.project.id}'
                           '/spiders/{self.sample.spider.id}/samples'
                           '/{self.sample.id}',
            },
            'schema': {
                'related': '/api/projects/{self.sample.spider.project.id}'
                           '/schemas/{self.schema.id}',
            },
        }


class AnnotationSchema(JsonApiSchema):
    class Meta:
        model = Annotation
        url = ('/api/projects/{self.sample.spider.project.id}/spiders'
               '/{self.sample.spider.id}/samples/{self.sample.id}/annotations'
               '/{self.id}')
        links = {
            'field': {
                'related': '/api/projects'
                           '/{self.parent.sample.spider.project.id}/schemas'
                           '/{self.parent.schema.id}/fields/{self.field.id}',
            },
            'parent': {
                'related': '/api/projects'
                           '/{self.parent.sample.spider.project.id}/spiders'
                           '/{self.parent.sample.spider.id}/samples'
                           '/{self.parent.sample.id}/items/{self.parent.id}',
            },
        }
