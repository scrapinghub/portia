import unittest
from slyd.jsondiff import merge_jsons, FieldDiff


class JSONDiffTest(unittest.TestCase):

    def test_merge_no_changes(self):
        base = {'a': 1, 'b': {'a': 1, 'b': 2}}
        self.assertEqual((base, False), merge_jsons(base, base, base))

    def test_merge_simple_adds(self):
        base = {'a': 1, 'b': {'a': 1, 'b': 2}}
        mine = base.copy()
        mine['c'] = 3
        other = base.copy()
        self.assertEqual((mine, False), merge_jsons(base, mine, other))
        mine = base
        other['d'] = {}
        other['d']['a'] = 1
        self.assertEqual((other, False), merge_jsons(base, mine, other))
        mine = base.copy()
        other = base.copy()
        # both add the same key with the same value
        mine['b']['c'] = 3
        other['b']['c'] = 3
        other['b']['d'] = 4
        self.assertEqual(
            ({'a': 1, 'b': {'a': 1, 'b': 2, 'c': 3, 'd': 4}}, False),
            merge_jsons(base, mine, other))

    def test_merge_delete(self):
        base = {'a': 1, 'b': {'a': 1, 'b': 2}, 'c': 3}
        mine = base.copy()
        other = base.copy()
        del mine['a']
        del mine['b']['a']
        del other['b']['b']
        self.assertEqual(({'b': {},  'c': 3}, False),
                         merge_jsons(base, mine, other))
        # both delete the same key
        self.assertEqual(({}, False), merge_jsons({'a': 1}, {}, {}))

    def test_merge_simple_modify(self):
        base = {'a': 1, 'b': {'a': 1, 'b': 2}, 'c': 3}
        mine = base.copy()
        other = base.copy()
        mine['a'] = 22
        mine['b']['a'] = 11
        other['b']['b'] = 33
        self.assertEqual(
            ({'a': 22, 'b': {'a': 11, 'b': 33}, 'c': 3}, False),
            merge_jsons(base, mine, other))
        # both modify the same key with the same value
        self.assertEqual(({'a': 2}, False),
                         merge_jsons({'a': 1}, {'a': 2}, {'a': 2}))

    def test_merge_add_add_conflict(self):
        base = {}
        mine = {'a': 1}
        other = {'a': 2}
        conflict = FieldDiff(base_val=None,
                             my_val=1,
                             my_op='ADDED',
                             other_val=2,
                             other_op='ADDED')._asdict()
        self.assertEqual(({'a': {'__CONFLICT': conflict}}, True),
                         merge_jsons(base, mine, other))
        base = {'a': {}}
        mine = {'a': {'b': 1}}
        other = {'a': {'b': 2, 'c': 3}}
        conflict = FieldDiff(base_val=None,
                             my_val=1,
                             my_op='ADDED',
                             other_val=2,
                             other_op='ADDED')._asdict()
        self.assertEqual(
            ({'a': {'b': {'__CONFLICT': conflict}, 'c': 3}}, True),
            merge_jsons(base, mine, other))

    def test_merge_modify_delete_conflict(self):
        base = {'a': {'b': 1}}
        mine = {'a': {'b': 2}}
        other = {'a': {}}
        conflict = FieldDiff(base_val=1,
                             my_val=2,
                             my_op='CHANGED',
                             other_val=None,
                             other_op='REMOVED')._asdict()
        self.assertEqual(
            ({'a': {'b': {'__CONFLICT': conflict}}}, True),
            merge_jsons(base, mine, other))
        # exchange mine and other
        conflict = FieldDiff(base_val=1,
                             my_val=None,
                             my_op='REMOVED',
                             other_val=2,
                             other_op='CHANGED')._asdict()
        self.assertEqual(({'a': {'b': {'__CONFLICT': conflict}}}, True),
                         merge_jsons(base, other, mine))

    def test_merge_modify_modify_conflict(self):
        base = {'a': {'b': 1}}
        mine = {'a': {'b': 2}}
        other = {'a': {'b': 3}}
        conflict = FieldDiff(base_val=1,
                             my_val=2,
                             my_op='CHANGED',
                             other_val=3,
                             other_op='CHANGED')._asdict()
        self.assertEqual(({'a': {'b': {'__CONFLICT': conflict}}}, True),
                         merge_jsons(base, mine, other))
        other['a'] = 1
        conflict = FieldDiff(base_val={'b': 1},
                             my_val={'b': 2},
                             my_op='CHANGED',
                             other_val=1,
                             other_op='CHANGED')._asdict()
        self.assertEqual(({'a': {'__CONFLICT': conflict}}, True),
                         merge_jsons(base, mine, other))
