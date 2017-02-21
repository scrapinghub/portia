import mock

from .utils import DataStoreTestCase, mock_storage
from ..exceptions import ValidationError
from ..models import (
    Project, Schema, Field, Extractor, Spider, Sample, BaseAnnotation, Item,
    Annotation, SLYBOT_VERSION)


class ProjectTestCase(DataStoreTestCase):
    def setUp(self):
        super(ProjectTestCase, self).setUp()
        self.storage = mock_storage(self.get_storage_files())

    def get_storage_files(self):
        return {
            'project.json':
                '{'
                '    "id": "example",'
                '    "name": "example"'
                '}',
            'items.json':
                '{'
                '    "1664-4f20-b657": {'
                '        "auto_created": true,'
                '        "fields": {'
                '            "fbec-4a42-a4b0": {'
                '                "auto_created": true,'
                '                "id": "fbec-4a42-a4b0",'
                '                "name": "title",'
                '                "required": true,'
                '                "type": "text",'
                '                "vary": false'
                '            },'
                '            "cca5-490c-b604": {'
                '                "id": "cca5-490c-b604",'
                '                "name": "price",'
                '                "required": true,'
                '                "type": "price",'
                '                "vary": false'
                '            },'
                '            "34bc-406f-80bc": {'
                '                "id": "34bc-406f-80bc",'
                '                "name": "image",'
                '                "required": false,'
                '                "type": "image",'
                '                "vary": false'
                '            },'
                '            "ecfc-4dbe-b488": {'
                '                "id": "ecfc-4dbe-b488",'
                '                "name": "details",'
                '                "required": false,'
                '                "type": "text",'
                '                "vary": false'
                '            }'
                '        },'
                '        "name": "product"'
                '    },'
                '    "fa87-4791-8642": {'
                '        "fields": {},'
                '        "name": "other"'
                '    }'
                '}',
            'extractors.json':
                '{'
                '    "e6fc-4758-9e6b": {'
                '        "id": "e6fc-4758-9e6b",'
                '        "regular_expression": "\\\\$(\\\\d+(?:\\\\.\\\\d{2}))"'
                '    },'
                '    "154f-45ce-bfbd": {'
                '        "id": "154f-45ce-bfbd",'
                '        "type_extractor": "number"'
                '    }'
                '}',
            'spiders/shop-crawler.json':
                '{'
                '    "allowed_domains": [],'
                '    "exclude_patterns": [],'
                '    "follow_patterns": [],'
                '    "id": "shop-crawler",'
                '    "init_requests": ['
                '        {'
                '            "type": "login",'
                '            "loginurl": "http://shop.example.com/login",'
                '            "username": "user",'
                '            "password": "pass"'
                '        }'
                '    ],'
                '    "js_disable_patterns": [],'
                '    "js_enable_patterns": [],'
                '    "js_enabled": false,'
                '    "links_to_follow": "all",'
                '    "name": "shop-crawler",'
                '    "project": "example",'
                '    "respect_nofollow": true,'
                '    "start_urls": [\n'
                '        {\n'
                '            "url": "http://example.com/", \n'
                '            "type": "url"\n'
                '        }\n'
                '    ], \n'
                '    "template_names": ['
                '        "1ddc-4043-ac4d"'
                '    ]'
                '}',
            'spiders/shop-crawler/1ddc-4043-ac4d.json':
                '{'
                '    "id": "1ddc-4043-ac4d",'
                '    "name": "example",'
                '    "url": "http://example.com",'
                '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67",'
                '    "page_type": "item",'
                '    "spider": "shop-crawler",'
                '    "scrapes": "1664-4f20-b657",'
                '    "plugins": {'
                '        "annotations-plugin": {'
                '            "extracts": ['
                '                {'
                '                    "id": "1e47-4833-a4d4",'
                '                    "container_id": "1e47-4833-a4d4#parent",'
                '                    "schema_id": "1664-4f20-b657",'
                '                    "item_container": true,'
                '                    "selector": ".main",'
                '                    "repeated": true,'
                '                    "siblings": 0,'
                '                    "required": [],'
                '                    "tagid": 18,'
                '                    "text-content": "#portia-content",'
                '                    "annotations": {'
                '                        "#portia-content": "#dummy"'
                '                    }'
                '                },'
                '                {'
                '                    "id": "1e47-4833-a4d4#parent",'
                '                    "container_id": null,'
                '                    "schema_id": "1664-4f20-b657",'
                '                    "item_container": true,'
                '                    "selector": "body",'
                '                    "repeated": false,'
                '                    "siblings": 0,'
                '                    "required": [],'
                '                    "tagid": 18,'
                '                    "text-content": "#portia-content",'
                '                    "annotations": {'
                '                        "#portia-content": "#dummy"'
                '                    }'
                '                },'
                '                {'
                '                    "id": "3606-4d68-a6a0",'
                '                    "container_id": "1e47-4833-a4d4",'
                '                    "selection_mode": "auto",'
                '                    "selector": ".main > h1",'
                '                    "accept_selectors": ['
                '                        ".main:nth-child(1) > h1",'
                '                        ".main:nth-child(2) > h1"'
                '                    ],'
                '                    "reject_selectors": [],'
                '                    "data": {'
                '                        "d1e2-4673-a72a": {'
                '                            "field": "fbec-4a42-a4b0",'
                '                            "attribute": "content",'
                '                            "required": false,'
                '                            "extractors": {}'
                '                        }'
                '                    },'
                '                    "pre_text": null,'
                '                    "post_text": null,'
                '                    "tagid": null,'
                '                    "required": []'
                '                },'
                '                {'
                '                    "id": "5c18-40cf-8809",'
                '                    "container_id": "1e47-4833-a4d4",'
                '                    "selection_mode": "auto",'
                '                    "selector": ".main > img",'
                '                    "accept_selectors": ['
                '                        ".main:nth-child(1) > img"'
                '                    ],'
                '                    "reject_selectors": [],'
                '                    "data": {'
                '                        "de35-49b5-b90b": {'
                '                            "field": "34bc-406f-80bc",'
                '                            "attribute": "content",'
                '                            "required": false,'
                '                            "extractors": ['
                '                                "e6fc-4758-9e6b",'
                '                                "154f-45ce-bfbd"'
                '                            ]'
                '                        }'
                '                    },'
                '                    "pre_text": null,'
                '                    "post_text": null,'
                '                    "tagid": null,'
                '                    "required": []'
                '                }'
                '            ]'
                '        }'
                '    },'
                '    "version": "' + SLYBOT_VERSION + '"'
                '}',
            'spiders/shop-crawler/1ddc-4043-ac4d/original_body.html': (
                '<html></html>'),
            'spiders/shop-crawler/1ddc-4043-ac4d/rendered_body.html': (
                '<html></html>'),
        }


