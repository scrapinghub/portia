from .models import (ExampleModel, ChildModel, PolymorphicChildBase,
                     PolymorphicChildModel1, PolymorphicChildModel2)
from .utils import DataStoreTestCase
from ..exceptions import ValidationError


class ModelCollectionTests(DataStoreTestCase):
    def test_create_(self):
        collection = ExampleModel.collection()

        self.assertEqual(len(collection), 0)
        self.assertListEqual(collection, [])

    def test_create_with_model(self):
        model = ExampleModel(id='model-1', field=False)
        collection = ExampleModel.collection([model])

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model])

    def test_getitem(self):
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1])

        self.assertEqual(collection[0], model1)
        self.assertEqual(collection['model-1'], model1)
        self.assertEqual(collection[model1], model1)
        self.assertEqual(collection[model1b], model1)
        with self.assertRaises(IndexError):
            collection[1]
        with self.assertRaises(KeyError):
            collection['model-2']
        with self.assertRaises(KeyError):
            collection[model2]

    def test_setitem_index(self):
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1])

        collection[0] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection[0] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_setitem_key(self):
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1])

        collection['model-1'] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection['model-1'] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_setitem_object(self):
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1])

        collection[model1] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection[model1] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_delitem_index(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        collection = ExampleModel.collection([model1, model2, model3])

        del collection[1]

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_delitem_key(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        collection = ExampleModel.collection([model1, model2, model3])

        del collection['model-2']

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_delitem_object(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        collection = ExampleModel.collection([model1, model2, model3])

        del collection[model2]

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_append(self):
        collection = ExampleModel.collection()
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)

        self.assertEqual(len(collection), 0)

        collection.append(model1)

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model1])

        collection.append(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        with self.assertRaises(ValueError):
            collection.append(model1b)

    def test_add(self):
        collection = ExampleModel.collection()
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)

        self.assertEqual(len(collection), 0)

        collection.add(model1)

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model1])

        collection.add(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        collection.add(model1b)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1b, model2])

    def test_extend(self):
        collection = ExampleModel.collection()
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)

        self.assertEqual(len(collection), 0)

        collection.extend([model1, model2])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        with self.assertRaises(ValueError):
            collection.extend([model1b])

        collection = ExampleModel.collection()
        with self.assertRaises(ValueError):
            collection.extend([model1, model2, model1b])

    def test_update(self):
        collection = ExampleModel.collection()
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)

        self.assertEqual(len(collection), 0)

        collection.update([model1, model2])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        collection.update([model2, model1b])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1b, model2])

    def test_insert(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        model4 = ExampleModel(id='model-4', field=False)
        model5 = ExampleModel(id='model-5', field=False)
        collection = ExampleModel.collection([model1, model2])

        collection.insert(1, model3)

        self.assertEqual(len(collection), 3)
        self.assertListEqual(collection, [model1, model3, model2])

        collection.insert(0, model4)

        self.assertEqual(len(collection), 4)
        self.assertListEqual(collection, [model4, model1, model3, model2])

        with self.assertRaises(TypeError):
            collection.insert('model-2', model5)

        collection.insert(1000, model5)

        self.assertEqual(len(collection), 5)
        self.assertListEqual(
            collection, [model4, model1, model3, model2, model5])

        # items in collection must be unique
        with self.assertRaises(ValueError):
            collection.insert(0, model2)

    def test_remove(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        model4 = ExampleModel(id='model-4', field=False)
        collection = ExampleModel.collection([model1, model2, model3])

        collection.remove(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        with self.assertRaises(ValueError):
            collection.remove(model4)
        with self.assertRaises(ValidationError):
            collection.remove('model-2')

    def test_discard(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        model4 = ExampleModel(id='model-4', field=False)
        collection = ExampleModel.collection([model1, model2, model3])

        collection.discard(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        collection.discard(model4)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        with self.assertRaises(ValidationError):
            collection.discard('model-2')

    def test_pop(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        model3 = ExampleModel(id='model-3', field=False)
        model4 = ExampleModel(id='model-4', field=False)
        model5 = ExampleModel(id='model-5', field=False)
        collection = ExampleModel.collection(
            [model1, model2, model3, model4, model5])

        self.assertEqual(collection.pop(), model5)
        self.assertEqual(len(collection), 4)
        self.assertListEqual(collection, [model1, model2, model3, model4])

        self.assertEqual(collection.pop(2), model3)
        self.assertEqual(len(collection), 3)
        self.assertListEqual(collection, [model1, model2, model4])

        with self.assertRaises(IndexError):
            collection.pop(1000)

        self.assertEqual(collection.pop('model-1'), model1)
        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model2, model4])

        with self.assertRaises(KeyError):
            collection.pop('model-1')

        self.assertEqual(collection.pop(model4), model4)
        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model2])

        with self.assertRaises(KeyError):
            collection.pop(model4)

    def test_get(self):
        model1 = ExampleModel(id='model-1', field=False)
        model1b = ExampleModel(id='model-1', field=True)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1])

        default = object()
        self.assertEqual(collection.get(0, default), model1)
        self.assertEqual(collection.get('model-1', default), model1)
        self.assertEqual(collection.get(model1, default), model1)
        self.assertEqual(collection.get(model1b, default), model1)
        self.assertIs(collection.get(1, default), default)
        self.assertIs(collection.get('model-2', default), default)
        self.assertIs(collection.get(model2, default), default)

    def test_clear(self):
        model1 = ExampleModel(id='model-1', field=False)
        model2 = ExampleModel(id='model-2', field=False)
        collection = ExampleModel.collection([model1, model2])

        collection.clear()

        self.assertEqual(len(collection), 0)
        self.assertListEqual(collection, [])

    def test_validation(self):
        collection = ExampleModel.collection()

        with self.assertRaises(ValidationError):
            collection.append(ChildModel(id='model-1'))
        with self.assertRaises(ValidationError):
            collection.add(ChildModel(id='model-2'))

    def test_dump(self):
        collection = ExampleModel.collection([
            ExampleModel(id='model-1', field=False),
            ExampleModel(id='model-2', field=True)
        ])

        self.assertEqual(collection.dump(), [
            {
                'id': 'model-1',
                'field': False,
            },
            {
                'id': 'model-2',
                'field': True,
            },
        ])

    def test_dumps(self):
        collection = ExampleModel.collection([
            ExampleModel(id='model-1', field=False),
            ExampleModel(id='model-3', field=False),
            ExampleModel(id='model-2', field=True)
        ])

        # Object keys should be sorted, collection should maintain order
        self.assertEqual(
            collection.dumps(),
            '[\n'
            '    {\n'
            '        "field": false, \n'
            '        "id": "model-1"\n'
            '    }, \n'
            '    {\n'
            '        "field": false, \n'
            '        "id": "model-3"\n'
            '    }, \n'
            '    {\n'
            '        "field": true, \n'
            '        "id": "model-2"\n'
            '    }\n'
            ']')


