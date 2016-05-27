import unittest

import mock

from slyd.orm.exceptions import PathResolutionError, ValidationError
from .models import (ExampleModel, RequiredFieldModel, SingleFileModel,
                     ManyFileModel, ParamFileModel, EnvelopeModel)
from .utils import mock_storage


class BasicModelTests(unittest.TestCase):
    def setUp(self):
        self.storage = mock_storage({
            'envelope.json':
                '{'
                '    "model-1": {'
                '        "id": "model-1",'
                '        "field": true'
                '    }'
                '}',
            'single.json':
                '{'
                '    "id": "model-1",'
                '    "field": true'
                '}',
            'many.json':
                '['
                '    {'
                '        "id": "model-1",'
                '        "field": true'
                '    },'
                '    {'
                '        "id": "model-2",'
                '        "field": false'
                '    }'
                ']',
            'param-test.json':
                '{'
                '    "id": "model-1",'
                '    "field": false,'
                '    "param": "test"'
                '}',
        })

    def test_validation(self):
        model = ExampleModel(id='model-1')
        with self.assertRaises(AttributeError):
            model.field
        try:
            model.field = True
        except ValidationError:
            self.fail("Assigning to the field attribute failed validation")
        try:
            model.field
        except AttributeError:
            self.fail("Reading the field attribute failed")
        with self.assertRaises(ValidationError):
            model.id = 1

    def test_dump(self):
        model = ExampleModel(id='model-2', field=False)

        self.assertEqual(model.dump(), {
            'id': 'model-2',
            'field': False,
        })

    def test_dumps(self):
        model = ExampleModel(id='model-2', field=False)

        # Object keys should be sorted
        self.assertEqual(
            model.dumps(),
            '{\n'
            '    "field": false, \n'
            '    "id": "model-2"\n'
            '}')

    def test_required(self):
        model = RequiredFieldModel(id='model-1')

        with self.assertRaises(ValidationError):
            model.dump()

        model.field = True
        try:
            model.dump()
        except ValidationError:
            self.fail("Dump failed validation")

    def test_load_single(self):
        model = SingleFileModel.load(self.storage)

        self.storage.open.assert_called_once_with('single.json')
        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': True,
        })

    def test_load_single_on_access(self):
        model = SingleFileModel(self.storage, id='model-1')

        self.storage.open.assert_not_called()
        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': True,
        })
        self.storage.open.assert_called_once_with('single.json')

    def test_partial_load_single(self):
        model = SingleFileModel(self.storage, id='model-1')

        self.assertEqual(model.id, 'model-1')
        self.storage.open.assert_not_called()
        self.assertEqual(model.field, True)
        self.storage.open.assert_called_once_with('single.json')
        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': True,
        })
        self.storage.open.assert_called_once_with('single.json')

    def test_load_many(self):
        models = ManyFileModel.load(self.storage)

        self.storage.open.assert_called_once_with('many.json')
        self.assertEqual(models.dump(), [
            {
                'id': 'model-1',
                'field': True,
            },
            {
                'id': 'model-2',
                'field': False,
            },
        ])

    def test_load_one_from_many(self):
        model = ManyFileModel(self.storage, id='model-1')

        self.assertEqual(model.id, 'model-1')
        self.storage.open.assert_not_called()
        self.assertEqual(model.field, True)
        self.storage.open.assert_called_once_with('many.json')
        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': True,
        })
        self.storage.open.assert_called_once_with('many.json')

    def test_load_param(self):
        model = ParamFileModel(self.storage, id='model-1', param='test')

        self.assertEqual(model.id, 'model-1')
        self.storage.open.assert_not_called()
        self.assertEqual(model.field, False)
        self.storage.open.assert_called_once_with('param-test.json')
        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': False,
            'param': 'test',
        })
        self.storage.open.assert_called_once_with('param-test.json')

    def test_load_param_skipped_if_param_missing(self):
        model = ParamFileModel(self.storage, id='model-1')

        with self.assertRaises(AttributeError):
            model.field
        self.storage.open.assert_not_called()

    def test_load_envelope(self):
        model = EnvelopeModel.load(self.storage)

        self.storage.open.assert_called_once_with('envelope.json')
        self.assertEqual(model.dump(), {
            'model-1': {
                'id': 'model-1',
                'field': True,
            },
        })

    def test_save_single(self):
        model = SingleFileModel.load(self.storage)
        model.id = 'changed-id'
        model.field = False
        model.save()

        self.storage.save.assert_called_once_with('single.json', mock.ANY)
        self.assertEqual(
            self.storage.files['single.json'],
            '{\n'
            '    "field": false, \n'
            '    "id": "changed-id"\n'
            '}')

    def test_save_single_does_not_save_if_nothing_changed(self):
        model = SingleFileModel.load(self.storage)
        model.field = True
        model.save()

        self.storage.save.assert_not_called()

    def test_partial_save_single(self):
        model = SingleFileModel(self.storage, id='model-1')
        model.id = 'changed-id'

        self.storage.open.assert_not_called()

        model.save()

        self.storage.open.assert_called_once_with('single.json')
        self.storage.save.assert_called_once_with('single.json', mock.ANY)
        self.assertEqual(
            self.storage.files['single.json'],
            '{\n'
            '    "field": true, \n'
            '    "id": "changed-id"\n'
            '}')

    def test_save_param(self):
        model = ParamFileModel(self.storage, id='model-1', param='test')
        model.field = True
        model.save()

        self.storage.save.assert_called_once_with('param-test.json', mock.ANY)
        self.assertEqual(
            self.storage.files['param-test.json'],
            '{\n'
            '    "field": true, \n'
            '    "id": "model-1", \n'
            '    "param": "test"\n'
            '}')

    def test_save_param_raises_error_if_params_missing(self):
        model = ParamFileModel(self.storage, id='model-1')
        model.field = True

        with self.assertRaises(PathResolutionError):
            model.save()
        self.storage.save.assert_not_called()

    def test_save_envelope(self):
        model = EnvelopeModel.load(self.storage)
        model.field = False
        model.save()

        self.storage.save.assert_called_once_with('envelope.json', mock.ANY)
        self.assertEqual(
            self.storage.files['envelope.json'],
            '{\n'
            '    "model-1": {\n'
            '        "field": false, \n'
            '        "id": "model-1"\n'
            '    }\n'
            '}')

    def test_save_selected_fields(self):
        model = SingleFileModel.load(self.storage)
        model.id = 'changed-id'
        model.field = False
        model.save(only=['field'])

        self.storage.save.assert_called_once_with('single.json', mock.ANY)
        self.assertEqual(
            self.storage.files['single.json'],
            '{\n'
            '    "field": false, \n'
            '    "id": "model-1"\n'
            '}')
