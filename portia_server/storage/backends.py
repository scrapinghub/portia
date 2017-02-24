import errno
import json
import logging
import os
import os.path
import re
import shutil
import six
import sys

from collections import OrderedDict

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.move import file_move_safe
from django.core.files.storage import FileSystemStorage, Storage
try:
    from dulwich.diff_tree import tree_changes
    from dulwich.objects import Blob, Tree
    from dulwich.errors import ObjectMissing
except ImportError:
    pass  # Dulwich not required when using FS backend
from six import iteritems, text_type, string_types

from .projecttemplates import templates
try:
    from .repoman import Repoman, DEFAULT_USER, FILE_MODE
except ImportError:
    pass  # Repoman not required when using FS backend


logger = logging.getLogger(__name__)


class InvalidFilename(Exception):
    pass


class CommittingStorage(object):
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
        'extractors.json': 'EXTRACTORS',
        os.path.join('spiders', '__init__.py'): None,
        os.path.join('spiders', 'settings.py'): 'SETTINGS',
    }

    def init_project(self):
        self.validate_filename(self.name)

        for filename, templatename in iteritems(self.default_files):
            if not self.exists(filename):
                template = templates.get(templatename, '') % {
                    'name': self.name,
                }
                self.save(filename, ContentFile(template, filename))

    @classmethod
    def get_projects(cls, user):
        # return an OrderedDict of id => name pairs
        try:
            dirs, _ = cls('').listdir('')
            return OrderedDict((project, project) for project in dirs)
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                six.reraise(*sys.exc_info())

    @classmethod
    def setup(cls):
        pass

    def get_available_name(self, name, max_length=None):
        return name

    def commit(self, message='Saving multiple files'):
        pass

    def changed_files(self):
        return []


class BasePortiaStorage(CommittingStorage, Storage):
    def __init__(self, name, author=None):
        self.name = text_type(name)

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

    def open_with_default(self, name, default=None):
        try:
            return self.open(name)
        except IOError as error:
            if error.errno == errno.ENOENT:
                return ContentFile(json.dumps(default), name)
            raise error


class FsStorage(BasePortiaStorage, FileSystemStorage):
    base_dir = settings.MEDIA_ROOT

    def __init__(self, name, author=None, *args, **kwargs):
        self.author = author
        super(FsStorage, self).__init__(name, *args, **kwargs)
        FileSystemStorage.__init__(self, os.path.join(
            self.base_dir, self.name))
        if name:
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

    def _save(self, name, content):
        # Taken from django.core.files.storage.FileSystemStorage._save
        # Need to allow overwrite
        full_path = self.path(name)
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            try:
                if self.directory_permissions_mode is not None:
                    # os.makedirs applies the global umask, so we reset it,
                    # for consistency with file_permissions_mode behavior.
                    old_umask = os.umask(0)
                    try:
                        os.makedirs(directory, self.directory_permissions_mode)
                    finally:
                        os.umask(old_umask)
                else:
                    os.makedirs(directory)
            except OSError as e:
                if e.errno != errno.EEXIST:
                    six.reraise(*sys.exc_info())

        if not os.path.isdir(directory):
            raise IOError("%s exists and is not a directory." % directory)

        with open(full_path, 'w') as f:
            for chunk in content.chunks():
                f.write(chunk)

        if self.file_permissions_mode is not None:
            os.chmod(full_path, self.file_permissions_mode)

        return name

    def delete(self, name):
        super(FsStorage, self).delete(name)
        name = self.path(name)
        if name.endswith('.json'):
            dir_path = name[:-len('.json')]
            if self.isdir(dir_path):
                self.rmtree(dir_path)


