import os
import os.path
import re
import shutil

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.move import file_move_safe
from django.core.files.storage import Storage, FileSystemStorage
from dulwich.diff_tree import tree_changes
from dulwich.objects import Blob, Tree
from six import iteritems, text_type

from .projecttemplates import templates
from .repoman import Repoman, DEFAULT_USER, FILE_MODE


class InvalidFilename(Exception):
    pass


class CommittingStorage(object):
    def get_available_name(self, name, max_length=None):
        return name

    def commit(self, message='Saving multiple files'):
        pass

    def changed_files(self):
        return []


class BasePortiaStorage(CommittingStorage, Storage):
    version_control = False
    create_projects = True
    delete_projects = True
    rename_projects = True
    deploy_projects = False
    rename_spiders = True
    rename_samples = True

    default_files = {
        'project.json': 'PROJECT',
        'scrapy.cfg': 'SCRAPY',
        'setup.py': 'SETUP',
        'items.json': 'ITEMS',
        os.path.join('spiders', '__init__.py'): None,
        os.path.join('spiders', 'settings.py'): 'SETTINGS',
    }

    def __init__(self, name, author=None):
        self.name = text_type(name)

    @classmethod
    def setup(cls):
        pass

    @staticmethod
    def is_valid_filename(s):
        # based on Django's Storage.get_valid_filename
        if s.strip() != s:
            return False
        if re.sub(r'(?u)[^- \w.]', '', s) != s:
            return False
        return True

    @classmethod
    def validate_filename(cls, s):
        s = text_type(s)
        if not cls.is_valid_filename(s):
            raise InvalidFilename(
                u"The string '{}' is not a valid filename.".format(s))
        return s

    def init_project(self):
        self.validate_filename(self.name)

        # TODO: add portia 2.0 tag

        for filename, templatename in iteritems(self.default_files):
            if not self.exists(filename):
                template = templates.get(templatename, '') % {
                    'name': self.name,
                }
                self.save(filename, ContentFile(template, filename))

    @classmethod
    def get_projects(cls, user):
        # return an OrderedDict of id => name pairs
        raise NotImplementedError


class FsStorage(BasePortiaStorage, FileSystemStorage):
    base_dir = '.'

    def __init__(self, name, *args, **kwargs):
        super(FsStorage, self).__init__(name, *args, **kwargs)
        FileSystemStorage.__init__(self, os.path.join(
            self.base_dir, self.name))
        self.init_project()

    def isdir(self, name):
        return os.path.isdir(self.path(name))

    def isfile(self, name):
        return os.path.isfile(self.path(name))

    def move(self, old_file_name, new_file_name, allow_overwrite=False):
        file_move_safe(self.path(old_file_name), self.path(new_file_name),
                       allow_overwrite=True)

    def rmtree(self, name):
        shutil.rmtree(self.path(name))


