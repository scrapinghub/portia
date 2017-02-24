import mock

from .models import (OneToOneModel1, OneToOneModel2, ParentModel, ChildModel,
                     ManyToManyModel1, ManyToManyModel2, PolymorphicParentModel,
                     PolymorphicChildModel1, PolymorphicChildModel2)
from .utils import DataStoreTestCase, mock_storage


class OneToOneRelationshipTests(DataStoreTestCase):
    def setUp(self):
        super(OneToOneRelationshipTests, self).setUp()
        self.storage = mock_storage({
            'o2o-model-1.json':
                '{'
                '    "id": "model-1",'
                '    "field": "model-1",'
                '    "m2": "model-2"'
                '}',
            'o2o-model-2.json':
                '{'
                '    "id": "model-2",'
                '    "field": "model-2",'
                '    "m1": {'
                '        "id": "model-1",'
                '        "field": "model-1",'
                '        "m2": "model-2"'
                '    }'
                '}',
        })

    def test_no_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2')

        self.assertEqual(model1.m2, None)
        self.assertEqual(model2.m1, None)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': None,
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': None,
        })

    def test_set_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2')
        model2.m1 = model1

        self.assertEqual(model1.m2, model2)
        self.assertEqual(model2.m1, model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': 'model-2',
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-1',
                'm2': 'model-2',
            },
        })

    def test_set_reverse_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2')
        model1.m2 = model2

        self.assertEqual(model1.m2, model2)
        self.assertEqual(model2.m1, model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': 'model-2',
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-1',
                'm2': 'model-2',
            },
        })

    def test_create_with_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2', m1=model1)

        self.assertEqual(model1.m2, model2)
        self.assertEqual(model2.m1, model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': 'model-2',
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-1',
                'm2': 'model-2',
            },
        })

    def test_create_with_reverse_relation(self):
        model2 = OneToOneModel2(id='model-2')
        model1 = OneToOneModel1(id='model-1', m2=model2)

        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': 'model-2',
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-1',
                'm2': 'model-2',
            },
        })

    def test_change_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2', m1=model1)
        model3 = OneToOneModel1(id='model-3')

        self.assertEqual(model1.m2, model2)
        self.assertEqual(model2.m1, model1)
        self.assertEqual(model3.m2, None)

        model2.m1 = model3

        self.assertEqual(model1.m2, None)
        self.assertEqual(model2.m1, model3)
        self.assertEqual(model3.m2, model2)
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-3',
                'm2': 'model-2',
            },
        })

    def test_change_reverse_relation(self):
        model1 = OneToOneModel1(id='model-1')
        model2 = OneToOneModel2(id='model-2', m1=model1)
        model3 = OneToOneModel1(id='model-3')

        self.assertEqual(model1.m2, model2)
        self.assertEqual(model2.m1, model1)
        self.assertEqual(model3.m2, None)

        model3.m2 = model2

        self.assertEqual(model1.m2, None)
        self.assertEqual(model2.m1, model3)
        self.assertEqual(model3.m2, model2)
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': {
                'id': 'model-3',
                'm2': 'model-2',
            },
        })

    def test_load_full(self):
        model = OneToOneModel2(self.storage, id='model-2')

        self.assertEqual(model.dump(), {
            'id': 'model-2',
            'field': 'model-2',
            'm1': {
                'id': 'model-1',
                'field': 'model-1',
                'm2': 'model-2',
            },
        })
        self.storage.open.assert_called_once_with('o2o-model-2.json')

    def test_load_partial(self):
        model = OneToOneModel1(self.storage, id='model-1')

        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': 'model-1',
            'm2': 'model-2',
        })
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('o2o-model-1.json'),
            mock.call('o2o-model-2.json')])

    def test_save_field(self):
        model1 = OneToOneModel1(self.storage, id='model-1')
        model2 = model1.m2
        model1.field = 'changed-field-1'
        model2.field = 'changed-field-2'
        model2.save()

        self.assertEqual(self.storage.save.call_count, 1)
        self.storage.save.assert_has_calls([
            mock.call('o2o-model-2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['o2o-model-2.json'],
            '{\n'
            '    "field": "changed-field-2", \n'
            '    "id": "model-2", \n'
            '    "m1": {\n'
            '        "field": "model-1", \n'
            '        "id": "model-1", \n'
            '        "m2": "model-2"\n'
            '    }\n'
            '}')

        model1.save()

        self.assertEqual(self.storage.save.call_count, 3)
        self.storage.save.assert_has_calls([
            mock.call('o2o-model-2.json', mock.ANY),
            mock.call('o2o-model-1.json', mock.ANY),
            mock.call('o2o-model-2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['o2o-model-1.json'],
            '{\n'
            '    "field": "changed-field-1", \n'
            '    "id": "model-1", \n'
            '    "m2": "model-2"\n'
            '}')
        self.assertEqual(
            self.storage.files['o2o-model-2.json'],
            '{\n'
            '    "field": "changed-field-2", \n'
            '    "id": "model-2", \n'
            '    "m1": {\n'
            '        "field": "changed-field-1", \n'
            '        "id": "model-1", \n'
            '        "m2": "model-2"\n'
            '    }\n'
            '}')

    def test_save_id(self):
        model1 = OneToOneModel1(self.storage, id='model-1')
        model2 = model1.m2
        model1.id = 'changed-id-1'
        model2.id = 'changed-id-2'
        model2.save()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('o2o-model-2.json', mock.ANY),
            mock.call('o2o-model-1.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['o2o-model-1.json'],
            '{\n'
            '    "field": "model-1", \n'
            '    "id": "model-1", \n'
            '    "m2": "changed-id-2"\n'
            '}')
        self.assertEqual(
            self.storage.files['o2o-model-2.json'],
            '{\n'
            '    "field": "model-2", \n'
            '    "id": "changed-id-2", \n'
            '    "m1": {\n'
            '        "field": "model-1", \n'
            '        "id": "model-1", \n'
            '        "m2": "changed-id-2"\n'
            '    }\n'
            '}')

        model1.save()

        self.assertEqual(self.storage.save.call_count, 4)
        self.storage.save.assert_has_calls([
            mock.call('o2o-model-2.json', mock.ANY),
            mock.call('o2o-model-1.json', mock.ANY),
            mock.call('o2o-model-1.json', mock.ANY),
            mock.call('o2o-model-2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['o2o-model-1.json'],
            '{\n'
            '    "field": "model-1", \n'
            '    "id": "changed-id-1", \n'
            '    "m2": "changed-id-2"\n'
            '}')
        self.assertEqual(
            self.storage.files['o2o-model-2.json'],
            '{\n'
            '    "field": "model-2", \n'
            '    "id": "changed-id-2", \n'
            '    "m1": {\n'
            '        "field": "model-1", \n'
            '        "id": "changed-id-1", \n'
            '        "m2": "changed-id-2"\n'
            '    }\n'
            '}')


class OneToManyRelationshipTests(DataStoreTestCase):
    def setUp(self):
        super(OneToManyRelationshipTests, self).setUp()
        self.storage = mock_storage({
            'parents.json':
                '{'
                '    "id": "parent-1",'
                '    "field": "parent-1",'
                '    "children": ['
                '        {'
                '            "id": "child-1",'
                '            "parent": "parent-1"'
                '        }'
                '    ]'
                '}',
            'parent-1/children.json':
                '['
                '    {'
                '        "id": "child-1",'
                '        "field": "child-1",'
                '        "parent": "parent-1"'
                '    }'
                ']',
        })

    def test_no_children(self):
        parent = ParentModel(id='parent-1')

        self.assertEqual(len(parent.children), 0)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [],
        })

    def test_set_children(self):
        parent = ParentModel(id='parent-1')
        child = ChildModel(id='child-1')
        parent.children = [child]

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_add_to_children(self):
        parent = ParentModel(id='parent-1')
        child = ChildModel(id='child-1')
        parent.children.add(child)

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_set_parent(self):
        parent = ParentModel(id='parent-1')
        child = ChildModel(id='child-1')
        child.parent = parent

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_create_with_children(self):
        child = ChildModel(id='child-1')
        parent = ParentModel(id='parent-1', children=[child])

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_create_with_parent(self):
        parent = ParentModel(id='parent-1')
        child = ChildModel(id='child-1', parent=parent)

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_change_parent(self):
        parent = ParentModel(id='parent-1')
        parent2 = ParentModel(id='parent-2')
        child = ChildModel(id='child-1', parent=parent)

        self.assertEqual(child.parent, parent)
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(len(parent2.children), 0)

        child.parent = parent2

        self.assertEqual(child.parent, parent2)
        self.assertEqual(len(parent.children), 0)
        self.assertEqual(len(parent2.children), 1)
        self.assertEqual(parent2.children[0], child)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [],
        })
        self.assertEqual(parent2.dump(), {
            'id': 'parent-2',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-2',
                },
            ],
        })

    def test_change_children(self):
        parent = ParentModel(id='parent-1')
        child = ChildModel(id='child-1', parent=parent)
        child2 = ChildModel(id='child-2')

        self.assertEqual(child.parent, parent)
        self.assertEqual(child2.parent, None)
        self.assertEqual(len(parent.children), 1)

        parent.children = [child, child2]

        self.assertEqual(child.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'parent': 'parent-1',
                },
                {
                    'id': 'child-2',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_getitem(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        self.assertIs(parent.children[0], child1)
        self.assertIs(parent.children['child-1'], child1)
        self.assertIs(parent.children[child1], child1)
        with self.assertRaises(IndexError):
            parent.children[1000]
        with self.assertRaises(KeyError):
            parent.children['child-4']
        self.assertEqual(parent.children[1:], [child2, child3])

    def test_get(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        self.assertIs(parent.children.get(0), child1)
        self.assertIs(parent.children.get('child-1'), child1)
        self.assertIs(parent.children.get(child1), child1)
        self.assertIs(parent.children.get('child-4'), None)
        sentinel = object()
        self.assertIs(parent.children.get('child-4', default=sentinel), sentinel)

    def test_setitem(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])
        child1b = ChildModel(id='child-1')
        child1c = ChildModel(id='child-1')
        child1d = ChildModel(id='child-1')
        child4 = ChildModel(id='child-4')
        child5 = ChildModel(id='child-5')
        child6 = ChildModel(id='child-6')
        child7 = ChildModel(id='child-7')

        parent.children[0] = child1b
        self.assertIs(parent.children[0], child1b)

        parent.children['child-1'] = child1c
        self.assertIs(parent.children[0], child1c)

        parent.children[child1] = child1d
        self.assertIs(parent.children[0], child1d)
        self.assertListEqual(parent.children, [child1d, child2, child3])

        parent.children[1:1] = [child4, child5]
        self.assertIs(child4.parent, parent)
        self.assertIs(child5.parent, parent)
        self.assertListEqual(parent.children,
                             [child1d, child4, child5, child2, child3])

        parent.children[:2] = [child6, child7]
        self.assertIs(child6.parent, parent)
        self.assertIs(child7.parent, parent)
        self.assertIs(child1d.parent, None)
        self.assertIs(child4.parent, None)
        self.assertListEqual(parent.children,
                             [child6, child7, child5, child2, child3])

        with self.assertRaises(ValueError):
            parent.children[0:0] = [child2]

    def test_delitem(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        child4 = ChildModel(id='child-4')
        child5 = ChildModel(id='child-5')
        parent = ParentModel(id='parent-1', children=[
            child1, child2, child3, child4, child5])

        del parent.children[0]
        del parent.children['child-3']
        del parent.children[child4]

        self.assertListEqual(parent.children, [child2, child5])
        self.assertIs(child1.parent, None)
        self.assertIs(child3.parent, None)
        self.assertIs(child4.parent, None)

    def test_append(self):
        child1 = ChildModel(id='child-1')
        child1b = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2])

        parent.children.append(child3)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child3.parent, parent)

        with self.assertRaises(ValueError):
            parent.children.append(child1b)

    def test_add(self):
        child1 = ChildModel(id='child-1')
        child1b = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2])

        parent.children.add(child3)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child3.parent, parent)

        parent.children.add(child1b)
        self.assertListEqual(parent.children, [child1, child2, child3])

    def test_insert(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child2, child3])

        parent.children.insert(0, child1)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child1.parent, parent)

    def test_remove(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        parent.children.remove(child1)

        self.assertListEqual(parent.children, [child2, child3])
        self.assertIs(child1.parent, None)

        with self.assertRaises(ValueError):
            parent.children.remove(child1)

    def test_discard(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        parent.children.discard(child1)

        self.assertListEqual(parent.children, [child2, child3])
        self.assertIs(child1.parent, None)

        parent.children.discard(child1)
        self.assertListEqual(parent.children, [child2, child3])

    def test_pop(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        pop1 = parent.children.pop()

        self.assertIs(pop1, child3)
        self.assertListEqual(parent.children, [child1, child2])
        self.assertIs(child3.parent, None)

        pop2 = parent.children.pop('child-1')

        self.assertIs(pop2, child1)
        self.assertListEqual(parent.children, [child2])
        self.assertIs(child1.parent, None)

    def test_clear(self):
        child1 = ChildModel(id='child-1')
        child2 = ChildModel(id='child-2')
        child3 = ChildModel(id='child-3')
        parent = ParentModel(id='parent-1', children=[child1, child2, child3])

        parent.children.clear()

        self.assertListEqual(parent.children, [])
        self.assertIs(child1.parent, None)
        self.assertIs(child2.parent, None)
        self.assertIs(child3.parent, None)

    def test_load_full(self):
        model = ParentModel(self.storage, id='parent-1')

        self.assertEqual(model.dump(), {
            'id': 'parent-1',
            'field': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'field': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('parents.json'),
            mock.call('parent-1/children.json')])

    def test_load_partial(self):
        model = ChildModel(self.storage, id='child-1',
                           parent=ParentModel(self.storage, id='parent-1'))

        self.assertEqual(model.dump(), {
            'id': 'child-1',
            'field': 'child-1',
            'parent': 'parent-1',
        })
        self.assertEqual(model, model.parent.children[0])
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('parents.json'),
            mock.call('parent-1/children.json')])
        self.assertEqual(model.parent.dump(), {
            'id': 'parent-1',
            'field': 'parent-1',
            'children': [
                {
                    'id': 'child-1',
                    'field': 'child-1',
                    'parent': 'parent-1',
                },
            ],
        })

    def test_save_field(self):
        parent = ParentModel(self.storage, id='parent-1')
        child = parent.children[0]

        child.field = 'changed-id-1'
        parent.field = 'changed-id-2'
        parent.save()

        self.assertEqual(self.storage.save.call_count, 1)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "field": "child-1", \n'
            '            "id": "child-1", \n'
            '            "parent": "parent-1"\n'
            '        }\n'
            '    ], \n'
            '    "field": "changed-id-2", \n'
            '    "id": "parent-1"\n'
            '}')

        child.save()

        self.assertEqual(self.storage.save.call_count, 3)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('parent-1/children.json', mock.ANY),
            mock.call('parents.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['parent-1/children.json'],
            '[\n'
            '    {\n'
            '        "field": "changed-id-1", \n'
            '        "id": "child-1", \n'
            '        "parent": "parent-1"\n'
            '    }\n'
            ']')
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "field": "changed-id-1", \n'
            '            "id": "child-1", \n'
            '            "parent": "parent-1"\n'
            '        }\n'
            '    ], \n'
            '    "field": "changed-id-2", \n'
            '    "id": "parent-1"\n'
            '}')

    def test_save_id(self):
        parent = ParentModel(self.storage, id='parent-1')
        child = parent.children[0]

        child.id = 'changed-id-1'
        parent.id = 'changed-id-2'
        parent.save()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('changed-id-2/children.json', mock.ANY)])
        self.storage.delete.assert_called_once_with('parent-1/children.json')
        self.assertEqual(
            self.storage.files['changed-id-2/children.json'],
            '[\n'
            '    {\n'
            '        "field": "child-1", \n'
            '        "id": "child-1", \n'
            '        "parent": "changed-id-2"\n'
            '    }\n'
            ']')
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "field": "child-1", \n'
            '            "id": "child-1", \n'
            '            "parent": "changed-id-2"\n'
            '        }\n'
            '    ], \n'
            '    "field": "parent-1", \n'
            '    "id": "changed-id-2"\n'
            '}')

        child.save()

        self.assertEqual(self.storage.save.call_count, 4)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('changed-id-2/children.json', mock.ANY),
            mock.call('changed-id-2/children.json', mock.ANY),
            mock.call('parents.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['changed-id-2/children.json'],
            '[\n'
            '    {\n'
            '        "field": "child-1", \n'
            '        "id": "changed-id-1", \n'
            '        "parent": "changed-id-2"\n'
            '    }\n'
            ']')
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "field": "child-1", \n'
            '            "id": "changed-id-1", \n'
            '            "parent": "changed-id-2"\n'
            '        }\n'
            '    ], \n'
            '    "field": "parent-1", \n'
            '    "id": "changed-id-2"\n'
            '}')