class ProjectTests(ProjectTestCase):
    def test_project(self):
        project = Project(id='project-1')
        self.assertEqual(project.dump(), {
            'id': 'project-1',
        })

    def test_load(self):
        project = Project(self.storage, id='example', name='example')
        self.assertEqual(project.dump(), {
            'id': 'example',
            'name': 'example',
        })
        self.storage.open.assert_not_called()

    def test_save(self):
        project = Project(self.storage, id='example')
        project.save()

        self.storage.open.assert_called_once_with('project.json')
        self.storage.save.assert_not_called()

        project.name = 'test'
        project.save()

        self.storage.open.assert_called_once_with('project.json')
        self.storage.save.assert_called_once_with('project.json', mock.ANY)
        self.assertEqual(
            self.storage.files['project.json'],
            '{\n'
            '    "id": "example", \n'
            '    "name": "test"\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        project.delete()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('extractors.json', mock.ANY)], any_order=True)
        self.assertEqual(self.storage.delete.call_count, 3)
        self.storage.delete.assert_has_calls([
            mock.call('project.json'),
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])


class SchemaTests(ProjectTestCase):
    def test_no_fields(self):
        schema = Schema(id='schema-1', name='default', auto_created=True)

        self.assertEqual(len(schema.fields), 0)
        self.assertEqual(schema.dump(), {
            'schema-1': {
                'name': 'default',
                'fields': {},
                'auto_created': True,
            },
        })

    def test_fields(self):
        schema = Schema(id='schema-1', name='default')
        Field(id='field-1', name='name', schema=schema)
        Field(id='field-2', name='url', type='url', schema=schema)

        self.assertEqual(schema.dump(), {
            'schema-1': {
                'name': 'default',
                'fields': {
                    'field-1': {
                        'id': 'field-1',
                        'name': 'name',
                        'type': 'text',
                        'required': False,
                        'vary': False,
                    },
                    'field-2': {
                        'id': 'field-2',
                        'name': 'url',
                        'type': 'url',
                        'required': False,
                        'vary': False,
                    },
                },
            },
        })

    def test_collection(self):
        schemas = Schema.collection([
            Schema(id='schema-1', name='default', fields=[
                Field(id='field-1', name='name'),
            ]),
            Schema(id='schema-2', name='other', fields=[
                Field(id='field-2', name='xxx'),
            ]),
        ])

        self.assertEqual(schemas.dump(), {
            'schema-1': {
                'name': 'default',
                'fields': {
                    'field-1': {
                        'id': 'field-1',
                        'name': 'name',
                        'type': 'text',
                        'required': False,
                        'vary': False,
                    },
                },
            },
            'schema-2': {
                'name': 'other',
                'fields': {
                    'field-2': {
                        'id': 'field-2',
                        'name': 'xxx',
                        'type': 'text',
                        'required': False,
                        'vary': False,
                    },
                },
            },
        })

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        schemas = project.schemas

        self.storage.open.assert_called_once_with('items.json')
        self.assertIsInstance(schemas, Schema.collection)
        self.assertEqual(schemas.dump(), {
            '1664-4f20-b657': {
                'name': 'product',
                'auto_created': True,
                'fields': {
                    'fbec-4a42-a4b0': {
                        'auto_created': True,
                        'id': 'fbec-4a42-a4b0',
                        'name': 'title',
                        'type': 'text',
                        'required': True,
                        'vary': False,
                    },
                    "cca5-490c-b604": {
                        "id": "cca5-490c-b604",
                        "name": "price",
                        "required": True,
                        "type": "price",
                        "vary": False
                    },
                    "34bc-406f-80bc": {
                        "id": "34bc-406f-80bc",
                        "name": "image",
                        "required": False,
                        "type": "image",
                        "vary": False
                    },
                    "ecfc-4dbe-b488": {
                        "id": "ecfc-4dbe-b488",
                        "name": "details",
                        "required": False,
                        "type": "text",
                        "vary": False
                    }
                },
            },
            'fa87-4791-8642': {
                'name': 'other',
                'fields': {},
            },
        })
        self.assertListEqual(schemas.keys(),
                             ['1664-4f20-b657', 'fa87-4791-8642'])

    def test_load_through_partial(self):
        schema = Schema(self.storage, id='1664-4f20-b657')
        self.storage.open.assert_not_called()
        self.assertEqual(schema.dump(), {
            '1664-4f20-b657': {
                'name': 'product',
                'auto_created': True,
                'fields': {
                    'fbec-4a42-a4b0': {
                        'auto_created': True,
                        'id': 'fbec-4a42-a4b0',
                        'name': 'title',
                        'type': 'text',
                        'required': True,
                        'vary': False,
                    },
                    "cca5-490c-b604": {
                        "id": "cca5-490c-b604",
                        "name": "price",
                        "required": True,
                        "type": "price",
                        "vary": False
                    },
                    "34bc-406f-80bc": {
                        "id": "34bc-406f-80bc",
                        "name": "image",
                        "required": False,
                        "type": "image",
                        "vary": False
                    },
                    "ecfc-4dbe-b488": {
                        "id": "ecfc-4dbe-b488",
                        "name": "details",
                        "required": False,
                        "type": "text",
                        "vary": False
                    }
                },
            },
        })
        self.storage.open.assert_called_once_with('items.json')

    def test_save_edit(self):
        schema = Project(self.storage, id='example').schemas['1664-4f20-b657']
        schema.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_not_called()

        schema.name = 'test'
        schema.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "test"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

        schema.id = 'xxxx-xxxx-xxxx'
        schema.save()

        self.storage.open.assert_called_once_with('items.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "test"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

    def test_save_new(self):
        project = Project(self.storage, id='example')
        schema = Schema(self.storage, id='xxxx-xxxx-xxxx', name='test1',
                        project=project)
        schema.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }, \n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "fields": {}, \n'
            '        "name": "test1"\n'
            '    }\n'
            '}')

        project.schemas.insert(
            0, Schema(self.storage, id='yyyy-yyyy-yyyy', name='test2'))
        project.schemas[0].save()

        self.storage.open.assert_called_once_with('items.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "yyyy-yyyy-yyyy": {\n'
            '        "fields": {}, \n'
            '        "name": "test2"\n'
            '    }, \n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }, \n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "fields": {}, \n'
            '        "name": "test1"\n'
            '    }\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        schema = project.schemas['1664-4f20-b657']
        schema.delete()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')
        self.storage.delete.assert_not_called()
        self.assertListEqual(project.schemas.keys(), ['fa87-4791-8642'])


class FieldTests(ProjectTestCase):
    def test_minimal_field(self):
        field = Field(id='field-1', name='url')

        self.assertEqual(field.dump(), {
            'field-1': {
                'id': 'field-1',
                'name': 'url',
                'type': 'text',
                'required': False,
                'vary': False,
            },
        })

    def test_full_field(self):
        field = Field(id='field-1', name='url', type='url',
                      required=True, vary=True, auto_created=True)

        self.assertEqual(field.dump(), {
            'field-1': {
                'id': 'field-1',
                'name': 'url',
                'type': 'url',
                'required': True,
                'vary': True,
                'auto_created': True,
            },
        })

    def test_field_types(self):
        field = Field(id='field-1', name='url')

        try:
            field.type = 'image'
            field.type = 'number'
            field.type = 'url'
        except ValidationError:
            self.fail(
                "Assigning to type attribute failed validation")

        with self.assertRaises(ValidationError):
            field.type = 'xxx'

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        fields = project.schemas['1664-4f20-b657'].fields

        self.storage.open.assert_called_once_with('items.json')
        self.assertIsInstance(fields, Field.collection)
        self.assertEqual(fields.dump(), {
            'fbec-4a42-a4b0': {
                'auto_created': True,
                'id': 'fbec-4a42-a4b0',
                'name': 'title',
                'type': 'text',
                'required': True,
                'vary': False,
            },
            "cca5-490c-b604": {
                "id": "cca5-490c-b604",
                "name": "price",
                "required": True,
                "type": "price",
                "vary": False
            },
            "34bc-406f-80bc": {
                "id": "34bc-406f-80bc",
                "name": "image",
                "required": False,
                "type": "image",
                "vary": False
            },
            "ecfc-4dbe-b488": {
                "id": "ecfc-4dbe-b488",
                "name": "details",
                "required": False,
                "type": "text",
                "vary": False
            },
        })
        self.assertListEqual(fields.keys(),
                             ['fbec-4a42-a4b0', "cca5-490c-b604",
                              "34bc-406f-80bc", "ecfc-4dbe-b488"])

    def test_load_through_partial(self):
        field = Field(self.storage, id='ecfc-4dbe-b488')
        self.assertEqual(field.dump(), {
            "ecfc-4dbe-b488": {
                "id": "ecfc-4dbe-b488",
                "name": "details",
                "required": False,
                "type": "text",
                "vary": False
            },
        })
        self.storage.open.assert_called_once_with('items.json')

    def test_save_edit(self):
        field = Project(self.storage, id='example').schemas['1664-4f20-b657']\
                                                   .fields['fbec-4a42-a4b0']
        field.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_not_called()

        field.name = 'test'
        field.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "test", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

        field.id = 'xxxx-xxxx-xxxx'
        field.save()

        self.storage.open.assert_called_once_with('items.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "xxxx-xxxx-xxxx": {\n'
            '                "auto_created": true, \n'
            '                "id": "xxxx-xxxx-xxxx", \n'
            '                "name": "test", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

    def test_save_new(self):
        schema = Project(self.storage, id='example').schemas['1664-4f20-b657']
        field = Field(self.storage, id='xxxx-xxxx-xxxx', name='test1',
                      schema=schema)
        field.save()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "xxxx-xxxx-xxxx": {\n'
            '                "id": "xxxx-xxxx-xxxx", \n'
            '                "name": "test1", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

        schema.fields.insert(
            0, Field(self.storage, id='yyyy-yyyy-yyyy', name='test2'))
        schema.fields[0].save()

        self.storage.open.assert_called_once_with('items.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "yyyy-yyyy-yyyy": {\n'
            '                "id": "yyyy-yyyy-yyyy", \n'
            '                "name": "test2", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "fbec-4a42-a4b0": {\n'
            '                "auto_created": true, \n'
            '                "id": "fbec-4a42-a4b0", \n'
            '                "name": "title", \n'
            '                "required": true, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "xxxx-xxxx-xxxx": {\n'
            '                "id": "xxxx-xxxx-xxxx", \n'
            '                "name": "test1", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')

    def test_delete(self):
        schema = Project(self.storage, id='example').schemas['1664-4f20-b657']
        field = schema.fields['fbec-4a42-a4b0']
        field.delete()

        self.storage.open.assert_called_once_with('items.json')
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')
        self.storage.delete.assert_not_called()
        self.assertListEqual(schema.fields.keys(),
                             ['cca5-490c-b604', '34bc-406f-80bc',
                              'ecfc-4dbe-b488'])


class ExtractorTests(ProjectTestCase):
    def test_type_extractor(self):
        extractor = Extractor(id='extractor-1', type='type', value='url')

        self.assertEqual(extractor.dump(), {
            'extractor-1': {
                'id': 'extractor-1',
                'type_extractor': 'url',
            },
        })

        try:
            extractor.value = 'image'
            extractor.value = 'number'
            extractor.value = 'text'
        except ValidationError:
            self.fail(
                "Assigning to value attribute failed validation")

        with self.assertRaises(ValidationError):
            extractor.value = 'xxx'

    def test_regexp_extractor(self):
        extractor = Extractor(id='extractor-1', type='regex', value='(.+)')

        self.assertEqual(extractor.dump(), {
            'extractor-1': {
                'id': 'extractor-1',
                'regular_expression': '(.+)',
            },
        })

        try:
            extractor.value = '[xy]'
        except ValidationError:
            self.fail(
                "Assigning to value attribute failed validation")

        with self.assertRaises(ValidationError):
            extractor.value = '[xy'

        self.assertEqual(extractor.dump(), {
            'extractor-1': {
                'id': 'extractor-1',
                'regular_expression': '[xy]',
            },
        })

    def test_extractor_type(self):
        extractor = Extractor(id='extractor-1', type='type', value='text')
        try:
            extractor.type = 'regex'
            extractor.type = 'type'
        except ValidationError:
            self.fail(
                "Assigning to type attribute failed validation")

        with self.assertRaises(ValidationError):
            extractor.type = 'xxx'

    def test_collection(self):
        extractors = Extractor.collection([
            Extractor(id='extractor-1', type='type', value='url'),
            Extractor(id='extractor-2', type='regex', value='(.+)'),
        ])

        self.assertEqual(extractors.dump(), {
            'extractor-1': {
                'id': 'extractor-1',
                'type_extractor': 'url',
            },
            'extractor-2': {
                'id': 'extractor-2',
                'regular_expression': '(.+)',
            },
        })

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        extractors = project.extractors

        self.storage.open.assert_called_once_with('extractors.json')
        self.assertIsInstance(extractors, Extractor.collection)
        self.assertEqual(extractors.dump(), {
            "e6fc-4758-9e6b": {
                "id": "e6fc-4758-9e6b",
                "regular_expression": "\\$(\\d+(?:\\.\\d{2}))",
            },
            "154f-45ce-bfbd": {
                "id": "154f-45ce-bfbd",
                "type_extractor": "number",
            },
        })
        self.assertListEqual(extractors.keys(),
                             ['e6fc-4758-9e6b', "154f-45ce-bfbd"])

    def test_load_through_partial(self):
        extractor = Extractor(self.storage, id='e6fc-4758-9e6b')
        self.assertEqual(extractor.dump(), {
            "e6fc-4758-9e6b": {
                "id": "e6fc-4758-9e6b",
                "regular_expression": "\\$(\\d+(?:\\.\\d{2}))",
            },
        })
        self.storage.open.assert_called_once_with('extractors.json')

    def test_save_edit(self):
        extractor = Project(
            self.storage, id='example').extractors['e6fc-4758-9e6b']
        extractor.save()

        self.storage.open.assert_called_once_with('extractors.json')
        self.storage.save.assert_not_called()

        extractor.value = 'test'
        extractor.save()

        self.storage.open.assert_called_once_with('extractors.json')
        self.storage.save.assert_called_once_with('extractors.json', mock.ANY)
        self.assertEqual(
            self.storage.files['extractors.json'],
            '{\n'
            '    "e6fc-4758-9e6b": {\n'
            '        "id": "e6fc-4758-9e6b", \n'
            '        "regular_expression": "test"\n'
            '    }, \n'
            '    "154f-45ce-bfbd": {\n'
            '        "id": "154f-45ce-bfbd", \n'
            '        "type_extractor": "number"\n'
            '    }\n'
            '}')

        extractor.id = 'xxxx-xxxx-xxxx'
        extractor.save()

        self.storage.open.assert_called_once_with('extractors.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('extractors.json', mock.ANY),
            mock.call('extractors.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['extractors.json'],
            '{\n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "id": "xxxx-xxxx-xxxx", \n'
            '        "regular_expression": "test"\n'
            '    }, \n'
            '    "154f-45ce-bfbd": {\n'
            '        "id": "154f-45ce-bfbd", \n'
            '        "type_extractor": "number"\n'
            '    }\n'
            '}')

    def test_save_new(self):
        project = Project(self.storage, id='example')
        extractor = Extractor(self.storage, id='xxxx-xxxx-xxxx',
                              type='regex', value='test1',
                              project=project)
        extractor.save()

        self.storage.open.assert_called_once_with('extractors.json')
        self.storage.save.assert_called_once_with('extractors.json', mock.ANY)
        self.assertEqual(
            self.storage.files['extractors.json'],
            '{\n'
            '    "e6fc-4758-9e6b": {\n'
            '        "id": "e6fc-4758-9e6b", \n'
            '        "regular_expression": "\\\\$(\\\\d+(?:\\\\.\\\\d{2}))"\n'
            '    }, \n'
            '    "154f-45ce-bfbd": {\n'
            '        "id": "154f-45ce-bfbd", \n'
            '        "type_extractor": "number"\n'
            '    }, \n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "id": "xxxx-xxxx-xxxx", \n'
            '        "regular_expression": "test1"\n'
            '    }\n'
            '}')

        project.extractors.insert(
            0, Extractor(self.storage, id='yyyy-yyyy-yyyy',
                         type='regex', value='test2'))
        project.extractors[0].save()

        self.storage.open.assert_called_once_with('extractors.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('extractors.json', mock.ANY),
            mock.call('extractors.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['extractors.json'],
            '{\n'
            '    "yyyy-yyyy-yyyy": {\n'
            '        "id": "yyyy-yyyy-yyyy", \n'
            '        "regular_expression": "test2"\n'
            '    }, \n'
            '    "e6fc-4758-9e6b": {\n'
            '        "id": "e6fc-4758-9e6b", \n'
            '        "regular_expression": "\\\\$(\\\\d+(?:\\\\.\\\\d{2}))"\n'
            '    }, \n'
            '    "154f-45ce-bfbd": {\n'
            '        "id": "154f-45ce-bfbd", \n'
            '        "type_extractor": "number"\n'
            '    }, \n'
            '    "xxxx-xxxx-xxxx": {\n'
            '        "id": "xxxx-xxxx-xxxx", \n'
            '        "regular_expression": "test1"\n'
            '    }\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        extractor = project.extractors['e6fc-4758-9e6b']
        extractor.delete()

        self.storage.open.assert_called_once_with('extractors.json')
        self.storage.save.assert_called_once_with('extractors.json', mock.ANY)
        self.assertEqual(
            self.storage.files['extractors.json'],
            '{\n'
            '    "154f-45ce-bfbd": {\n'
            '        "id": "154f-45ce-bfbd", \n'
            '        "type_extractor": "number"\n'
            '    }\n'
            '}')
        self.storage.delete.assert_not_called()
        self.assertListEqual(project.extractors.keys(), ['154f-45ce-bfbd'])


class SpiderTests(ProjectTestCase):
    def test_minimal_spider(self):
        spider = Spider(id='spider-1')
        spider.start_urls.append({'type': 'url', 'url': 'http://example.com'})

        self.assertEqual(spider.dump(), {
            'id': 'spider-1',
            'start_urls': [{
                'type': 'url',
                'url': 'http://example.com',
            }],
            'links_to_follow': "all",
            'allowed_domains': [],
            'respect_nofollow': True,
            'follow_patterns': [],
            'exclude_patterns': [],
            'js_enabled': False,
            'js_enable_patterns': [],
            'js_disable_patterns': [],
        })

    def test_full_spider(self):
        spider = Spider(
            id='spider-1',
            start_urls=[{'type': 'url', 'url': 'http://example.com'}],
            links_to_follow="none",
            allowed_domains=['example.com'],
            respect_nofollow=False,
            follow_patterns=['.*'],
            exclude_patterns=['.*ignore.*'],
            js_enabled=True,
            js_enable_patterns=['.*'],
            js_disable_patterns=['.*ignore.*'],
            perform_login=True,
            login_url='http://shop.example.com/login',
            login_user='user',
            login_password='pass',
            samples=[
                Sample(id='sample-1'),
            ],
        )

        self.assertEqual(spider.dump(), {
            'id': 'spider-1',
            'start_urls': [{
                'type': 'url',
                'url': 'http://example.com'
            }],
            'links_to_follow': "none",
            'allowed_domains': [
                'example.com',
            ],
            'respect_nofollow': False,
            'follow_patterns': [
                '.*',
            ],
            'exclude_patterns': [
                '.*ignore.*',
            ],
            'js_enabled': True,
            'js_enable_patterns': [
                '.*',
            ],
            'js_disable_patterns': [
                '.*ignore.*',
            ],
            'init_requests': [
                {
                    'type': 'login',
                    'loginurl': 'http://shop.example.com/login',
                    'username': 'user',
                    'password': 'pass'
                }
            ],
        })

    def test_links_to_follow(self):
        spider = Spider(id='spider-1')

        try:
            spider.links_to_follow = 'patterns'
            spider.links_to_follow = 'auto'
            spider.links_to_follow = 'none'
            spider.links_to_follow = 'all'
        except ValidationError:
            self.fail(
                "Assigning to type attribute failed validation")

        with self.assertRaises(ValidationError):
            spider.links_to_follow = 'xxx'

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        spiders = project.spiders
        self.assertListEqual(spiders.keys(), ['shop-crawler'])
        self.assertIsInstance(spiders, Spider.collection)
        self.storage.open.assert_not_called()
        self.storage.listdir.assert_called_once_with('spiders')
        self.assertEqual(spiders.dump(), [
            {
                "id": "shop-crawler",
                # "name": "shop-crawler",
                "start_urls": [{
                    "type": "url",
                    "url": "http://example.com/"
                }],
                "links_to_follow": "all",
                "allowed_domains": [],
                "respect_nofollow": True,
                "follow_patterns": [],
                "exclude_patterns": [],
                "js_enabled": False,
                "js_enable_patterns": [],
                "js_disable_patterns": [],
                "init_requests": [
                    {
                        "type": "login",
                        "loginurl": "http://shop.example.com/login",
                        "username": "user",
                        "password": "pass"
                    }
                ],
            },
        ])
        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')

    def test_load_through_partial(self):
        spider = Spider(self.storage, id='shop-crawler')
        self.assertEqual(spider.dump(), {
            "id": "shop-crawler",
            # "name": "shop-crawler",
            "start_urls": [{
                "type": "url",
                "url": "http://example.com/"
            }],
            "links_to_follow": "all",
            "allowed_domains": [],
            "respect_nofollow": True,
            "follow_patterns": [],
            "exclude_patterns": [],
            "js_enabled": False,
            "js_enable_patterns": [],
            "js_disable_patterns": [],
            "init_requests": [
                {
                    "type": "login",
                    "loginurl": "http://shop.example.com/login",
                    "username": "user",
                    "password": "pass"
                }
            ],
        })
        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')

    def test_save_edit(self):
        spider = Project(self.storage, id='example').spiders['shop-crawler']
        spider.save()

        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')
        self.storage.save.assert_not_called()

        spider.follow_patterns.append('test')
        spider.save()

        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/shop-crawler.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [\n'
            '        "test"\n'
            '    ], \n'
            '    "id": "shop-crawler", \n'
            '    "init_requests": [\n'
            '        {\n'
            '            "type": "login", \n'
            '            "loginurl": "http://shop.example.com/login", \n'
            '            "username": "user", \n'
            '            "password": "pass"\n'
            '        }\n'
            '    ], \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": [\n'
            '        {\n'
            '            "url": "http://example.com/", \n'
            '            "type": "url"\n'
            '        }\n'
            '    ]\n'
            '}')

        spider.id = 'test-id'
        spider.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(self.storage.save.call_count, 3)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler.json', mock.ANY),
            mock.call('spiders/test-id.json', mock.ANY),
            mock.call('spiders/test-id/1ddc-4043-ac4d.json', mock.ANY)])
        self.assertEqual(self.storage.delete.call_count, 2)
        self.storage.delete.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(
            self.storage.files['spiders/test-id.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [\n'
            '        "test"\n'
            '    ], \n'
            '    "id": "test-id", \n'
            '    "init_requests": [\n'
            '        {\n'
            '            "type": "login", \n'
            '            "loginurl": "http://shop.example.com/login", \n'
            '            "username": "user", \n'
            '            "password": "pass"\n'
            '        }\n'
            '    ], \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": [\n'
            '        {\n'
            '            "url": "http://example.com/", \n'
            '            "type": "url"\n'
            '        }\n'
            '    ]\n'
            '}')

    def test_save_new(self):
        project = Project(self.storage, id='example')
        spider = Spider(self.storage, id='test1', project=project)
        spider.save()

        self.storage.open.assert_not_called()
        self.storage.save.assert_called_once_with(
            'spiders/test1.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/test1.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [], \n'
            '    "id": "test1", \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": []\n'
            '}')

        project.spiders.insert(0, Spider(self.storage, id='test2'))
        project.spiders[0].save()

        self.storage.open.assert_not_called()
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/test1.json', mock.ANY),
            mock.call('spiders/test2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/test2.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [], \n'
            '    "id": "test2", \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": []\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        project.schemas  # preload schemas
        spider = project.spiders['shop-crawler']
        spider.delete()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('items.json'),
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.storage.save.assert_called_once_with('items.json', mock.ANY)
        self.assertEqual(self.storage.delete.call_count, 2)
        self.storage.delete.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertListEqual(project.spiders.keys(), [])
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')


class SampleTests(ProjectTestCase):
    def test_minimal_sample(self):
        sample = Sample(
            id='sample-1',
            name='example',
            url='http://example.com')

        self.assertEqual(sample.dump(), {
            'id': 'sample-1',
            'name': 'example',
            'url': 'http://example.com',
            'page_id': '',
            'page_type': 'item',
            'spider': None,
            'scrapes': None,
            'plugins': {
                'annotations-plugin': {
                    'extracts': [],
                },
            },
            'extractors': {},
            'version': SLYBOT_VERSION,
        })

    def test_full_sample(self):
        sample = Sample(
            id='sample-1',
            name='example',
            url='http://example.com',
            page_id='test-id',
            spider=Spider(id='spider-1'))

        self.assertEqual(sample.dump(), {
            'id': 'sample-1',
            'name': 'example',
            'url': 'http://example.com',
            'page_id': 'test-id',
            'page_type': 'item',
            'spider': 'spider-1',
            'scrapes': None,
            'plugins': {
                'annotations-plugin': {
                    'extracts': [],
                },
            },
            'extractors': {},
            'version': SLYBOT_VERSION,
        })

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        samples = project.spiders['shop-crawler'].samples
        self.assertListEqual(samples.keys(), ['1ddc-4043-ac4d'])
        self.assertIsInstance(samples, Sample.collection)
        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')
        self.assertEqual(samples.dump(), [
            {
                'id': '1ddc-4043-ac4d',
                'name': 'example',
                'url': 'http://example.com',
                'page_id': 'ab5bbf650b32ca41af6f8e9976fc3c85eee87f67',
                'page_type': 'item',
                'spider': 'shop-crawler',
                'scrapes': '1664-4f20-b657',
                'plugins': {
                    'annotations-plugin': {
                        'extracts': [
                            {
                                'annotations': {
                                    '#portia-content': '#dummy',
                                },
                                'container_id': None,
                                'id': '1e47-4833-a4d4#parent',
                                'item_container': True,
                                'repeated': False,
                                'required': [],
                                'schema_id': '1664-4f20-b657',
                                'selector': 'body',
                                'siblings': 0,
                                'tagid': None,
                                'text-content': '#portia-content',
                            },
                            {
                                'annotations': {
                                    '#portia-content': '#dummy',
                                },
                                'container_id': '1e47-4833-a4d4#parent',
                                'id': '1e47-4833-a4d4',
                                'item_container': True,
                                'repeated': True,
                                'required': [],
                                'schema_id': '1664-4f20-b657',
                                'selector': '.main',
                                'siblings': 0,
                                'tagid': None,
                                'text-content': '#portia-content',
                            },
                            {
                                'accept_selectors': [
                                    '.main:nth-child(1) > h1',
                                    '.main:nth-child(2) > h1',
                                ],
                                'container_id': '1e47-4833-a4d4',
                                'data': {
                                    'd1e2-4673-a72a': {
                                        'attribute': 'content',
                                        'extractors': {},
                                        'field': 'fbec-4a42-a4b0',
                                        'required': False,
                                    },
                                },
                                'id': '3606-4d68-a6a0',
                                'post_text': None,
                                'pre_text': None,
                                'reject_selectors': [],
                                'repeated': False,
                                'required': [],
                                'selection_mode': 'auto',
                                'selector': '.main > h1',
                                'tagid': None,
                                'xpath': None,
                            },
                            {
                                'accept_selectors': [
                                    '.main:nth-child(1) > img',
                                ],
                                'container_id': '1e47-4833-a4d4',
                                'data': {
                                    'de35-49b5-b90b': {
                                        'attribute': 'content',
                                        'extractors': [
                                            'e6fc-4758-9e6b',
                                            '154f-45ce-bfbd',
                                        ],
                                        'field': '34bc-406f-80bc',
                                        'required': False,
                                    },
                                },
                                'id': '5c18-40cf-8809',
                                'post_text': None,
                                'pre_text': None,
                                'reject_selectors': [],
                                'repeated': False,
                                'required': [],
                                'selection_mode': 'auto',
                                'selector': '.main > img',
                                'tagid': None,
                                'xpath': None,
                            },
                        ],
                    },
                },
                'extractors': {},
                'version': SLYBOT_VERSION,
            },
        ])
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])

    def test_load_through_partial(self):
        sample = Sample(self.storage, id='1ddc-4043-ac4d',
                        spider=Spider(self.storage, id='shop-crawler'))
        self.assertEqual(sample.dump(), {
            'id': '1ddc-4043-ac4d',
            'name': 'example',
            'url': 'http://example.com',
            'page_id': 'ab5bbf650b32ca41af6f8e9976fc3c85eee87f67',
            'page_type': 'item',
            'spider': 'shop-crawler',
            'scrapes': '1664-4f20-b657',
            'plugins': {
                'annotations-plugin': {
                    'extracts': [
                        {
                            'annotations': {
                                '#portia-content': '#dummy',
                            },
                            'container_id': None,
                            'id': '1e47-4833-a4d4#parent',
                            'item_container': True,
                            'repeated': False,
                            'required': [],
                            'schema_id': '1664-4f20-b657',
                            'selector': 'body',
                            'siblings': 0,
                            'tagid': None,
                            'text-content': '#portia-content',
                        },
                        {
                            'annotations': {
                                '#portia-content': '#dummy',
                            },
                            'container_id': '1e47-4833-a4d4#parent',
                            'id': '1e47-4833-a4d4',
                            'item_container': True,
                            'repeated': True,
                            'required': [],
                            'schema_id': '1664-4f20-b657',
                            'selector': '.main',
                            'siblings': 0,
                            'tagid': None,
                            'text-content': '#portia-content',
                        },
                        {
                            'accept_selectors': [
                                '.main:nth-child(1) > h1',
                                '.main:nth-child(2) > h1',
                            ],
                            'container_id': '1e47-4833-a4d4',
                            'data': {
                                'd1e2-4673-a72a': {
                                    'attribute': 'content',
                                    'extractors': {},
                                    'field': 'fbec-4a42-a4b0',
                                    'required': False,
                                },
                            },
                            'id': '3606-4d68-a6a0',
                            'post_text': None,
                            'pre_text': None,
                            'reject_selectors': [],
                            'required': [],
                            'repeated': False,
                            'selection_mode': 'auto',
                            'selector': '.main > h1',
                            'tagid': None,
                            'xpath': None,
                        },
                        {
                            'accept_selectors': [
                                '.main:nth-child(1) > img',
                            ],
                            'container_id': '1e47-4833-a4d4',
                            'data': {
                                'de35-49b5-b90b': {
                                    'attribute': 'content',
                                    'extractors': [
                                        'e6fc-4758-9e6b',
                                        '154f-45ce-bfbd',
                                    ],
                                    'field': '34bc-406f-80bc',
                                    'required': False,
                                },
                            },
                            'id': '5c18-40cf-8809',
                            'post_text': None,
                            'pre_text': None,
                            'reject_selectors': [],
                            'required': [],
                            'repeated': False,
                            'selection_mode': 'auto',
                            'selector': '.main > img',
                            'tagid': None,
                            'xpath': None,
                        },
                    ],
                },
            },
            'extractors': {},
            'version': SLYBOT_VERSION,
        })
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])

    def test_save_edit(self):
        sample = Sample(self.storage, id='1ddc-4043-ac4d',
                        spider=Spider(self.storage, id='shop-crawler'))
        sample.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.storage.save.assert_not_called()

        sample.original_body.html = '<html id="#test"></html>'
        sample.original_body.save()
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler/1ddc-4043-ac4d/original_body.html', mock.ANY)
        sample.page_id = sample.id
        sample.save()

        self.assertEqual(self.storage.open.call_count, 5)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "1ddc-4043-ac4d", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        sample.id = 'test-id'
        sample.save()

        self.assertEqual(self.storage.open.call_count, 5)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(self.storage.save.call_count, 5)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d/original_body.html',
                      mock.ANY),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('spiders/shop-crawler/test-id.json', mock.ANY),
            mock.call('spiders/shop-crawler/test-id/original_body.html',
                      mock.ANY),
            mock.call('spiders/shop-crawler.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/test-id.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "test-id", \n'
            '    "name": "example", \n'
            '    "page_id": "1ddc-4043-ac4d", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')
        self.assertEqual(
            self.storage.files['spiders/shop-crawler.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [], \n'
            '    "id": "shop-crawler", \n'
            '    "init_requests": [\n'
            '        {\n'
            '            "type": "login", \n'
            '            "loginurl": "http://shop.example.com/login", \n'
            '            "username": "user", \n'
            '            "password": "pass"\n'
            '        }\n'
            '    ], \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": [\n'
            '        {\n'
            '            "url": "http://example.com/", \n'
            '            "type": "url"\n'
            '        }\n'
            '    ]\n'
            '}')

    def test_save_new(self):
        spider = Spider(self.storage, id='shop-crawler',
                        project=Project(self.storage, id='example'))
        sample = Sample(self.storage, id='test1', name='test sample 1',
                        url='http://example.com/test1', spider=spider)
        sample.save()

        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/test1.json', mock.ANY),
            mock.call('spiders/shop-crawler.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/test1.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "test1", \n'
            '    "name": "test sample 1", \n'
            '    "page_id": "", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": []\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": null, \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com/test1", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        spider.samples.insert(0, Sample(self.storage, id='test2',
                                        name='test sample 2',
                                        url='http://example.com/test2'))
        spider.samples[0].save()

        self.storage.open.assert_called_once_with('spiders/shop-crawler.json')
        self.assertEqual(self.storage.save.call_count, 4)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/test1.json', mock.ANY),
            mock.call('spiders/shop-crawler.json', mock.ANY),
            mock.call('spiders/shop-crawler/test2.json', mock.ANY),
            mock.call('spiders/shop-crawler.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/test2.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "test2", \n'
            '    "name": "test sample 2", \n'
            '    "page_id": "", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": []\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": null, \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com/test2", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        project.schemas  # preload schemas
        spider = Spider(self.storage, id='shop-crawler', project=project)
        sample = spider.samples['1ddc-4043-ac4d']
        sample.delete()

        self.assertEqual(self.storage.open.call_count, 6)
        self.storage.open.assert_has_calls([
            mock.call('items.json'),
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('items.json', mock.ANY),
            mock.call('spiders/shop-crawler.json', mock.ANY)])
        self.assertEqual(self.storage.delete.call_count, 3)
        self.storage.delete.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d/rendered_body.html'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d/original_body.html')
        ])
        self.assertListEqual(spider.samples.keys(), [])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler.json'],
            '{\n'
            '    "allowed_domains": [], \n'
            '    "exclude_patterns": [], \n'
            '    "follow_patterns": [], \n'
            '    "id": "shop-crawler", \n'
            '    "init_requests": [\n'
            '        {\n'
            '            "type": "login", \n'
            '            "loginurl": "http://shop.example.com/login", \n'
            '            "username": "user", \n'
            '            "password": "pass"\n'
            '        }\n'
            '    ], \n'
            '    "js_disable_patterns": [], \n'
            '    "js_enable_patterns": [], \n'
            '    "js_enabled": false, \n'
            '    "links_to_follow": "all", \n'
            '    "respect_nofollow": true, \n'
            '    "start_urls": [\n'
            '        {\n'
            '            "url": "http://example.com/", \n'
            '            "type": "url"\n'
            '        }\n'
            '    ]\n'
            '}')
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')


