import os
import shutil

from six.moves import StringIO
from six.moves.urllib.parse import urljoin

from django.core.files.move import file_move_safe
from django.core.files.storage import Storage, FileSystemStorage, File
from dulwich.objects import Blob


FILE_MODE = 0o100644
CHANGE_UPDATE = 0
CHANGE_RENAME = 1
CHANGE_DELETE = 2


class CommitingStorage(object):
    def get_available_name(self, name, max_length=None):
        return name

    def __enter__(self):
        pass

    def __exit__(self):
        pass

    def checkout(self):
        pass

    def commit(self):
        pass


class FsStorage(CommitingStorage, FileSystemStorage):
    def isdir(self, name):
        return os.path.isdir(self.path(name))

    def isfile(self, name):
        return os.path.isfile(self.path(name))

    def move(self, old_file_name, new_file_name, allow_overwrite=False):
        file_move_safe(self.path(old_file_name), self.path(new_file_name),
                       allow_overwrite=True)

    def rmtree(self, name):
        shutil.rmtree(self.path(name))


class GitStorage(CommitingStorage, Storage):
    def __init__(self, repo, branch='master', base_url=None,
                 commit=None, tree=None):
        self.repo = repo
        self.branch = branch
        # TODO: If branch doesn't exist -> Create from master
        if commit is None:
            _commit_id = repo.refs['refs/heads/%s' % branch]
            commit = repo._repo.get_object(_commit_id)
        self._commit = commit
        if tree is None:
            tree = repo._repo.get_object(self._commit.tree)
        self._tree = tree
        self._changes = {}
        self.base_url = base_url

    def _open(self, name, mode):
        name = self._prepare_path(name)
        if self.exists(name):
            _, sha = self._tree[name]
            buf = StringIO(self.repo._repo.get_object(sha).as_raw_string())
            return File(buf, name)
        raise IOError(2, 'No file or directory', name)

    def _save(self, name, content, max_length=None):
        name = self._prepare_path(name)
        self._changes[name] = (content.file, name, CHANGE_UPDATE)
        return name

    def delete(self, name):
        name = self._prepare_path(name)
        if self.exists(name):
            self._changes[name] = (None, name, CHANGE_DELETE)
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
        path_parts = len(path.rstrip('/').split('/'))
        if path:
            path_parts += 1
        dirs, files = set(), set()
        for p in self._tree:
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

    def url(self, name):
        name = self._prepare_path(name)
        path_parts = ['projects', self.repo.name] + name.split('/')
        return urljoin(self.base_url, '/'.join(path_parts))

    def isdir(self, name):
        name = self._prepare_path(name)
        dir_name = name + '/'
        if any(path.startswith(dir_name) for path in self._tree):
            return True
        return False

    def isfile(self, name):
        name = self._prepare_path(name)
        if name in self._tree:
            return True
        return False

    def move(self, old_name, new_name, allow_overwrite=False):
        old_name = self._prepare_path(old_name)
        if not self.exists(old_name):
            raise IOError(2, 'No file or directory', old_name)
        new_name = self._prepare_path(new_name)
        if self.isfile(old_name):
            self._changes[old_name] = (None, new_name, CHANGE_RENAME)
        elif self.isdir(old_name):
            for path in self._tree:
                if path.startswith(old_name):
                    new_path = self._prepare_path(
                        '{}/{}'.format(new_name, path[len(old_name):]))
                    self._changes[path] = (None, new_path, CHANGE_RENAME)

    def rmtree(self, name):
        name = self._prepare_path(name)
        if not self.isdir(name):
            raise IOError(2, 'No file or directory', name)
        dir_name = name + '/'
        for path in self._tree:
            if path.startswith(dir_name):
                self.delete(path)

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

    def commit(self):
        if not self._changes:
            return
        commit = self.repo._create_commit()
        commit.parents = self._commit.parents
        tree = self._tree
        ordered = sorted(self._changes.items(), key=lambda x: x[1][2])
        blobs = []
        for path, (contents, new_path, change) in ordered:
            if change == CHANGE_RENAME:
                tree[new_path] = tree[path]
            if change in (CHANGE_DELETE, CHANGE_RENAME):
                try:
                    del tree[path]
                except KeyError:
                    pass
            else:
                blob = Blob.from_string(contents.read())
                tree.add(path, FILE_MODE, blob.id)
                blobs.append(blob)
        commit.tree = tree.id
        commit.message = 'Saving multiple files'
        self.repo._update_store(commit, tree, *blobs)
        self.repo._advance_branch(self.branch, commit)
        self._commit = commit
        self._tree = tree
        self._changes = {}