class ManyToManyRelationshipTests(DataStoreTestCase):
    def setUp(self):
        super(ManyToManyRelationshipTests, self).setUp()
        self.storage = mock_storage({
            'm2m-model-1.json':
                '{'
                '    "id": "model-1",'
                '    "field": "model-1",'
                '    "m2": ['
                '        "model-2"'
                '    ]'
                '}',
            'm2m-model-2.json':
                '['
                '    {'
                '        "id": "model-2",'
                '        "field": "model-2",'
                '        "m1": ['
                '            {'
                '                "id": "model-1",'
                '                "field": "model-1",'
                '                "m2": ['
                '                    "model-2"'
                '                ]'
                '            }'
                '        ]'
                '    }'
                ']',
        })

    def test_no_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2')

        self.assertEqual(len(model1.m2), 0)
        self.assertEqual(len(model2.m1), 0)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [],
        })

    def test_set_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2')
        model2.m1.append(model1)

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })

    def test_set_reverse_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2')
        model1.m2.append(model2)

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })

    def test_create_with_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2', m1=[model1])

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })

    def test_create_with_reverse_relation(self):
        model2 = ManyToManyModel2(id='model-2')
        model1 = ManyToManyModel1(id='model-1', m2=[model2])

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })

    def test_change_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2', m1=[model1])
        model3 = ManyToManyModel1(id='model-3')

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(len(model3.m2), 0)

        model2.m1.append(model3)

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 2)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model2.m1[1], model3)
        self.assertEqual(len(model3.m2), 1)
        self.assertEqual(model3.m2[0], model2)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
                {
                    'id': 'model-3',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })
        self.assertEqual(model3.dump(), {
            'id': 'model-3',
            'm2': [
                'model-2',
            ],
        })

        model2.m1.remove(model1)

        self.assertEqual(len(model1.m2), 0)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model3)
        self.assertEqual(len(model3.m2), 1)
        self.assertEqual(model3.m2[0], model2)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-3',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })
        self.assertEqual(model3.dump(), {
            'id': 'model-3',
            'm2': [
                'model-2',
            ],
        })

    def test_change_reverse_relation(self):
        model1 = ManyToManyModel1(id='model-1')
        model2 = ManyToManyModel2(id='model-2', m1=[model1])
        model3 = ManyToManyModel1(id='model-3')

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(len(model3.m2), 0)

        model3.m2.append(model2)

        self.assertEqual(len(model1.m2), 1)
        self.assertEqual(model1.m2[0], model2)
        self.assertEqual(len(model2.m1), 2)
        self.assertEqual(model2.m1[0], model1)
        self.assertEqual(model2.m1[1], model3)
        self.assertEqual(len(model3.m2), 1)
        self.assertEqual(model3.m2[0], model2)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
                {
                    'id': 'model-3',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })
        self.assertEqual(model3.dump(), {
            'id': 'model-3',
            'm2': [
                'model-2',
            ],
        })

        model1.m2.clear()

        self.assertEqual(len(model1.m2), 0)
        self.assertEqual(len(model2.m1), 1)
        self.assertEqual(model2.m1[0], model3)
        self.assertEqual(len(model3.m2), 1)
        self.assertEqual(model3.m2[0], model2)
        self.assertEqual(model1.dump(), {
            'id': 'model-1',
            'm2': [],
        })
        self.assertEqual(model2.dump(), {
            'id': 'model-2',
            'm1': [
                {
                    'id': 'model-3',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })
        self.assertEqual(model3.dump(), {
            'id': 'model-3',
            'm2': [
                'model-2',
            ],
        })

    def test_load_full(self):
        model = ManyToManyModel2(self.storage, id='model-2')

        self.assertEqual(model.dump(), {
            'id': 'model-2',
            'field': 'model-2',
            'm1': [
                {
                    'id': 'model-1',
                    'field': 'model-1',
                    'm2': [
                        'model-2',
                    ],
                },
            ],
        })
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('m2m-model-2.json'),
            mock.call('m2m-model-1.json')])

    def test_load_partial(self):
        model = ManyToManyModel1(self.storage, id='model-1')

        self.assertEqual(model.dump(), {
            'id': 'model-1',
            'field': 'model-1',
            'm2': [
                'model-2',
            ],
        })
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('m2m-model-1.json'),
            mock.call('m2m-model-2.json')])

    def test_save_field(self):
        model1 = ManyToManyModel1(self.storage, id='model-1')
        model2 = model1.m2[0]
        model1.field = 'changed-field-1'
        model2.field = 'changed-field-2'
        model2.save()

        self.storage.save.assert_called_once_with('m2m-model-2.json', mock.ANY)
        self.assertEqual(
            self.storage.files['m2m-model-2.json'],
            '[\n'
            '    {\n'
            '        "field": "changed-field-2", \n'
            '        "id": "model-2", \n'
            '        "m1": [\n'
            '            {\n'
            '                "field": "model-1", \n'
            '                "id": "model-1", \n'
            '                "m2": [\n'
            '                    "model-2"\n'
            '                ]\n'
            '            }\n'
            '        ]\n'
            '    }\n'
            ']')

        model1.save()

        self.assertEqual(self.storage.save.call_count, 3)
        self.storage.save.assert_has_calls([
            mock.call('m2m-model-2.json', mock.ANY),
            mock.call('m2m-model-1.json', mock.ANY),
            mock.call('m2m-model-2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['m2m-model-1.json'],
            '{\n'
            '    "field": "changed-field-1", \n'
            '    "id": "model-1", \n'
            '    "m2": [\n'
            '        "model-2"\n'
            '    ]\n'
            '}')
        self.assertEqual(
            self.storage.files['m2m-model-2.json'],
            '[\n'
            '    {\n'
            '        "field": "changed-field-2", \n'
            '        "id": "model-2", \n'
            '        "m1": [\n'
            '            {\n'
            '                "field": "changed-field-1", \n'
            '                "id": "model-1", \n'
            '                "m2": [\n'
            '                    "model-2"\n'
            '                ]\n'
            '            }\n'
            '        ]\n'
            '    }\n'
            ']')

    def test_save_id(self):
        model1 = ManyToManyModel1(self.storage, id='model-1')
        model2 = model1.m2[0]
        model1.id = 'changed-id-1'
        model2.id = 'changed-id-2'
        model2.save()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('m2m-model-2.json', mock.ANY),
            mock.call('m2m-model-1.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['m2m-model-1.json'],
            '{\n'
            '    "field": "model-1", \n'
            '    "id": "model-1", \n'
            '    "m2": [\n'
            '        "changed-id-2"\n'
            '    ]\n'
            '}')
        self.assertEqual(
            self.storage.files['m2m-model-2.json'],
            '[\n'
            '    {\n'
            '        "field": "model-2", \n'
            '        "id": "changed-id-2", \n'
            '        "m1": [\n'
            '            {\n'
            '                "field": "model-1", \n'
            '                "id": "model-1", \n'
            '                "m2": [\n'
            '                    "changed-id-2"\n'
            '                ]\n'
            '            }\n'
            '        ]\n'
            '    }\n'
            ']')

        model1.save()

        self.assertEqual(self.storage.save.call_count, 4)
        self.storage.save.assert_has_calls([
            mock.call('m2m-model-2.json', mock.ANY),
            mock.call('m2m-model-1.json', mock.ANY),
            mock.call('m2m-model-1.json', mock.ANY),
            mock.call('m2m-model-2.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['m2m-model-1.json'],
            '{\n'
            '    "field": "model-1", \n'
            '    "id": "changed-id-1", \n'
            '    "m2": [\n'
            '        "changed-id-2"\n'
            '    ]\n'
            '}')
        self.assertEqual(
            self.storage.files['m2m-model-2.json'],
            '[\n'
            '    {\n'
            '        "field": "model-2", \n'
            '        "id": "changed-id-2", \n'
            '        "m1": [\n'
            '            {\n'
            '                "field": "model-1", \n'
            '                "id": "changed-id-1", \n'
            '                "m2": [\n'
            '                    "changed-id-2"\n'
            '                ]\n'
            '            }\n'
            '        ]\n'
            '    }\n'
            ']')


class PolymorphicRelationshipTests(DataStoreTestCase):
    def setUp(self):
        super(PolymorphicRelationshipTests, self).setUp()
        self.storage = mock_storage({
            'parents.json':
                '{'
                '    "id": "parent-1",'
                '    "field": "parent-1",'
                '    "children": ['
                '        {'
                '            "type": "PolymorphicChildModel1",'
                '            "id": "child-1"'
                '        },'
                '        {'
                '            "_type_": "PolymorphicChildModel2",'
                '            "id": "child-2"'
                '        }'
                '    ]'
                '}',
            'children.json':
                '['
                '    {'
                '        "type": "PolymorphicChildModel1",'
                '        "id": "child-1",'
                '        "field1": "child-1",'
                '        "parent": "parent-1"'
                '    },'
                '    {'
                '        "_type_": "PolymorphicChildModel2",'
                '        "id": "child-2",'
                '        "field2": "child-2",'
                '        "parent": "parent-1"'
                '    }'
                ']',
        })

    def test_no_children(self):
        parent = PolymorphicParentModel(id='parent-1')

        self.assertEqual(len(parent.children), 0)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [],
        })

    def test_set_children(self):
        parent = PolymorphicParentModel(id='parent-1')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1')
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2')
        parent.children = [child1, child2]

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.children[0], child1)
        self.assertEqual(parent.children[1], child2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_add_to_children(self):
        parent = PolymorphicParentModel(id='parent-1')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1')
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2')
        parent.children.add(child2)
        parent.children.add(child1)

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.children[0], child2)
        self.assertEqual(parent.children[1], child1)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
            ],
        })

    def test_set_parent(self):
        parent = PolymorphicParentModel(id='parent-1')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1')
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2')
        child1.parent = parent
        child2.parent = parent

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.children[0], child1)
        self.assertEqual(parent.children[1], child2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_create_with_children(self):
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1')
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2')
        parent = PolymorphicParentModel(id='parent-1',
                                        children=[child1, child2])

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.children[0], child1)
        self.assertEqual(parent.children[1], child2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_create_with_parent(self):
        parent = PolymorphicParentModel(id='parent-1')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1',
                                        parent=parent)
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2',
                                        parent=parent)

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.children[0], child1)
        self.assertEqual(parent.children[1], child2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_change_parent(self):
        parent1 = PolymorphicParentModel(id='parent-1')
        parent2 = PolymorphicParentModel(id='parent-2')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1',
                                        parent=parent1)
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2',
                                        parent=parent1)

        self.assertEqual(child1.parent, parent1)
        self.assertEqual(child2.parent, parent1)
        self.assertEqual(len(parent1.children), 2)
        self.assertEqual(len(parent2.children), 0)

        child2.parent = parent2

        self.assertEqual(child1.parent, parent1)
        self.assertEqual(child2.parent, parent2)
        self.assertEqual(len(parent1.children), 1)
        self.assertEqual(len(parent2.children), 1)
        self.assertEqual(parent1.children[0], child1)
        self.assertEqual(parent2.children[0], child2)
        self.assertEqual(parent1.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
            ],
        })
        self.assertEqual(parent2.dump(), {
            'id': 'parent-2',
            'children': [
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

        child1.parent = parent2

        self.assertEqual(child1.parent, parent2)
        self.assertEqual(child2.parent, parent2)
        self.assertEqual(len(parent1.children), 0)
        self.assertEqual(len(parent2.children), 2)
        self.assertEqual(parent2.children[0], child2)
        self.assertEqual(parent2.children[1], child1)
        self.assertEqual(parent1.dump(), {
            'id': 'parent-1',
            'children': [],
        })
        self.assertEqual(parent2.dump(), {
            'id': 'parent-2',
            'children': [
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
            ],
        })

    def test_change_children(self):
        parent = PolymorphicParentModel(id='parent-1')
        child1 = PolymorphicChildModel1(id='child-1', field1='field-1',
                                        parent=parent)
        child2 = PolymorphicChildModel2(id='child-2', field2='field-2')

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, None)
        self.assertEqual(len(parent.children), 1)

        parent.children = [child1, child2]

        self.assertEqual(child1.parent, parent)
        self.assertEqual(child2.parent, parent)
        self.assertEqual(len(parent.children), 2)
        self.assertEqual(parent.dump(), {
            'id': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_getitem(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel2(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        self.assertIs(parent.children[0], child1)
        self.assertIs(parent.children['child-1'], child1)
        self.assertIs(parent.children[child1], child1)
        self.assertIs(parent.children[1], child2)
        self.assertIs(parent.children['child-2'], child2)
        self.assertIs(parent.children[child2], child2)
        with self.assertRaises(IndexError):
            parent.children[1000]
        with self.assertRaises(KeyError):
            parent.children['child-4']
        self.assertEqual(parent.children[2:], [child3])

    def test_get(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel2(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        self.assertIs(parent.children.get(0), child1)
        self.assertIs(parent.children.get('child-1'), child1)
        self.assertIs(parent.children.get(child1), child1)
        self.assertIs(parent.children.get(1), child2)
        self.assertIs(parent.children.get('child-2'), child2)
        self.assertIs(parent.children.get(child2), child2)
        self.assertIs(parent.children.get('child-4'), None)
        sentinel = object()
        self.assertIs(parent.children.get('child-4', default=sentinel), sentinel)

    def test_setitem(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel2(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])
        child1b = PolymorphicChildModel1(id='child-1')
        child1c = PolymorphicChildModel1(id='child-1')
        child1d = PolymorphicChildModel1(id='child-1')
        child4 = PolymorphicChildModel2(id='child-4')
        child5 = PolymorphicChildModel1(id='child-5')
        child6 = PolymorphicChildModel2(id='child-6')
        child7 = PolymorphicChildModel1(id='child-7')

        parent.children[0] = child1b
        self.assertIs(parent.children[0], child1b)

        parent.children['child-1'] = child1c
        self.assertIs(parent.children[0], child1c)

        parent.children[child1] = child1d
        self.assertIs(parent.children[0], child1d)
        self.assertListEqual(parent.children, [child1d, child2, child3])

        parent.children[1:1] = [child4, child5]
        self.assertIs(child4.parent, parent)
        self.assertIs(child5.parent, parent)
        self.assertListEqual(parent.children,
                             [child1d, child4, child5, child2, child3])

        parent.children[:2] = [child6, child7]
        self.assertIs(child6.parent, parent)
        self.assertIs(child7.parent, parent)
        self.assertIs(child1d.parent, None)
        self.assertIs(child4.parent, None)
        self.assertListEqual(parent.children,
                             [child6, child7, child5, child2, child3])

        with self.assertRaises(ValueError):
            parent.children[0:0] = [child2]

    def test_delitem(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel2(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        child4 = PolymorphicChildModel2(id='child-4')
        child5 = PolymorphicChildModel1(id='child-5')
        parent = PolymorphicParentModel(id='parent-1', children=[
            child1, child2, child3, child4, child5])

        del parent.children[0]
        del parent.children['child-3']
        del parent.children[child4]

        self.assertListEqual(parent.children, [child2, child5])
        self.assertIs(child1.parent, None)
        self.assertIs(child3.parent, None)
        self.assertIs(child4.parent, None)

    def test_append(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child1b = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel2(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2])

        parent.children.append(child3)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child3.parent, parent)

        with self.assertRaises(ValueError):
            parent.children.append(child1b)

    def test_add(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child1b = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel2(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2])

        parent.children.add(child3)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child3.parent, parent)

        parent.children.add(child1b)
        self.assertListEqual(parent.children, [child1, child2, child3])

    def test_insert(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child2, child3])

        parent.children.insert(0, child1)

        self.assertListEqual(parent.children, [child1, child2, child3])
        self.assertIs(child1.parent, parent)

    def test_remove(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        parent.children.remove(child1)

        self.assertListEqual(parent.children, [child2, child3])
        self.assertIs(child1.parent, None)

        with self.assertRaises(ValueError):
            parent.children.remove(child1)

    def test_discard(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        parent.children.discard(child1)

        self.assertListEqual(parent.children, [child2, child3])
        self.assertIs(child1.parent, None)

        parent.children.discard(child1)
        self.assertListEqual(parent.children, [child2, child3])

    def test_pop(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        pop1 = parent.children.pop()

        self.assertIs(pop1, child3)
        self.assertListEqual(parent.children, [child1, child2])
        self.assertIs(child3.parent, None)

        pop2 = parent.children.pop('child-1')

        self.assertIs(pop2, child1)
        self.assertListEqual(parent.children, [child2])
        self.assertIs(child1.parent, None)

    def test_clear(self):
        child1 = PolymorphicChildModel1(id='child-1')
        child2 = PolymorphicChildModel1(id='child-2')
        child3 = PolymorphicChildModel1(id='child-3')
        parent = PolymorphicParentModel(
            id='parent-1', children=[child1, child2, child3])

        parent.children.clear()

        self.assertListEqual(parent.children, [])
        self.assertIs(child1.parent, None)
        self.assertIs(child2.parent, None)
        self.assertIs(child3.parent, None)

    def test_load_full(self):
        model = PolymorphicParentModel(self.storage, id='parent-1')

        self.assertEqual(model.dump(), {
            'id': 'parent-1',
            'field': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('parents.json'),
            mock.call('children.json')])

    def test_load_partial(self):
        model = PolymorphicChildModel1(
            self.storage, id='child-1', parent=PolymorphicParentModel(
                self.storage, id='parent-1'))

        self.assertEqual(model.dump(), {
            'type': 'PolymorphicChildModel1',
            'id': 'child-1',
            'field1': 'child-1',
            'parent': 'parent-1',
        })
        self.assertEqual(model, model.parent.children[0])
        self.assertEqual(self.storage.open.call_count, 2)
        self.storage.open.assert_has_calls([
            mock.call('parents.json'),
            mock.call('children.json')])
        self.assertEqual(model.parent.dump(), {
            'id': 'parent-1',
            'field': 'parent-1',
            'children': [
                {
                    'type': 'PolymorphicChildModel1',
                    'id': 'child-1',
                },
                {
                    '_type_': 'PolymorphicChildModel2',
                    'id': 'child-2',
                },
            ],
        })

    def test_save_field(self):
        parent = PolymorphicParentModel(self.storage, id='parent-1')
        child = parent.children[0]

        child.field1 = 'changed-id-1'
        parent.field = 'changed-id-2'
        parent.save()

        self.assertEqual(self.storage.save.call_count, 1)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "id": "child-1", \n'
            '            "type": "PolymorphicChildModel1"\n'
            '        }, \n'
            '        {\n'
            '            "_type_": "PolymorphicChildModel2", \n'
            '            "id": "child-2"\n'
            '        }\n'
            '    ], \n'
            '    "field": "changed-id-2", \n'
            '    "id": "parent-1"\n'
            '}')

        child.save()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('children.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['children.json'],
            '[\n'
            '    {\n'
            '        "field1": "changed-id-1", \n'
            '        "id": "child-1", \n'
            '        "parent": "parent-1", \n'
            '        "type": "PolymorphicChildModel1"\n'
            '    }, \n'
            '    {\n'
            '        "_type_": "PolymorphicChildModel2", \n'
            '        "field2": "child-2", \n'
            '        "id": "child-2", \n'
            '        "parent": "parent-1"\n'
            '    }\n'
            ']')

    def test_save_id(self):
        parent = PolymorphicParentModel(self.storage, id='parent-1')
        child = parent.children[0]

        child.id = 'changed-id-1'
        parent.id = 'changed-id-2'
        parent.save()

        self.assertEqual(self.storage.save.call_count, 2)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('children.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "id": "child-1", \n'
            '            "type": "PolymorphicChildModel1"\n'
            '        }, \n'
            '        {\n'
            '            "_type_": "PolymorphicChildModel2", \n'
            '            "id": "child-2"\n'
            '        }\n'
            '    ], \n'
            '    "field": "parent-1", \n'
            '    "id": "changed-id-2"\n'
            '}')
        self.assertEqual(
            self.storage.files['children.json'],
            '[\n'
            '    {\n'
            '        "field1": "child-1", \n'
            '        "id": "child-1", \n'
            '        "parent": "changed-id-2", \n'
            '        "type": "PolymorphicChildModel1"\n'
            '    }, \n'
            '    {\n'
            '        "_type_": "PolymorphicChildModel2", \n'
            '        "field2": "child-2", \n'
            '        "id": "child-2", \n'
            '        "parent": "changed-id-2"\n'
            '    }\n'
            ']')

        child.save()

        self.assertEqual(self.storage.save.call_count, 4)
        self.storage.save.assert_has_calls([
            mock.call('parents.json', mock.ANY),
            mock.call('children.json', mock.ANY),
            mock.call('children.json', mock.ANY),
            mock.call('parents.json', mock.ANY)])
        self.assertEqual(
            self.storage.files['children.json'],
            '[\n'
            '    {\n'
            '        "field1": "child-1", \n'
            '        "id": "changed-id-1", \n'
            '        "parent": "changed-id-2", \n'
            '        "type": "PolymorphicChildModel1"\n'
            '    }, \n'
            '    {\n'
            '        "_type_": "PolymorphicChildModel2", \n'
            '        "field2": "child-2", \n'
            '        "id": "child-2", \n'
            '        "parent": "changed-id-2"\n'
            '    }\n'
            ']')
        self.assertEqual(
            self.storage.files['parents.json'],
            '{\n'
            '    "children": [\n'
            '        {\n'
            '            "id": "changed-id-1", \n'
            '            "type": "PolymorphicChildModel1"\n'
            '        }, \n'
            '        {\n'
            '            "_type_": "PolymorphicChildModel2", \n'
            '            "id": "child-2"\n'
            '        }\n'
            '    ], \n'
            '    "field": "parent-1", \n'
            '    "id": "changed-id-2"\n'
            '}')
