from __future__ import absolute_import
from time import time
from collections import defaultdict
from json import dumps, loads
from itertools import chain

from scrapy.utils.misc import load_object

from dulwich.errors import ObjectMissing
from dulwich.objects import Blob, Tree, Commit, Tag, parse_timezone
from dulwich.diff_tree import tree_changes, RenameDetector

from .jsondiff import merge_jsons


CHANGE_MODIFY = 'modify'
CHANGE_DELETE = 'delete'
CHANGE_RENAME = 'rename'

DEFAULT_USER = 'defaultuser'
FILE_MODE = 0o100644

sentinel = object()


class Repoman(object):
    """An interface to interact with Git repositories.

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
    intermediate merge files are be created containing meta-data to help
    resolve the pending conflicts.
        * User B resolves the pending conflicts.
        * User B publishes his changes using publish_branch.
        * User B deletes his edit branch.
    """
    def __init__(self, author):
        """Do not instantiate directly, use create_repo or open_repo."""
        self._author = (author and author.username) or DEFAULT_USER
        self._encoding = 'UTF-8'
        self._time_zone = parse_timezone('+0000')[0]
        self.commit = sentinel
        self.last_commit = None
        self.tree = sentinel
        self.last_tree = None

    @classmethod
    def setup(cls, storage_backend):
        cls.storage = load_object(storage_backend)

    @classmethod
    def create_repo(cls, repo_name, author=None):
        """Create a new repository named repo_name."""
        if cls.storage.repo_exists(repo_name):
            raise NameError()
        repoman = cls(author)
        repoman._repo = cls.storage.init_bare(repo_name)
        tree = Tree()
        commit = repoman._create_commit()
        commit.tree = tree.id
        commit.message = 'Initialization commit'
        repoman.advance_branch(commit, tree, 'master')
        return repoman

    @classmethod
    def open_repo(cls, repo_name, author=None):
        """Open an existing repository."""
        repoman = cls(author)
        repoman._repo = cls.storage.open(repo_name)
        repoman.name = repo_name
        return repoman

    @classmethod
    def repo_exists(cls, repo_name):
        """Return true if a repository named repo_name can be opened."""
        return cls.storage.repo_exists(repo_name)

    @classmethod
    def list_repos(cls):
        return cls.storage.list_repos()

    @classmethod
    def delete_repo(cls, repo_name):
        """Delete an existing repo."""
        cls.storage.delete_repo(repo_name)

    @property
    def refs(self):
        return self._repo.refs

    def create_branch(self, branch_name, at_revision=None):
        """Create a new branch.

        If no revision is specified, the branch is created from the latest
        commit in master.
        """
        at_revision = at_revision or self._get_head()
        self.refs['refs/heads/%s' % branch_name] = at_revision

    def delete_branch(self, branch_name):
        """Delete an existing branch.

        Only the reference to the branch is deleted, all commits trees and
        blobs are left untouched.
        """
        del self.refs['refs/heads/%s' % branch_name]

    def has_branch(self, branch_name):
        """Return true if the specified branch exists in this repo."""
        return 'refs/heads/%s' % branch_name in self.refs

    def get_branch(self, branch_name):
        """Return the branch with name branch_name."""
        return self.refs['refs/heads/%s' % branch_name]

    def save_file(self, file_path, contents, branch_name, commit_message=None):
        """Save a file into the repo and advances the specified branch head.

        If the branch does not exist yet, it will be created.
        """
        self._perform_file_operation(
            branch_name, self._save_file, file_path, contents, commit_message)

    def save_files(self, files, branch_name, commit_message=None):
        """Save a multiple files and advances the specified branch head.

        If the branch does not exist yet, it will be created.
        """
        files_info = {}
        for path, data in files.items():
            if not isinstance(data, (list, tuple)):
                data = (data, CHANGE_MODIFY)
            files_info[path] = data
        self._perform_file_operation(
            branch_name, self._save_files, files_info, commit_message)

    def blob_for_branch(self, file_path, branch_name):
        """Return the blob with the contents of file_path.

        The returned version of the blob is the one at the branch's head.
        """
        return self.blob(file_path, self.get_branch(branch_name))

    def blob(self, file_path, revision):
        """Return the blob with the contents of file_path @revision."""
        tree = self._get_tree(revision)
        _, sha = tree[file_path]
        return self._repo.get_object(sha)

    def file_contents_for_branch(self, file_path, branch_name):
        """Return the the contents of file_path for the given branch."""
        try:
            return self.blob_for_branch(file_path, branch_name).as_raw_string()
        except KeyError:
            return None

    def list_files_for_branch(self, branch_name):
        """Return a list containing all file names for the given branch."""
        try:
            revision = self.get_branch(branch_name)
        except KeyError:
            return []
        return self.list_files(revision)

    def list_files(self, revision):
        """Return a list containing all file names for the given revision."""
        repo = self._repo
        items = repo.get_object(repo.get_object(revision).tree).items()
        return [i.path for i in items]

    def publish_branch(self, branch_name, force=False, message=None,
                       dry_run=False):
        """Merge a branch into master.

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
        """
        conflicts = self._publish_branch(branch_name, force, message)
        if dry_run:
            if conflicts:
                return conflicts
            return True

        if conflicts:
            self.advance_branch(self.commit, branch=branch_name)
            return False
        else:
            self.advance_branch(self.commit, self.tree)
            return True

    def _publish_branch(self, branch_name, force=False, message=None):
        branch = self.get_branch(branch_name)
        head = self._get_head()
        if self._is_ancestor_commit(branch, head):
            # Squash all the branch commits and move the master head.
            tree = self._get_tree(branch)
            commit = self._create_commit()
            commit.parents = [head]
            commit.tree = tree.id
            commit.message = message or 'Publishing changes'
            self.commit = commit
            return False
        else:
            # We need to merge and maybe deal with conflicts.
            common_ancestor = self.get_branch_checkpoints(branch_name)[-1]
            merge_tree, conflicts = self._merge_branches(
                common_ancestor, branch, head, take_mine=force)
            commit = self._create_commit()
            commit.tree = merge_tree.id
            if conflicts:
                commit.parents = [branch]
                commit.message = 'Resolve merge conflicts'
            else:
                commit.parents = [head]
                commit.message = 'Publishing changes'
            self.commit = commit
            return conflicts

    def advance_branch(self, commit, tree=sentinel, branch='master'):
        """Set head of branch to supplied commit."""
        if commit is not sentinel:
            self._update_store(commit, tree)
            self._advance_branch(branch, commit)
            self.last_commit = commit
            self.last_tree = tree
            if commit is self.commit:
                self.commit = sentinel
            if tree is self.tree:
                self.tree = sentinel
        else:
            raise ValueError('Can\'t advance branch without commit')

    def get_published_revisions(self):
        """Return all commit ids that correspond to a successful publishes."""
        walker = self._repo.get_walker()
        # TODO: find a better way of marking publish commits...
        # maybe use tags?
        return [entry.commit.id for entry in walker
                if entry.commit.message.startswith('Publishing')]

    def get_branch_checkpoints(self, branch_name):
        """Return all commit ids for changes made within the branch."""
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

    def get_branch_changed_entries(self, branch_name):
        """Return the name of all changed files within the branch."""
        master_tree = self._get_tree(self.get_branch('master'))
        branch_tree = self._get_tree(self.get_branch(branch_name))
        return tree_changes(
            self._repo.object_store, branch_tree.id, master_tree.id)

    def get_branch_changed_files(self, branch_name):
        """Return the name of all changed files within the branch."""
        changes = self.get_branch_changed_entries(branch_name)
        return [entry.new.path or entry.old.path for entry in changes]

    def add_tag(self, tag_name):
        commit = self._repo['refs/heads/master']
        tag = Tag()
        tag.name = tag_name
        tag.message = 'Tagged %s as %s' % (commit.id, tag_name)
        tag.tagger = self._author
        tag.object = (Commit, commit.id)
        tag.tag_time = int(time())
        tag.tag_timezone = self._time_zone
        self._update_store(tag)
        self.refs['refs/tags/%s' % tag_name] = tag.id

    def checkout_tag(self, tag_name, remove=False):
        if ('refs/tags/%s' % tag_name) not in self.refs:
            raise ValueError('No tag "{}" found'.format(tag_name))
        tag_ref = self.refs['refs/tags/%s' % tag_name]
        tag = self._repo[tag_ref]
        self._advance_branch(
            'master', self._repo.object_store.get_object(tag.object[1]))
        if remove:
            del self.refs['refs/tags/%s' % tag_name]

    def _merge_branches(self, base, mine, other, take_mine=False):

        def load_raw(path, branch):
            try:
                blob = self.blob(path, branch)
            except (KeyError, TypeError):
                return '{}'
            else:
                return blob.as_raw_string()

        def load_json(path, branch):
            return loads(load_raw(path, branch))

        merge_tree = Tree()
        base_tree, my_tree, other_tree = (self._get_tree(x)
                                          for x in (base, mine, other))
        ren_detector = RenameDetector(self._repo.object_store)
        conflicts = {}

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

        for path, changes in changes_by_path.items():
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
                    try:
                        jsons = [load_json(path, x)
                                 for x in (base, mine, other)]
                    except ValueError:  # Handle non json data
                        blob = Blob.from_string(load_raw(path, mine))
                        self._update_store(blob)
                        merge_tree.add(path, FILE_MODE, blob.id)
                        continue
                    base_json, my_json, other_json = jsons
                    # When dealing with renames, file contents are under the
                    # 'new' path. Note that the file will be finally stored
                    # under the name given by the last rename.
                    if other_changes.type == CHANGE_RENAME:
                        other_json = load_json(other_changes.new.path, other)
                        path = other_changes.new.path
                    if my_changes.type == CHANGE_RENAME:
                        my_json = load_json(my_changes.new.path, mine)
                        path = my_changes.new.path
                    if take_mine:
                        merged_json = my_json or other_json or base_json
                    else:
                        merged_json, merge_conflict = merge_jsons(*jsons)
                        if merge_conflict:
                            conflicts[path] = merged_json
                        had_conflict = had_conflict or merge_conflict
                    merged_blob = Blob.from_string(
                        dumps(merged_json, sort_keys=True, indent=4))
                    self._update_store(merged_blob)
                    merge_tree.add(path, FILE_MODE, merged_blob.id)
            else:
                try:
                    data = (load_json(path, mine) or load_json(path, other) or
                            load_json(path, base))
                except ValueError:  # Loading a non json file
                    blob = Blob.from_string(load_raw(path, mine))
                else:
                    blob = Blob.from_string(dumps(data, sort_keys=True,
                                            indent=4))
                self._update_store(blob)
                merge_tree.add(path, FILE_MODE, blob.id)
        self._update_store(merge_tree)
        return merge_tree, conflicts

    def _perform_file_operation(self, branch_name, operation, *args):
        if not self.has_branch(branch_name):
            self.create_branch(branch_name)
        parent_commit = self.get_branch(branch_name)
        commit = operation(parent_commit, *args)
        self._advance_branch(branch_name, commit)

    def _save_file(self, parent_commit, file_path, contents, commit_message):
        commit_message = commit_message or 'Saving %s' % file_path
        return self._save_files(
            parent_commit, {file_path: (contents, CHANGE_MODIFY)},
            commit_message)

    def _save_files(self, parent_commit, files, commit_message):
        tree = self._get_tree(parent_commit)
        blobs = []
        for file_path, (contents, change) in files.items():
            if change == CHANGE_DELETE:
                try:
                    del tree[file_path]
                except KeyError:
                    pass
            else:
                blob = Blob.from_string(contents)
                tree.add(file_path, FILE_MODE, blob.id)
                blobs.append(blob)
        commit = self._create_commit()
        commit.parents = [parent_commit]
        commit.tree = tree.id
        commit.message = commit_message or 'Saving multiple files'
        self._update_store(commit, tree, *blobs)
        return commit

    def _update_store(self, *args):
        objects = [(obj, None) for obj in args if obj not in (None, sentinel)]
        self._repo.object_store.add_objects(objects)

    def _advance_branch(self, branch_name, commit):
        self.refs['refs/heads/%s' % branch_name] = commit.id

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
        except KeyError:
            return None

    def _is_ancestor_commit(self, descendant, ancestor):
        walker = self._repo.get_walker(include=descendant)
        try:
            for entry in walker:
                if entry.commit.id == ancestor:
                    return True
        except ObjectMissing:
            return True
        return False