class PolymorphicCollectionTests(DataStoreTestCase):
    def test_create_(self):
        collection = PolymorphicChildBase.collection()

        self.assertEqual(len(collection), 0)
        self.assertListEqual(collection, [])

    def test_create_with_model(self):
        model = PolymorphicChildModel1(id='model-1', field1=False)
        collection = PolymorphicChildBase.collection([model])

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model])

    def test_getitem(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model2b = PolymorphicChildModel2(id='model-2', field2=True)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        collection = PolymorphicChildBase.collection([model1, model2])

        self.assertEqual(collection[0], model1)
        self.assertEqual(collection[1], model2)
        self.assertEqual(collection['model-1'], model1)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model1], model1)
        self.assertEqual(collection[model1b], model1)
        self.assertEqual(collection[model2], model2)
        self.assertEqual(collection[model2b], model2)
        with self.assertRaises(IndexError):
            collection[2]
        with self.assertRaises(KeyError):
            collection['model-3']
        with self.assertRaises(KeyError):
            collection[model3]

    def test_setitem_index(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        collection = PolymorphicChildBase.collection([model1])

        collection[0] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection[0] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_setitem_key(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        collection = PolymorphicChildBase.collection([model1])

        collection['model-1'] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection['model-1'] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_setitem_object(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        collection = PolymorphicChildBase.collection([model1])

        collection[model1] = model1b

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model1b)
        self.assertEqual(collection['model-1'], model1b)
        self.assertEqual(collection[model1], model1b)
        self.assertEqual(collection[model1b], model1b)

        collection[model1] = model2

        self.assertEqual(len(collection), 1)
        self.assertEqual(collection[0], model2)
        self.assertEqual(collection['model-2'], model2)
        self.assertEqual(collection[model2], model2)
        with self.assertRaises(KeyError):
            collection['model-1']
        with self.assertRaises(KeyError):
            collection[model1]
        with self.assertRaises(KeyError):
            collection[model1b]

    def test_delitem_index(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        collection = PolymorphicChildBase.collection([model1, model2, model3])

        del collection[1]

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_delitem_key(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        collection = PolymorphicChildBase.collection([model1, model2, model3])

        del collection['model-2']

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_delitem_object(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        collection = PolymorphicChildBase.collection([model1, model2, model3])

        del collection[model2]

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

    def test_append(self):
        collection = PolymorphicChildBase.collection()
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)

        self.assertEqual(len(collection), 0)

        collection.append(model1)

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model1])

        collection.append(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        with self.assertRaises(ValueError):
            collection.append(model1b)

    def test_add(self):
        collection = PolymorphicChildBase.collection()
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)

        self.assertEqual(len(collection), 0)

        collection.add(model1)

        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model1])

        collection.add(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        collection.add(model1b)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1b, model2])

    def test_extend(self):
        collection = PolymorphicChildBase.collection()
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)

        self.assertEqual(len(collection), 0)

        collection.extend([model1, model2])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        with self.assertRaises(ValueError):
            collection.extend([model1b])

        collection = PolymorphicChildBase.collection()
        with self.assertRaises(ValueError):
            collection.extend([model1, model2, model1b])

    def test_update(self):
        collection = PolymorphicChildBase.collection()
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)

        self.assertEqual(len(collection), 0)

        collection.update([model1, model2])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model2])

        collection.update([model2, model1b])

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1b, model2])

    def test_insert(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        model4 = PolymorphicChildModel2(id='model-4', field2=False)
        model5 = PolymorphicChildModel1(id='model-5', field1=False)
        collection = PolymorphicChildBase.collection([model1, model2])

        collection.insert(1, model3)

        self.assertEqual(len(collection), 3)
        self.assertListEqual(collection, [model1, model3, model2])

        collection.insert(0, model4)

        self.assertEqual(len(collection), 4)
        self.assertListEqual(collection, [model4, model1, model3, model2])

        with self.assertRaises(TypeError):
            collection.insert('model-2', model5)

        collection.insert(1000, model5)

        self.assertEqual(len(collection), 5)
        self.assertListEqual(
            collection, [model4, model1, model3, model2, model5])

        # items in collection must be unique
        with self.assertRaises(ValueError):
            collection.insert(0, model2)

    def test_remove(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        model4 = PolymorphicChildModel2(id='model-4', field2=False)
        collection = PolymorphicChildBase.collection([model1, model2, model3])

        collection.remove(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        with self.assertRaises(ValueError):
            collection.remove(model4)
        with self.assertRaises(ValidationError):
            collection.remove('model-2')

    def test_discard(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        model4 = PolymorphicChildModel2(id='model-4', field2=False)
        collection = PolymorphicChildBase.collection([model1, model2, model3])

        collection.discard(model2)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        collection.discard(model4)

        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model1, model3])

        with self.assertRaises(ValidationError):
            collection.discard('model-2')

    def test_pop(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        model3 = PolymorphicChildModel1(id='model-3', field1=False)
        model4 = PolymorphicChildModel2(id='model-4', field2=False)
        model5 = PolymorphicChildModel1(id='model-5', field1=False)
        collection = PolymorphicChildBase.collection(
            [model1, model2, model3, model4, model5])

        self.assertEqual(collection.pop(), model5)
        self.assertEqual(len(collection), 4)
        self.assertListEqual(collection, [model1, model2, model3, model4])

        self.assertEqual(collection.pop(2), model3)
        self.assertEqual(len(collection), 3)
        self.assertListEqual(collection, [model1, model2, model4])

        with self.assertRaises(IndexError):
            collection.pop(1000)

        self.assertEqual(collection.pop('model-1'), model1)
        self.assertEqual(len(collection), 2)
        self.assertListEqual(collection, [model2, model4])

        with self.assertRaises(KeyError):
            collection.pop('model-1')

        self.assertEqual(collection.pop(model4), model4)
        self.assertEqual(len(collection), 1)
        self.assertListEqual(collection, [model2])

        with self.assertRaises(KeyError):
            collection.pop(model4)

    def test_get(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model1b = PolymorphicChildModel1(id='model-1', field1=True)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        collection = PolymorphicChildBase.collection([model1])

        default = object()
        self.assertEqual(collection.get(0, default), model1)
        self.assertEqual(collection.get('model-1', default), model1)
        self.assertEqual(collection.get(model1, default), model1)
        self.assertEqual(collection.get(model1b, default), model1)
        self.assertIs(collection.get(1, default), default)
        self.assertIs(collection.get('model-2', default), default)
        self.assertIs(collection.get(model2, default), default)

    def test_clear(self):
        model1 = PolymorphicChildModel1(id='model-1', field1=False)
        model2 = PolymorphicChildModel2(id='model-2', field2=False)
        collection = PolymorphicChildBase.collection([model1, model2])

        collection.clear()

        self.assertEqual(len(collection), 0)
        self.assertListEqual(collection, [])

    def test_validation(self):
        collection = PolymorphicChildBase.collection()

        with self.assertRaises(ValidationError):
            collection.append(ChildModel(id='model-1'))
        with self.assertRaises(ValidationError):
            collection.add(ChildModel(id='model-2'))

    def test_dump(self):
        collection = PolymorphicChildBase.collection([
            PolymorphicChildModel1(id='model-1', field1=False),
            PolymorphicChildModel2(id='model-2', field2=True),
        ])

        self.assertEqual(collection.dump(), [
            {
                'type': 'PolymorphicChildModel1',
                'id': 'model-1',
                'field1': False,
                'parent': None,
            },
            {
                '_type_': 'PolymorphicChildModel2',
                'id': 'model-2',
                'field2': True,
                'parent': None,
            },
        ])

    def test_dumps(self):
        collection = PolymorphicChildBase.collection([
            PolymorphicChildModel1(id='model-1', field1=False),
            PolymorphicChildModel2(id='model-3', field2=False),
            PolymorphicChildModel1(id='model-2', field1=True),
        ])

        # Object keys should be sorted, collection should maintain order
        self.assertEqual(
            collection.dumps(),
            '[\n'
            '    {\n'
            '        "field1": false, \n'
            '        "id": "model-1", \n'
            '        "parent": null, \n'
            '        "type": "PolymorphicChildModel1"\n'
            '    }, \n'
            '    {\n'
            '        "_type_": "PolymorphicChildModel2", \n'
            '        "field2": false, \n'
            '        "id": "model-3", \n'
            '        "parent": null\n'
            '    }, \n'
            '    {\n'
            '        "field1": true, \n'
            '        "id": "model-2", \n'
            '        "parent": null, \n'
            '        "type": "PolymorphicChildModel1"\n'
            '    }\n'
            ']')