class GitStorage(BasePortiaStorage):
    version_control = True

    def __init__(self, name, author=None):
        super(GitStorage, self).__init__(name)
        self.author = author
        repo = Repoman.open_repo(name, author)
        self.repo = repo
        self.branch = branch = (author and author.username) or DEFAULT_USER
        commit = None
        for ref in {'refs/heads/%s' % branch, 'refs/heads/master'}:
            try:
                _commit_id = repo._repo.refs[ref]
            except KeyError:
                pass
            else:
                commit = repo._repo.get_object(_commit_id)
                break
        self._commit = commit
        if commit is None:
            tree = Tree()
        else:
            tree = repo._repo.get_object(commit.tree)
        self._tree = tree
        self._working_tree = tree.copy()
        self._blobs = {}
        self.init_project()

    @classmethod
    def setup(cls):
        Repoman.setup(getattr(settings, 'GITSTORAGE_REPO_BACKEND',
                              'dulwich.repo.Repo'))

    def _open(self, name, mode='rb'):
        name = self._prepare_path(name)
        if self.isfile(name):
            _, sha = self._working_tree[name]
            if sha in self._blobs:
                blob = self._blobs[sha]
            else:
                blob = self.repo._repo.get_object(sha)
                self._blobs[sha] = blob
            return ContentFile(blob.data, name)
        raise IOError(2, 'No file or directory', name)

    def _save(self, name, content):
        name = self._prepare_path(name)
        blob = Blob.from_string(content.read())
        self._blobs[blob.id] = blob
        self._working_tree.add(name, FILE_MODE, blob.id)
        return name

    def delete(self, name):
        name = self._prepare_path(name)
        if self.isfile(name):
            del self._working_tree[name]
        else:
            raise IOError(2, 'No file or directory', name)

    def exists(self, name):
        name = self._prepare_path(name)
        if self.isfile(name) or self.isdir(name):
            return True
        return False

    def listdir(self, path):
        path = self._prepare_path(path)
        # All paths should be relative to the project directory
        path_parts = len(path.split('/'))
        if path:
            path_parts += 1
        dirs, files = set(), set()
        for p in self._working_tree:
            if not p.startswith(path):
                continue
            split = p.split('/')
            try:
                section = split[path_parts - 1]
            except IndexError:
                # File in parent directory with similar name to directory
                continue
            if len(split) == path_parts:
                files.add(section)
            else:
                dirs.add(section)
        return sorted(dirs), sorted(files)

    def isdir(self, name):
        name = self._prepare_path(name)
        dir_name = name + '/'
        if any(path.startswith(dir_name) for path in self._working_tree):
            return True
        return False

    def isfile(self, name):
        name = self._prepare_path(name)
        if name in self._working_tree:
            return True
        return False

    def move(self, old_name, new_name, allow_overwrite=False):
        old_name = self._prepare_path(old_name)
        if not self.exists(old_name):
            raise IOError(2, 'No file or directory', old_name)
        new_name = self._prepare_path(new_name)
        if old_name == new_name:
            return
        if self.isfile(old_name):
            self._working_tree[new_name] = self._working_tree[old_name]
            del self._working_tree[old_name]
        elif self.isdir(old_name):
            dir_name = old_name + '/'
            for path in self._working_tree:
                if path.startswith(dir_name):
                    new_path = self._prepare_path(
                        '{}/{}'.format(new_name, path[len(old_name):]))
                    self._working_tree[new_path] = self._working_tree[path]
                    del self._working_tree[path]

    def rmtree(self, name):
        name = self._prepare_path(name)
        if not self.isdir(name):
            raise IOError(2, 'No file or directory', name)
        dir_name = name + '/'
        for path, _, _ in self._working_tree.items():
            if path.startswith(dir_name):
                del self._working_tree[path]

    def _prepare_path(self, path):
        path = path.lstrip('.').strip('/')
        if path:
            path = os.path.relpath(path)
            # Handle paths for mysql repo where there is no project name
            if path.startswith(getattr(self.repo._repo, '_name', '\0')):
                path = os.path.join(*(path.split('/')[1:]))
        if hasattr(path, 'encode'):
            return path.encode('utf-8')
        return path

    def commit(self, message='Saving multiple files'):
        working_tree = self._working_tree

        if working_tree == self._tree:
            return

        if self._commit is None:
            self.repo = repo = Repoman.create_repo(self.name, self.author)
            self._commit = repo.last_commit

        fake_store = {
            self._tree.id: self._tree,
            working_tree.id: working_tree,
        }

        blobs = []
        for change in tree_changes(fake_store, self._tree.id, working_tree.id):
            if change.new.sha in self._blobs:
                blobs.append(self._blobs[change.new.sha])

        commit = self.repo._create_commit()
        commit.parents = [self._commit.id]
        commit.tree = working_tree.id
        commit.message = message
        self.repo._update_store(commit, working_tree, *blobs)
        self.repo._advance_branch(self.branch, commit)

        self._commit = commit
        self._tree = working_tree
        self._working_tree = working_tree.copy()

    def changed_files(self):
        if self.branch == 'master':
            return []
        try:
            changes = self.repo.get_branch_changed_entries(self.branch)
        except KeyError:
            return []
        return [
            (entry.type, entry.new.path, entry.old.path) for entry in changes
        ]