class ItemTests(ProjectTestCase):
    def get_storage_files(self):
        return dict(super(ItemTests, self).get_storage_files(), **{
            'items.json':
                '{'
                '    "1664-4f20-b657": {'
                '        "fields": {'
                '            "fbec-4a42-a4b0": {'
                '                "auto_created": true,'
                '                "id": "fbec-4a42-a4b0",'
                '                "name": "title",'
                '                "required": true,'
                '                "type": "text",'
                '                "vary": false'
                '            },'
                '            "cca5-490c-b604": {'
                '                "id": "cca5-490c-b604",'
                '                "name": "price",'
                '                "required": true,'
                '                "type": "price",'
                '                "vary": false'
                '            },'
                '            "34bc-406f-80bc": {'
                '                "id": "34bc-406f-80bc",'
                '                "name": "image",'
                '                "required": false,'
                '                "type": "image",'
                '                "vary": false'
                '            },'
                '            "ecfc-4dbe-b488": {'
                '                "id": "ecfc-4dbe-b488",'
                '                "name": "details",'
                '                "required": false,'
                '                "type": "text",'
                '                "vary": false'
                '            }'
                '        },'
                '        "name": "product"'
                '    },'
                '    "fa87-4791-8642": {'
                '        "fields": {},'
                '        "name": "other"'
                '    }'
                '}',
            'spiders/shop-crawler/1ddc-4043-ac4d.json':
                '{'
                '    "id": "1ddc-4043-ac4d",'
                '    "name": "example",'
                '    "url": "http://example.com",'
                '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67",'
                '    "page_type": "item",'
                '    "spider": "shop-crawler",'
                '    "scrapes": "1664-4f20-b657",'
                '    "plugins": {'
                '        "annotations-plugin": {'
                '            "extracts": ['
                '                {'
                '                    "id": "1e47-4833-a4d4",'
                '                    "container_id": "1e47-4833-a4d4#parent",'
                '                    "schema_id": "1664-4f20-b657",'
                '                    "item_container": true,'
                '                    "selector": ".main",'
                '                    "repeated": true,'
                '                    "siblings": 0,'
                '                    "required": [],'
                '                    "tagid": 18,'
                '                    "text-content": "#portia-content",'
                '                    "annotations": {'
                '                        "#portia-content": "#dummy"'
                '                    }'
                '                },'
                '                {'
                '                    "id": "1e47-4833-a4d4#parent",'
                '                    "container_id": null,'
                '                    "schema_id": "1664-4f20-b657",'
                '                    "item_container": true,'
                '                    "selector": "body",'
                '                    "repeated": false,'
                '                    "siblings": 0,'
                '                    "required": [],'
                '                    "tagid": 18,'
                '                    "text-content": "#portia-content",'
                '                    "annotations": {'
                '                        "#portia-content": "#dummy"'
                '                    }'
                '                },'
                '                {'
                '                    "id": "3606-4d68-a6a0",'
                '                    "container_id": "1e47-4833-a4d4",'
                '                    "selection_mode": "auto",'
                '                    "selector": ".main > h1",'
                '                    "accept_selectors": ['
                '                        ".main:nth-child(1) > h1",'
                '                        ".main:nth-child(2) > h1"'
                '                    ],'
                '                    "reject_selectors": [],'
                '                    "data": {'
                '                        "d1e2-4673-a72a": {'
                '                            "field": "fbec-4a42-a4b0",'
                '                            "attribute": "content",'
                '                            "required": false,'
                '                            "extractors": {}'
                '                        }'
                '                    },'
                '                    "pre_text": null,'
                '                    "post_text": null,'
                '                    "tagid": null,'
                '                    "required": []'
                '                },'
                '                {'
                '                    "id": "b161-47b1-b064",'
                '                    "container_id": "1e47-4833-a4d4",'
                '                    "schema_id": "1664-4f20-b657",'
                '                    "item_container": true,'
                '                    "selector": ".main > div",'
                '                    "repeated": false,'
                '                    "siblings": 0,'
                '                    "required": [],'
                '                    "tagid": 18,'
                '                    "text-content": "#portia-content",'
                '                    "annotations": {'
                '                        "#portia-content": "#dummy"'
                '                    }'
                '                },'
                '                {'
                '                    "id": "5c18-40cf-8809",'
                '                    "container_id": "1e47-4833-a4d4",'
                '                    "selection_mode": "auto",'
                '                    "selector": ".main > img",'
                '                    "accept_selectors": ['
                '                        ".main:nth-child(1) > img"'
                '                    ],'
                '                    "reject_selectors": [],'
                '                    "data": {'
                '                        "de35-49b5-b90b": {'
                '                            "field": "34bc-406f-80bc",'
                '                            "attribute": "content",'
                '                            "required": false,'
                '                            "extractors": ['
                '                                "e6fc-4758-9e6b",'
                '                                "154f-45ce-bfbd"'
                '                            ]'
                '                        }'
                '                    },'
                '                    "pre_text": null,'
                '                    "post_text": null,'
                '                    "tagid": null,'
                '                    "required": []'
                '                },'
                '                {'
                '                    "id": "7fd9-4ba9-83b8",'
                '                    "container_id": "b161-47b1-b064",'
                '                    "selection_mode": "auto",'
                '                    "selector": ".main > div > span",'
                '                    "accept_selectors": ['
                '                        ".main:nth-child(1) > div > span"'
                '                    ],'
                '                    "reject_selectors": [],'
                '                    "data": {'
                '                        "6535-4215-b774": {'
                '                            "field": "cca5-490c-b604",'
                '                            "attribute": "content",'
                '                            "required": false,'
                '                            "extractors": {}'
                '                        }'
                '                    },'
                '                    "pre_text": null,'
                '                    "post_text": null,'
                '                    "tagid": null,'
                '                    "required": []'
                '                }'
                '            ]'
                '        }'
                '    },'
                '    "version": "' + SLYBOT_VERSION + '"'
                '}',
            'spiders/shop-crawler/1ddc-4043-ac4d/original_body.html': (
                '<html></html>')
        })

    def test_minimal_item(self):
        item = Item(id='item-1')

        self.assertEqual(item.dump(), {
            'annotations': {
                '#portia-content': '#dummy',
            },
            'children': [],
            'container_id': None,
            'id': 'item-1',
            'item_container': True,
            'repeated': False,
            'repeated_selector': None,
            'required': [],
            'schema_id': None,
            'selector': None,
            'siblings': 0,
            'tagid': None,
            'text-content': '#portia-content',
        })

    def test_full_item(self):
        item = Item(
            id='item-1',
            name='test',
            selector='body',
            repeated_selector='.item',
            siblings=2,
            schema=Schema(id='schema-1'),
            annotations=[])

        self.assertEqual(item.dump(), {
            'annotations': {
                '#portia-content': '#dummy',
            },
            'children': [],
            'container_id': None,
            'field': 'test',
            'id': 'item-1',
            'item_container': True,
            'repeated': True,
            'repeated_selector': '.item',
            'required': [],
            'schema_id': 'schema-1',
            'selector': 'body',
            'siblings': 2,
            'tagid': None,
            'text-content': '#portia-content',
        })

    def test_with_annotation(self):
        item = Item(id='item-1')
        item.annotations.append(Annotation(id='annotation-1|data-1'))

        self.assertEqual(item.dump(), {
            'annotations': {
                '#portia-content': '#dummy',
            },
            'children': [
                {
                    "accept_selectors": [],
                    "container_id": "item-1",
                    "data": {
                        "data-1": {
                            "attribute": "content",
                            "extractors": {},
                            "field": None,
                            "required": False,
                        },
                    },
                    "id": "annotation-1",
                    "post_text": None,
                    "pre_text": None,
                    "reject_selectors": [],
                    "repeated": False,
                    "required": [],
                    "selection_mode": "auto",
                    "selector": None,
                    "tagid": None,
                    "xpath": None,
                },
            ],
            'container_id': None,
            'id': 'item-1',
            'item_container': True,
            'repeated': False,
            'repeated_selector': None,
            'required': [],
            'schema_id': None,
            'selector': None,
            'siblings': 0,
            'tagid': None,
            'text-content': '#portia-content',
        })

    def test_with_nested_item(self):
        item = Item(id='item-1')
        item.annotations.append(Item(id='item-2'))

        self.assertEqual(item.dump(), {
            'annotations': {
                '#portia-content': '#dummy',
            },
            'children': [
                {
                    "annotations": {
                        "#portia-content": "#dummy",
                    },
                    "children": [],
                    "container_id": "item-1",
                    "id": "item-2",
                    "item_container": True,
                    "repeated": False,
                    "repeated_selector": None,
                    "required": [],
                    "schema_id": None,
                    "selector": None,
                    "siblings": 0,
                    "tagid": None,
                    "text-content": "#portia-content",
                },
            ],
            'container_id': None,
            'id': 'item-1',
            'item_container': True,
            'repeated': False,
            'repeated_selector': None,
            'required': [],
            'schema_id': None,
            'selector': None,
            'siblings': 0,
            'tagid': None,
            'text-content': '#portia-content',
        })

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        items = project.spiders['shop-crawler'].samples['1ddc-4043-ac4d'].items
        self.assertListEqual(items.keys(), ['1e47-4833-a4d4'])
        self.assertIsInstance(items, Item.collection)
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(items.dump(), [
            {
                'annotations': {
                    '#portia-content': '#dummy',
                },
                'children': [
                    {
                        'accept_selectors': [
                            '.main:nth-child(1) > h1',
                            '.main:nth-child(2) > h1',
                        ],
                        'container_id': '1e47-4833-a4d4',
                        'data': {
                            'd1e2-4673-a72a': {
                                'attribute': 'content',
                                'extractors': {},
                                'field': 'fbec-4a42-a4b0',
                                'required': False,
                            },
                        },
                        'id': '3606-4d68-a6a0',
                        'post_text': None,
                        'pre_text': None,
                        'reject_selectors': [],
                        'required': [],
                        'repeated': False,
                        'selection_mode': 'auto',
                        'selector': '.main > h1',
                        'tagid': None,
                        'xpath': None,
                    },
                    {
                        'annotations': {
                            '#portia-content': '#dummy',
                        },
                        'children': [
                            {
                                'accept_selectors': [
                                    '.main:nth-child(1) > div > span',
                                ],
                                'container_id': 'b161-47b1-b064',
                                'data': {
                                    '6535-4215-b774': {
                                        'attribute': 'content',
                                        'extractors': {},
                                        'field': 'cca5-490c-b604',
                                        'required': False,
                                    },
                                },
                                'id': '7fd9-4ba9-83b8',
                                'post_text': None,
                                'pre_text': None,
                                'reject_selectors': [],
                                'repeated': False,
                                'required': [],
                                'selection_mode': 'auto',
                                'selector': '.main > div > span',
                                'tagid': None,
                                'xpath': None,
                            },
                        ],
                        'container_id': '1e47-4833-a4d4',
                        'id': 'b161-47b1-b064',
                        'item_container': True,
                        'repeated': False,
                        'repeated_selector': None,
                        'required': [],
                        'schema_id': '1664-4f20-b657',
                        'selector': '.main > div',
                        'siblings': 0,
                        'tagid': None,
                        'text-content': '#portia-content',
                    },
                    {
                        'accept_selectors': [
                            '.main:nth-child(1) > img',
                        ],
                        'container_id': '1e47-4833-a4d4',
                        'data': {
                            'de35-49b5-b90b': {
                                'attribute': 'content',
                                'extractors': [
                                    'e6fc-4758-9e6b',
                                    '154f-45ce-bfbd',
                                ],
                                'field': '34bc-406f-80bc',
                                'required': False,
                            },
                        },
                        'id': '5c18-40cf-8809',
                        'post_text': None,
                        'pre_text': None,
                        'reject_selectors': [],
                        'required': [],
                        'repeated': False,
                        'selection_mode': 'auto',
                        'selector': '.main > img',
                        'tagid': None,
                        'xpath': None,
                    },
                ],
                'container_id': None,
                'id': '1e47-4833-a4d4',
                'item_container': True,
                'repeated': True,
                'repeated_selector': '.main',
                'required': [],
                'schema_id': '1664-4f20-b657',
                'selector': 'body',
                'siblings': 0,
                'tagid': None,
                'text-content': '#portia-content',
            },
        ])
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])

    def test_load_through_partial(self):
        item = Item(
            self.storage, id='1e47-4833-a4d4',
            sample=Sample(
                self.storage, id='1ddc-4043-ac4d',
                spider=Spider(self.storage, id='shop-crawler')))
        self.assertEqual(item.dump(), {
            'annotations': {
                '#portia-content': '#dummy',
            },
            'children': [
                {
                    'accept_selectors': [
                        '.main:nth-child(1) > h1',
                        '.main:nth-child(2) > h1',
                    ],
                    'container_id': '1e47-4833-a4d4',
                    'data': {
                        'd1e2-4673-a72a': {
                            'attribute': 'content',
                            'extractors': {},
                            'field': 'fbec-4a42-a4b0',
                            'required': False,
                        },
                    },
                    'id': '3606-4d68-a6a0',
                    'post_text': None,
                    'pre_text': None,
                    'reject_selectors': [],
                    'required': [],
                    'repeated': False,
                    'selection_mode': 'auto',
                    'selector': '.main > h1',
                    'tagid': None,
                    'xpath': None,
                },
                {
                    'annotations': {
                        '#portia-content': '#dummy',
                    },
                    'children': [
                        {
                            'accept_selectors': [
                                '.main:nth-child(1) > div > span',
                            ],
                            'container_id': 'b161-47b1-b064',
                            'data': {
                                '6535-4215-b774': {
                                    'attribute': 'content',
                                    'extractors': {},
                                    'field': 'cca5-490c-b604',
                                    'required': False,
                                },
                            },
                            'id': '7fd9-4ba9-83b8',
                            'post_text': None,
                            'pre_text': None,
                            'reject_selectors': [],
                            'repeated': False,
                            'required': [],
                            'selection_mode': 'auto',
                            'selector': '.main > div > span',
                            'tagid': None,
                            'xpath': None,
                        },
                    ],
                    'container_id': '1e47-4833-a4d4',
                    'id': 'b161-47b1-b064',
                    'item_container': True,
                    'repeated': False,
                    'repeated_selector': None,
                    'required': [],
                    'schema_id': '1664-4f20-b657',
                    'selector': '.main > div',
                    'siblings': 0,
                    'tagid': None,
                    'text-content': '#portia-content',
                },
                {
                    'accept_selectors': [
                        '.main:nth-child(1) > img',
                    ],
                    'container_id': '1e47-4833-a4d4',
                    'data': {
                        'de35-49b5-b90b': {
                            'attribute': 'content',
                            'extractors': [
                                'e6fc-4758-9e6b',
                                '154f-45ce-bfbd',
                            ],
                            'field': '34bc-406f-80bc',
                            'required': False,
                        },
                    },
                    'id': '5c18-40cf-8809',
                    'post_text': None,
                    'pre_text': None,
                    'reject_selectors': [],
                    'required': [],
                    'repeated': False,
                    'selection_mode': 'auto',
                    'selector': '.main > img',
                    'tagid': None,
                    'xpath': None,
                },
            ],
            'container_id': None,
            'id': '1e47-4833-a4d4',
            'item_container': True,
            'repeated': True,
            'repeated_selector': '.main',
            'required': [],
            'schema_id': '1664-4f20-b657',
            'selector': 'body',
            'siblings': 0,
            'tagid': None,
            'text-content': '#portia-content',
        })
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])

    def test_save_edit(self):
        item = Item(
            self.storage, id='1e47-4833-a4d4',
            sample=Sample(
                self.storage, id='1ddc-4043-ac4d',
                spider=Spider(self.storage, id='shop-crawler')))
        item.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_not_called()

        item.selector = '#test'
        item.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "#test", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "id": "b161-47b1-b064", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main > div", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > div > span"\n'
            '                    ], \n'
            '                    "container_id": "b161-47b1-b064", \n'
            '                    "data": {\n'
            '                        "6535-4215-b774": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "cca5-490c-b604", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "7fd9-4ba9-83b8", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > div > span", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        item.id = 'test-id'
        item.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "test-id#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "#test", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "test-id#parent", \n'
            '                    "id": "test-id", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "test-id", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "test-id", \n'
            '                    "id": "b161-47b1-b064", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main > div", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > div > span"\n'
            '                    ], \n'
            '                    "container_id": "b161-47b1-b064", \n'
            '                    "data": {\n'
            '                        "6535-4215-b774": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "cca5-490c-b604", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "7fd9-4ba9-83b8", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > div > span", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "test-id", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

    def test_save_new(self):
        sample = Sample(self.storage, id='1ddc-4043-ac4d',
                        spider=Spider(self.storage, id='shop-crawler',
                                      project=Project(self.storage,
                                                      id='example')))
        item = Item(self.storage, id='test1', sample=sample)
        item.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "id": "b161-47b1-b064", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main > div", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > div > span"\n'
            '                    ], \n'
            '                    "container_id": "b161-47b1-b064", \n'
            '                    "data": {\n'
            '                        "6535-4215-b774": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "cca5-490c-b604", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "7fd9-4ba9-83b8", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > div > span", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "test1", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": null, \n'
            '                    "selector": null, \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        sample.items.insert(0, Item(self.storage, id='test2',
                                    selector='#xxx',
                                    repeated_selector='.yyy'))
        sample.items[0].save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "test2#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": null, \n'
            '                    "selector": "#xxx", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "test2#parent", \n'
            '                    "id": "test2", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": null, \n'
            '                    "selector": ".yyy", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "id": "b161-47b1-b064", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main > div", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > div > span"\n'
            '                    ], \n'
            '                    "container_id": "b161-47b1-b064", \n'
            '                    "data": {\n'
            '                        "6535-4215-b774": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "cca5-490c-b604", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "7fd9-4ba9-83b8", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > div > span", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "test1", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": null, \n'
            '                    "selector": null, \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        project.schemas  # preload schemas
        sample = Sample(self.storage, id='1ddc-4043-ac4d',
                        spider=Spider(self.storage, id='shop-crawler',
                                      project=project))

        item = sample.items['1e47-4833-a4d4']
        item.delete()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('items.json'),
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.storage.delete.assert_not_called()
        self.assertListEqual(sample.items.keys(), [])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'

            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": []\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": null, \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "fields": {\n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')


class AnnotationTests(ProjectTestCase):
    def test_minimal_item(self):
        annotation = Annotation(id='annotation-1|data-1')

        self.assertEqual(annotation.dump(), {
            'accept_selectors': [],
            'container_id': None,
            'data': {
                'data-1': {
                    'attribute': 'content',
                    'extractors': {},
                    'field': None,
                    'required': False,
                },
            },
            'id': 'annotation-1',
            'post_text': None,
            'pre_text': None,
            'reject_selectors': [],
            'repeated': False,
            'required': [],
            'selection_mode': 'auto',
            'selector': None,
            'tagid': None,
            'xpath': None,
        })

    def test_full_item(self):
        annotation = Annotation(
            id='annotation-1|data-1',
            attribute='src',
            required=True,
            selection_mode='css',
            selector='img',
            accept_selectors=['img'],
            reject_selectors=['video'],
            pre_text='pre ',
            post_text=' post',
            parent=Item(id='item-1'),
            field=Field(id='field-1'))

        self.assertEqual(annotation.dump(), {
            'accept_selectors': [
                'img',
            ],
            'container_id': 'item-1',
            'data': {
                'data-1': {
                    'attribute': 'src',
                    'extractors': {},
                    'field': 'field-1',
                    'required': True,
                },
            },
            'id': 'annotation-1',
            'post_text': ' post',
            'pre_text': 'pre ',
            'reject_selectors': [
                'video',
            ],
            'repeated': False,
            'required': [],
            'selection_mode': 'css',
            'selector': 'img',
            'tagid': None,
            'xpath': None,
        })

    def test_load_through_project(self):
        project = Project(self.storage, id='example')
        annotations = (project.spiders['shop-crawler'].samples['1ddc-4043-ac4d']
                              .items['1e47-4833-a4d4'].annotations)
        self.assertListEqual(annotations.keys(),
                             ['3606-4d68-a6a0|d1e2-4673-a72a',
                              '5c18-40cf-8809|de35-49b5-b90b'])
        self.assertIsInstance(annotations, BaseAnnotation.collection)
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(annotations.dump(), [
            {
                'accept_selectors': [
                    '.main:nth-child(1) > h1',
                    '.main:nth-child(2) > h1',
                ],
                'container_id': '1e47-4833-a4d4',
                'data': {
                    'd1e2-4673-a72a': {
                        'attribute': 'content',
                        'extractors': {},
                        'field': 'fbec-4a42-a4b0',
                        'required': False,
                    },
                },
                'id': '3606-4d68-a6a0',
                'post_text': None,
                'pre_text': None,
                'reject_selectors': [],
                'repeated': False,
                'required': [],
                'selection_mode': 'auto',
                'selector': '.main > h1',
                'tagid': None,
                'xpath': None,
            },
            {
                'accept_selectors': [
                    '.main:nth-child(1) > img',
                ],
                'container_id': '1e47-4833-a4d4',
                'data': {
                    'de35-49b5-b90b': {
                        'attribute': 'content',
                        'extractors': [
                            'e6fc-4758-9e6b',
                            '154f-45ce-bfbd',
                        ],
                        'field': '34bc-406f-80bc',
                        'required': False,
                    },
                },
                'id': '5c18-40cf-8809',
                'post_text': None,
                'pre_text': None,
                'reject_selectors': [],
                'repeated': False,
                'required': [],
                'selection_mode': 'auto',
                'selector': '.main > img',
                'tagid': None,
                'xpath': None,
            },
        ])
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])

    def test_load_through_partial(self):
        annotation = Annotation(
            self.storage, id='5c18-40cf-8809|de35-49b5-b90b',
            parent=Item(
                self.storage, id='1e47-4833-a4d4',
                sample=Sample(
                    self.storage, id='1ddc-4043-ac4d',
                    spider=Spider(self.storage, id='shop-crawler'))))
        self.assertEqual(annotation.dump(), {
            'accept_selectors': [
                '.main:nth-child(1) > img',
            ],
            'container_id': '1e47-4833-a4d4',
            'data': {
                'de35-49b5-b90b': {
                    'attribute': 'content',
                    'extractors': [
                        'e6fc-4758-9e6b',
                        '154f-45ce-bfbd',
                    ],
                    'field': '34bc-406f-80bc',
                    'required': False,
                },
            },
            'id': '5c18-40cf-8809',
            'post_text': None,
            'pre_text': None,
            'reject_selectors': [],
            'repeated': False,
            'required': [],
            'selection_mode': 'auto',
            'selector': '.main > img',
            'tagid': None,
            'xpath': None,
        })
        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])

    def test_save_edit(self):
        annotation = Annotation(
            self.storage, id='3606-4d68-a6a0|d1e2-4673-a72a',
            parent=Item(
                self.storage, id='1e47-4833-a4d4',
                sample=Sample(
                    self.storage, id='1ddc-4043-ac4d',
                    spider=Spider(self.storage, id='shop-crawler'))))
        annotation.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_not_called()

        annotation.selector = '.test'
        annotation.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".test", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        annotation.id = 'test-id|data-id'
        annotation.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "data-id": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "test-id", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".test", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

    def test_save_new(self):
        item = Item(
            self.storage, id='1e47-4833-a4d4',
            sample=Sample(
                self.storage, id='1ddc-4043-ac4d',
                spider=Spider(self.storage, id='shop-crawler')))
        annotation = Annotation(self.storage, id='test1|data1', parent=item)
        annotation.save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.storage.save.assert_called_once_with(
            'spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "data1": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": null, \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "test1", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": null, \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

        item.annotations.insert(0, Annotation(self.storage, id='test2|data2'))
        item.annotations[0].save()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json'),
            mock.call('items.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "data2": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": null, \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "test2", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": null, \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > h1", \n'
            '                        ".main:nth-child(2) > h1"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "d1e2-4673-a72a": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": "fbec-4a42-a4b0", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "3606-4d68-a6a0", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > h1", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "data1": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": {}, \n'
            '                            "field": null, \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "test1", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": null, \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')

    def test_delete(self):
        project = Project(self.storage, id='example')
        project.schemas  # preload schemas
        item = Item(
            self.storage, id='1e47-4833-a4d4',
            sample=Sample(
                self.storage, id='1ddc-4043-ac4d',
                spider=Spider(self.storage, id='shop-crawler',
                              project=project)))
        annotation = item.annotations['3606-4d68-a6a0|d1e2-4673-a72a']
        annotation.delete()

        self.assertEqual(self.storage.open.call_count, 4)
        self.storage.open.assert_has_calls([
            mock.call('items.json'),
            mock.call('spiders/shop-crawler.json'),
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json')])
        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('spiders/shop-crawler/1ddc-4043-ac4d.json', mock.ANY),
            mock.call('items.json', mock.ANY)])
        self.storage.delete.assert_not_called()
        self.assertListEqual(item.annotations.keys(),
                             ['5c18-40cf-8809|de35-49b5-b90b'])
        self.assertEqual(
            self.storage.files['spiders/shop-crawler/1ddc-4043-ac4d.json'],
            '{\n'
            '    "extractors": {}, \n'
            '    "id": "1ddc-4043-ac4d", \n'
            '    "name": "example", \n'
            '    "page_id": "ab5bbf650b32ca41af6f8e9976fc3c85eee87f67", \n'
            '    "page_type": "item", \n'
            '    "plugins": {\n'
            '        "annotations-plugin": {\n'
            '            "extracts": [\n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": null, \n'
            '                    "id": "1e47-4833-a4d4#parent", \n'
            '                    "item_container": true, \n'
            '                    "repeated": false, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": "body", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "annotations": {\n'
            '                        "#portia-content": "#dummy"\n'
            '                    }, \n'
            '                    "container_id": "1e47-4833-a4d4#parent", \n'
            '                    "id": "1e47-4833-a4d4", \n'
            '                    "item_container": true, \n'
            '                    "repeated": true, \n'
            '                    "required": [], \n'
            '                    "schema_id": "1664-4f20-b657", \n'
            '                    "selector": ".main", \n'
            '                    "siblings": 0, \n'
            '                    "tagid": null, \n'
            '                    "text-content": "#portia-content"\n'
            '                }, \n'
            '                {\n'
            '                    "accept_selectors": [\n'
            '                        ".main:nth-child(1) > img"\n'
            '                    ], \n'
            '                    "container_id": "1e47-4833-a4d4", \n'
            '                    "data": {\n'
            '                        "de35-49b5-b90b": {\n'
            '                            "attribute": "content", \n'
            '                            "extractors": [\n'
            '                                "e6fc-4758-9e6b", \n'
            '                                "154f-45ce-bfbd"\n'
            '                            ], \n'
            '                            "field": "34bc-406f-80bc", \n'
            '                            "required": false\n'
            '                        }\n'
            '                    }, \n'
            '                    "id": "5c18-40cf-8809", \n'
            '                    "post_text": null, \n'
            '                    "pre_text": null, \n'
            '                    "reject_selectors": [], \n'
            '                    "required": [], \n'
            '                    "repeated": false, \n'
            '                    "selection_mode": "auto", \n'
            '                    "selector": ".main > img", \n'
            '                    "tagid": null, \n'
            '                    "xpath": null\n'
            '                }\n'
            '            ]\n'
            '        }\n'
            '    }, \n'
            '    "scrapes": "1664-4f20-b657", \n'
            '    "spider": "shop-crawler", \n'
            '    "url": "http://example.com", \n'
            '    "version": "' + SLYBOT_VERSION + '"\n'
            '}')
        self.assertEqual(
            self.storage.files['items.json'],
            '{\n'
            '    "1664-4f20-b657": {\n'
            '        "auto_created": true, \n'
            '        "fields": {\n'
            '            "cca5-490c-b604": {\n'
            '                "id": "cca5-490c-b604", \n'
            '                "name": "price", \n'
            '                "required": true, \n'
            '                "type": "price", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "34bc-406f-80bc": {\n'
            '                "id": "34bc-406f-80bc", \n'
            '                "name": "image", \n'
            '                "required": false, \n'
            '                "type": "image", \n'
            '                "vary": false\n'
            '            }, \n'
            '            "ecfc-4dbe-b488": {\n'
            '                "id": "ecfc-4dbe-b488", \n'
            '                "name": "details", \n'
            '                "required": false, \n'
            '                "type": "text", \n'
            '                "vary": false\n'
            '            }\n'
            '        }, \n'
            '        "name": "product"\n'
            '    }, \n'
            '    "fa87-4791-8642": {\n'
            '        "fields": {}, \n'
            '        "name": "other"\n'
            '    }\n'
            '}')
