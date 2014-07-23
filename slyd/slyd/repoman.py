from time import time
from collections import defaultdict
from json import dumps, loads
from shutil import rmtree
from itertools import chain

from dulwich.mysqlrepo import MysqlRepo
from dulwich.objects import Blob, Tree, Commit, parse_timezone
from dulwich.diff_tree import tree_changes, RenameDetector
from dulwich.errors import NotGitRepository

from slyd.jsondiff import merge_jsons


CHANGE_ADD = 'add'
CHANGE_MODIFY = 'modify'
CHANGE_DELETE = 'delete'
CHANGE_RENAME = 'rename'
CHANGE_COPY = 'copy'
CHANGE_UNCHANGED = 'unchanged'

FILE_MODE = 0100644


class Repoman(object):
    '''An interface to interact with Git repositories.

    Only json files are allowed into the repository as a custom merge algorithm
    is used to resolve conflicts. Changes must be recorded into the repo file
    by file using the save_file and delete_file methods.

    The expected work-flow for concurrent usage of a repo is:

    * User A branches the repo to make his edits.
    * User B branches the repo to make his edits.
    * User A changes some files using save_file and delete_file.
    * User B changes some files using save_file and delete_file.
    * User A publishes his changes using publish_branch.
    * User A deletes his edit branch.
    * User B tries to publish using publish_branch. If the automatic merge
    is not able to resolve all conflicts, the publish is unsuccessful but
    intermediate merge files are be created containing meta-data to help resolve
    the pending conflicts.
        * User B resolves the pending conflicts.
        * User B publishes his changes using publish_branch.
        * User B deletes his edit branch.
    '''

    @classmethod
    def init_backend(cls):
        MysqlRepo._init_db()

    @classmethod
    def create_repo(cls, repo_name, author=None):
        '''Creates a new repository named repo_name.'''
        repoman = Repoman(author)
        repoman._repo = MysqlRepo.init_bare(repo_name)
        tree = Tree()
        commit = repoman._create_commit()
        commit.tree = tree.id
        commit.message = 'Initialization commit'
        repoman._update_store(commit, tree)
        repoman._advance_branch('master', commit)
        return repoman

    @classmethod
    def open_repo(cls, repo_name, author=None):
        '''Opens an existing repository.'''
        repoman = Repoman(author)
        repoman._repo = MysqlRepo.open(repo_name)
        return repoman

    @classmethod
    def repo_exists(cls, repo_name):
        '''Returns true iff a repository named repo_name can be opened.'''
        return MysqlRepo.repo_exists(repo_name)

    @classmethod
    def list_repos(cls):
        '''Returns true iff a repository named repo_name can be opened.'''
        return MysqlRepo.list_repos()

    @classmethod
    def delete_repo(cls, repo_name):
        '''Deletes an existing repo.'''
        MysqlRepo.delete_repo(repo_name)

    def __init__(self, author):
        '''Do not instantiate directly, use create_repo or open_repo.'''
        self._author = author
        self._encoding = 'UTF-8'
        self._time_zone = parse_timezone('+0000')[0]

    def create_branch(self, branch_name, at_revision=None):
        '''Creates a new branch.

        If no revision is specified, the branch is created from the latest
        commit in master.
        '''
        at_revision = at_revision or self._get_head()
        self._repo.refs['refs/heads/%s' % branch_name] = at_revision

    def delete_branch(self, branch_name):
        '''Deletes an existing branch.

        Only the reference to the branch is deleted, all commits trees and
        blobs are left untouched.
        '''
        del self._repo.refs['refs/heads/%s' % branch_name]

    def has_branch(self, branch_name):
        '''Returns true iff the specified branch exists in this repo.'''
        return 'refs/heads/%s' % branch_name in self._repo.refs

    def get_branch(self, branch_name):
        '''Returns the branch with name branch_name'''
        return self._repo.refs['refs/heads/%s' % branch_name]

    def save_file(self, file_path, contents, branch_name):
        '''Saves a file into the repo and advances the specified branch head.

        If the branch does not exist yet, it will be created.
        '''
        self._perform_file_operation(
            branch_name, self._save_file, file_path, contents)

    def delete_file(self, file_path, branch_name):
        '''Deletes a file from the repo and advances the specified branch head.

        If the branch does not exist yet, it will be created.
        '''
        self._perform_file_operation(
            branch_name, self._delete_file, file_path)

    def rename_file(self, old_file_path, new_file_path, branch_name):
        '''Renames a file in the repo and advances the specified branch head.

        If the branch does not exist yet, it will be created.
        '''
        self._perform_file_operation(
            branch_name, self._rename_file, old_file_path, new_file_path)

    def blob_for_branch(self, file_path, branch_name):
        '''Returns the blob with the contents of file_path.

        The returned version of the blob is the one at the branch's head.
        '''
        return self.blob(file_path, self.get_branch(branch_name))

    def blob(self, file_path, revision):
        '''Returns the blob with the contents of file_path @revision'''
        tree = self._get_tree(revision)
        _, sha = tree[file_path]
        return self._repo.get_object(sha)

    def file_contents_for_branch(self, file_path, branch_name):
        '''Returns the the contents of file_path for the given branch.'''
        return self.blob_for_branch(file_path, branch_name).as_raw_string()

    def list_files_for_branch(self, branch_name):
        '''Returns a list containing all file names for the given branch.'''
        return self.list_files(self.get_branch(branch_name))

    def list_files(self, revision):
        '''Returns a list containing all file names for the given revision.'''
        repo = self._repo
        items = repo.get_object(repo.get_object(revision).tree).items()
        return [i.path for i in items]

    def publish_branch(self, branch_name, force=False, message=None):
        '''Merges a branch into master.

        If master@head is an ancestor of the given branch (or force=True), all
        branch commits are squashed into one and then master@head is advanced
        accordingly.

        If not (probably because other user published his changes), a three way
        merge is performed. If no unresolved merge conflicts arise, then a
        publish commit is created and then master@head is advanced accordingly.
        If there are unresolved conflicts, a resolve conflicts commit is
        created containing metadata intended to help to manually resolve
        pending conflicts, and then branch@head is advanced.

        Returns True if master@head was advanced and False if there are pending
        conflicts.
        '''
        branch = self.get_branch(branch_name)
        head = self._get_head()
        if self._is_ancestor_commit(branch, head) or force:
            # Squash all the branch commits and move the master head.
            tree = self._get_tree(branch)
            commit = self._create_commit()
            #commit.parents = [head, branch]
            commit.parents = [head]
            commit.tree = tree.id
            commit.message = message or 'Publishing changes'
            self._update_store(commit, tree)
            self._advance_branch('master', commit)
            return True
        else:
            # We need to merge and maybe deal with conflicts.
            common_ancestor = self.get_branch_checkpoints(branch_name)[-1]
            merge_tree, had_conflict = self._merge_branches(
                common_ancestor, branch, head)
            commit = self._create_commit()
            commit.tree = merge_tree.id
            if had_conflict:
                commit.parents = [branch]
                commit.message = 'Resolve merge conflicts'
                self._update_store(commit)
                self._advance_branch(branch_name, commit)
            else:
                commit.parents = [head]
                commit.message = 'Publishing changes'
                self._update_store(commit)
                self._advance_branch('master', commit)
            return not had_conflict

    def get_published_revisions(self):
        '''Returns all commit ids that correspond to a successful publishes.'''
        walker = self._repo.get_walker()
        # TODO: find a better way of marking publish commits...
        # maybe use tags?
        return [entry.commit.id for entry in walker
            if entry.commit.message.startswith('Publishing')]

    def get_branch_checkpoints(self, branch_name):
        '''Returns all commit ids for changes made within the branch.'''
        branch = self.get_branch(branch_name)
        publish_revisions = self.get_published_revisions()
        walker = self._repo.get_walker(include=branch)
        branch_checkpoints = []
        for entry in walker:
            commit_id = entry.commit.id
            branch_checkpoints.append(commit_id)
            if commit_id in publish_revisions:
                break
        return branch_checkpoints

    def get_branch_changed_files(self, branch_name):
        '''Returns the name of all changed files within the branch.'''
        master_tree = self._get_tree(self.get_branch('master'))
        branch_tree = self._get_tree(self.get_branch(branch_name))
        changes = tree_changes(
            self._repo.object_store, branch_tree.id, master_tree.id)
        return [entry.new.path or entry.old.path for entry in changes]

    def get_branch_conflicted_files(self, branch_name):
        '''Returns a dict with the conflicted files for a given branch.'''

        def has_conflict(json):
            for key in json.keys():
                if (key == '__CONFLICT' or
                    isinstance(json[key], dict) and has_conflict(json[key])):
                    return True
            return False

        files_content = ((file_path, loads(self.file_contents_for_branch(
            file_path, branch_name))) for
                file_path in self.list_files_for_branch(branch_name))
        return { file_path: content for file_path, content in files_content if
            has_conflict(content) }

    def _merge_branches(self, base, mine, other):

        def load_json(path, branch):
            try:
                blob = self.blob(path, branch)
            except KeyError as ex:
                return {}
            else:
                return loads(blob.as_raw_string())

        merge_tree = Tree()
        base_tree, my_tree, other_tree = (self._get_tree(x)
            for x in (base, mine, other))
        ren_detector = RenameDetector(self._repo.object_store)

        my_changes, other_changes = (
            tree_changes(
                self._repo.object_store,
                base_tree.id,
                x.id,
                want_unchanged=True,
                rename_detector=ren_detector)
            for x in (my_tree, other_tree))

        changes_by_path = defaultdict(list)
        for change in chain(my_changes, other_changes):
            if change.type == CHANGE_DELETE or change.type == CHANGE_RENAME:
                path = change.old.path
            else:
                path = change.new.path
            changes_by_path[path].append(change)
        had_conflict = False

        for path, changes in changes_by_path.iteritems():
            if len(changes) == 2:
                my_changes, other_changes = changes
                if my_changes.type == CHANGE_DELETE:
                    if other_changes.type in (CHANGE_RENAME, CHANGE_MODIFY):
                        merge_tree.add(other_changes.new.path,
                            FILE_MODE, other_changes.new.sha)
                    else:
                        continue
                elif other_changes.type == CHANGE_DELETE:
                    if my_changes.type in (CHANGE_RENAME, CHANGE_MODIFY):
                        merge_tree.add(my_changes.new.path,
                            FILE_MODE, my_changes.new.sha)
                    else:
                        continue
                else:
                    jsons = [load_json(path, x) for x in (base, mine, other)]
                    # When dealing with renames, file contents are under the
                    # 'new' path. Note that the file will be finally stored
                    # under the name given by the last rename.
                    if other_changes.type == CHANGE_RENAME:
                        jsons[2] = load_json(other_changes.new.path, other)
                        path = other_changes.new.path
                    if my_changes.type == CHANGE_RENAME:
                        jsons[1] = load_json(my_changes.new.path, mine)
                        path = my_changes.new.path
                    merged_json, merge_conflict = merge_jsons(*jsons)
                    had_conflict = had_conflict or merge_conflict
                    merged_blob = Blob.from_string(
                        dumps(merged_json, sort_keys=True, indent=4))
                    self._update_store(merged_blob)
                    merge_tree.add(path, FILE_MODE, merged_blob.id)
            else:
                merge_tree.add(path, FILE_MODE, changes[0].new.sha)
        self._update_store(merge_tree)
        return merge_tree, had_conflict

    def _perform_file_operation(self, branch_name, operation, *args):
        if not self.has_branch(branch_name):
            self.create_branch(branch_name)
        parent_commit = self.get_branch(branch_name)
        commit = operation(parent_commit, *args)
        self._advance_branch(branch_name, commit)

    def _save_file(self,  parent_commit, file_path, contents):
        blob = Blob.from_string(contents)
        tree = self._get_tree(parent_commit)
        tree.add(file_path, FILE_MODE, blob.id)
        commit = self._create_commit()
        commit.parents = [parent_commit]
        commit.tree = tree.id
        commit.message = 'Saving %s' % file_path
        self._update_store(commit, tree, blob)
        return commit

    def _delete_file(self,  parent_commit, file_path):
        tree = self._get_tree(parent_commit)
        del tree[file_path]
        commit = self._create_commit()
        commit.parents = [parent_commit]
        commit.tree = tree.id
        commit.message = 'Deleting %s' % file_path
        self._update_store(commit, tree)
        return commit

    def _rename_file(self, parent_commit, old_file_path, new_file_path):
        tree = self._get_tree(parent_commit)
        tree[new_file_path] = tree[old_file_path]
        del tree[old_file_path]
        commit = self._create_commit()
        commit.parents = [parent_commit]
        commit.tree = tree.id
        commit.message = 'Renaming %s to %s' % (old_file_path, new_file_path)
        self._update_store(commit, tree)
        return commit
            
    def _update_store(self, *args):
        object_store = self._repo.object_store
        for obj in args:
            object_store.add_object(obj)

    def _advance_branch(self, branch_name, commit):
        self._repo.refs['refs/heads/%s' % branch_name] = commit.id

    def _get_branch_tree(self, branch_name):
        return self._get_tree(self.get_branch(branch_name))

    def _get_tree(self, revision):
        repo = self._repo
        return repo.get_object(repo.get_object(revision).tree)

    def _create_commit(self):
        commit = Commit()
        commit.author = commit.committer = self._author
        commit.commit_time = commit.author_time = int(time())
        commit.commit_timezone = commit.author_timezone = self._time_zone
        commit.encoding = self._encoding
        return commit

    def _get_head(self):
        try:
            return self._repo.head()
        except KeyError as ex:
            return None

    def _is_ancestor_commit(self, descendant, ancestor):
        walker = self._repo.get_walker(include=descendant)
        for entry in walker:
            if entry.commit.id == ancestor:
                return True
        return False
