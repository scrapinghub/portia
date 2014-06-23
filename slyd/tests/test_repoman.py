import unittest
from tempfile import mkdtemp
from os.path import join
from shutil import rmtree
from json import dumps, loads
import copy

from .settings import SPEC_DATA_DIR

from slyd.repoman import Repoman


def j(json):
    return dumps(json, sort_keys=True, indent=4)

class RepomanTest(unittest.TestCase):

    def setUp(self):
        self.temp_repos_dir = mkdtemp(dir=SPEC_DATA_DIR,
            prefix='test-run-')

    def tearDown(self):
        rmtree(self.temp_repos_dir)

    def get_full_name(self, repo_name):
        return join(self.temp_repos_dir, repo_name)

    def test_create(self):
        Repoman.create_repo(self.get_full_name('my_repo'))
        self.assertTrue(Repoman.repo_exists(self.get_full_name('my_repo')))

    def test_save_file(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        contents = j({ 'a': 1 })
        repoman.save_file('f1', contents, 'testbranch')
        self.assertEqual(['f1'], repoman.list_files_for_branch('testbranch'))
        self.assertEqual(
            contents, repoman.file_contents_for_branch('f1', 'testbranch'))

    def test_delete_file(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        contents = j({ 'a': 1 })
        repoman.save_file('f1', contents, 'testbranch')
        repoman.delete_file('f1', 'testbranch')
        self.assertEqual([], repoman.list_files_for_branch('testbranch'))

    def test_branch_ops(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        repoman.create_branch('b1')
        self.assertTrue(repoman.has_branch('b1'))
        self.assertEqual(len(repoman.get_branch('b1')), 40)
        repoman.delete_branch('b1')
        self.assertFalse(repoman.has_branch('b1'))

    def test_simple_publish(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        f1, f2, f3 = j({ 'a': 1 }), j({ 'b': 2 }), j({ 'c': 3 })
        repoman.save_file('f1', f1, 'b1')
        repoman.save_file('f2', f2, 'b1')
        repoman.save_file('x/f3', f3, 'b1')
        repoman.save_file('f4', '{}', 'b1')
        repoman.delete_file('f4', 'b1')
        self.assertTrue(repoman.has_branch('b1'))
        self.assertTrue(repoman.has_branch('master'))
        self.assertEqual([], repoman.list_files_for_branch('master'))
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertItemsEqual(['f1', 'f2', 'x/f3'],
            repoman.list_files_for_branch('master'))
        self.assertEqual([f1, f2, f3],
            [repoman.file_contents_for_branch(x, 'b1')
                for x in ('f1', 'f2', 'x/f3')])
        self.assertEqual([f1, f2, f3],
            [repoman.file_contents_for_branch(x, 'master')
                for x in ('f1', 'f2', 'x/f3')])
        # Only one published revision
        self.assertEqual(len(repoman.get_published_revisions()), 1)
        # 6 checkpoints, 1 per operation (5) + 1 for the original state.
        self.assertEqual(len(repoman.get_branch_checkpoints('b1')), 6)

    def test_sequential_publishes(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        f1, f2 = j({ 'a': 1 }), j({ 'b': 2 })
        repoman.save_file('f1', f1, 'b1')
        repoman.save_file('x/f2', f2, 'b1')
        repoman.publish_branch('b1')
        repoman.delete_branch('b1')
        # f1 is modified in branch b2
        f1 =  j({ 'a': 3 })
        repoman.save_file('f1', f1, 'b2')
        self.assertTrue(repoman.publish_branch('b2'))
        self.assertEqual([f1, f2],
            [repoman.file_contents_for_branch(x, 'master')
                for x in ('f1', 'x/f2')])
        self.assertEqual(len(repoman.get_published_revisions()), 2)

    def test_two_interleaved_publishes_1(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        f1, f2 = j({ 'a': 1 }), j({ 'b': 2 })
        repoman.save_file('f1', f1, 'b1')
        repoman.save_file('x/f2', f2, 'b1')
        # branch b2 modifies the same files concurrently
        f1, f2 = j({ 'c': 3 }), j({ 'd': 4 })
        repoman.save_file('f1', f1, 'b2')
        repoman.save_file('x/f2', f2, 'b2')
        # both publish their changes, but the automerge should solve conflicts
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertTrue(repoman.publish_branch('b2'))
        self.assertEqual(j({ 'a': 1, 'c': 3 }),
            repoman.file_contents_for_branch('f1', 'master'))
        self.assertEqual(j({ 'b': 2, 'd': 4 }),
            repoman.file_contents_for_branch('x/f2', 'master'))
            
        self.assertEqual(len(repoman.get_published_revisions()), 2)

    def test_two_interleaved_publishes_2(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        f1 = j({ 'a': 1, 'c': 3 })
        repoman.save_file('f1', f1, 'b1')
        self.assertTrue(repoman.publish_branch('b1'))
        repoman.delete_branch('b1')

        # b1 adds x/f2.
        f2 = j({ 'b': 2 })
        repoman.save_file('x/f2', f2, 'b1')
        
        # branch b2 adds a file with the same name but different content
        f2 = j({ 'a': 2, 'c': { 'd': 1 } })
        repoman.save_file('x/f2', f2, 'b2')
        repoman.delete_file('f1', 'b2')
        
        # both publish their changes, but the automerge should solve conflicts
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertTrue(repoman.publish_branch('b2'))
        self.assertEqual(j({ 'a': 2, 'b': 2, 'c': { 'd': 1 } }),
        repoman.file_contents_for_branch('x/f2', 'master'))
        self.assertEqual(len(repoman.get_published_revisions()), 3)

    def test_two_interleaved_publishes_3(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        f1 = j({ 'a': 1, 'c': 3, 'd': 4, 'e': 5})
        repoman.save_file('f1', f1, 'b1')
        self.assertTrue(repoman.publish_branch('b1'))
        repoman.delete_branch('b1')

        # b1 heavily edits f1
        repoman.save_file('f1', j({ 'b': 2, 'e': 5 }), 'b1')
        # this case is VERY tricky. branch 2 renames f1 to f2 and changes
        # it a bit. The merge algorithm detects the rename and the merged
        # output ends up containing all b1 changes + all b2 changes, and the
        # file is stored under the name given by branch2
        repoman.delete_file('f1', 'b2')
        repoman.save_file('f2', j({ 'a': 1, 'c': 3, 'd': 4, 'e': 6}), 'b2')
        # both publish their changes, but the automerge should solve conflicts
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertTrue(repoman.publish_branch('b2'))
        self.assertEqual(j({ 'b': 2, 'e': 6 }),
            repoman.file_contents_for_branch('f2', 'master'))
        self.assertEqual(len(repoman.get_published_revisions()), 3)

    def test_modify_delete(self):
        # Although this is usually treated as a conflict, here we just keep the
        # modified version and ignore the delete.
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        repoman.save_file('f1', j({ 'a': 1 }), 'b1')
        self.assertTrue(repoman.publish_branch('b1'))
        repoman.delete_branch('b1')
        # b1 deletes f1 and b2 modifies it.
        repoman.delete_file('f1', 'b1')
        repoman.save_file('f1', j({ 'a': 2, 'c': 3 }), 'b2')
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertTrue(repoman.publish_branch('b2'))
        # master has f1.
        self.assertEqual(['f1'], repoman.list_files_for_branch('master'))
        self.assertEqual(j({ 'a': 2, 'c': 3 }),
            repoman.file_contents_for_branch('f1', 'master'))

    def test_unresolved_conflicts_both_modify(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        repoman.save_file('f1', j({ 'a': 1 }), 'b1')
        self.assertTrue(repoman.publish_branch('b1'))
        repoman.delete_branch('b1')
        # both branches update the same key of the same file with different
        # values. This conflict must be manually resolved
        repoman.save_file('f1', j({ 'a': 2 }), 'b1')
        repoman.save_file('f1', j({ 'a': 3 }), 'b2')
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertFalse(repoman.publish_branch('b2'))
        # the file appears as published by b1 in the master branch
        self.assertEqual(j({ 'a': 2 }),
            repoman.file_contents_for_branch('f1', 'master'))
        # the file in b2 has an unresolved conflict
        self.assertIn('__CONFLICT',
            j(repoman.file_contents_for_branch('f1', 'b2')))
        # b2 solves the conflict, saves again and forces the publish
        repoman.save_file('f1', j({ 'a': 3 }), 'b2')
        self.assertTrue(repoman.publish_branch('b2', force=True))
        self.assertEqual(j({ 'a': 3 }),
            repoman.file_contents_for_branch('f1', 'master'))

    def test_unresolved_conflicts_both_add(self):
        repoman = Repoman.create_repo(self.get_full_name('my_repo'))
        # both add the same file with a conflicting key
        repoman.save_file('f1', j({ 'a': 1 }), 'b1')
        repoman.save_file('f1', j({ 'a': 2 }), 'b2')
        self.assertTrue(repoman.publish_branch('b1'))
        self.assertFalse(repoman.publish_branch('b2'))
        # the file appears as published by b1 in the master branch
        self.assertEqual(j({ 'a': 1 }),
            repoman.file_contents_for_branch('f1', 'master'))
        # the file in b2 has an unresolved conflict
        self.assertIn('__CONFLICT',
            j(repoman.file_contents_for_branch('f1', 'b2')))