class GitStorage(BasePortiaStorage):
    version_control = True

    def __init__(self, name, author=None):
        super(GitStorage, self).__init__(name)
        if not name:
            return
        self._tree, self._working_tree = None, None
        self.author = author
        repo = Repoman.open_repo(name, author)
        self.repo = repo
        self.branch = branch = (author and author.username) or DEFAULT_USER
        self.checkout(branch=branch)
        self.init_project()

    def checkout(self, commit=None, branch=None, retry=True):
        if self._tree != self._working_tree:
            raise IOError('Can only switch from a clean repository')
        if commit is not None and isinstance(commit, string_types):
            commit = self.repo._repo.get_object(commit)
        if not commit:
            for ref in {'refs/heads/%s' % branch, 'refs/heads/master'}:
                try:
                    _commit_id = self.repo._repo.refs[ref]
                except KeyError:
                    pass
                else:
                    try:
                        commit = self.repo._repo.get_object(_commit_id)
                    except ObjectMissing:
                        if ref != 'refs/heads/master':
                            del self.repo._repo.refs[ref]
                        else:
                            six.reraise(*sys.exc_info())
                    else:
                        break
        if commit is not None and isinstance(commit, string_types):
            commit = self.repo._repo.get_object(commit)
        self._commit = commit
        if commit is None:
            tree = Tree()
        else:
            try:
                tree = self.repo._repo.get_object(commit.tree)
            except ObjectMissing:
                if retry and branch is not None:
                    if branch != 'master':
                        del self.repo._repo.refs['refs/heads/%s' % branch]
                        return self.checkout(branch='master', retry=False)
                    else:
                        six.reraise(*sys.exc_info())
        self._tree = tree
        self._working_tree = tree.copy()
        self._blobs = {}
        # TODO: Fail if there are changes in working tree

    @classmethod
    def setup(cls):
        Repoman.setup(getattr(settings, 'GITSTORAGE_REPO_BACKEND',
                              'dulwich.repo.Repo'))

    def _open(self, name, mode='rb'):
        name = self.path(name)
        logger.debug('Dulwich open: {}'.format(name))
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
        name = self.path(name)
        blob = Blob.from_string(content.read())
        self._blobs[blob.id] = blob
        self._working_tree.add(name, FILE_MODE, blob.id)
        return name

    def delete(self, name):
        name = self.path(name)
        if self.isfile(name):
            del self._working_tree[name]
        else:
            raise IOError(2, 'No file or directory', name)
        if name.endswith('.json'):
            dir_path = name[:-len('.json')]
            if self.isdir(dir_path):
                self.rmtree(dir_path)

    def exists(self, name):
        name = self.path(name)
        if self.isfile(name) or self.isdir(name):
            return True
        return False

    def listdir(self, path):
        path = '{}/'.format(self.path(path))
        # All paths should be relative to the project directory
        path_parts = len(path.strip('/').split('/'))
        if path == '/':
            path = ''
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
        name = self.path(name)
        dir_name = name + '/'
        if any(path.startswith(dir_name) for path in self._working_tree):
            return True
        return False

    def isfile(self, name):
        name = self.path(name)
        if name in self._working_tree:
            return True
        return False

    def move(self, old_name, new_name, allow_overwrite=False):
        old_name = self.path(old_name)
        if not self.exists(old_name):
            raise IOError(2, 'No file or directory', old_name)
        new_name = self.path(new_name)
        if old_name == new_name:
            return
        if self.isfile(old_name):
            self._working_tree[new_name] = self._working_tree[old_name]
            del self._working_tree[old_name]
        elif self.isdir(old_name):
            dir_name = old_name + '/'
            for path in self._working_tree:
                if path.startswith(dir_name):
                    new_path = self.path(
                        '{}/{}'.format(new_name, path[len(old_name):]))
                    self._working_tree[new_path] = self._working_tree[path]
                    del self._working_tree[path]

    def rmtree(self, name):
        name = self.path(name)
        if not self.isdir(name):
            raise IOError(2, 'No file or directory', name)
        dir_name = name + '/'
        for path, _, _ in self._working_tree.items():
            if path.startswith(dir_name):
                del self._working_tree[path]

    def path(self, path):
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
