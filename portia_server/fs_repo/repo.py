import errno
import os
import six
import sys
from django.conf import settings
from dulwich.object_store import PACKDIR
from dulwich.repo import (
    Repo, BASE_DIRECTORIES, CONTROLDIR, DEFAULT_REF, OBJECTDIR
)


def root_path(name):
    return os.path.join(settings.MEDIA_ROOT, name)


def maybe_mkdirs(path):
    try:
        os.makedirs(path)
    except OSError as e:
        if e.errno != errno.EEXIST:
            six.reraise(*sys.exc_info())


class FsRepo(Repo):
    def __init__(self, name):
        self._name = name
        super(FsRepo, self).__init__(root_path(name or ''))
        self.bare = True

    def head(self):
        """Return the SHA1 pointed at by HEAD."""
        return self.refs['refs/heads/master']

    @classmethod
    def init_bare(cls, path):
        return super(FsRepo, cls).init_bare(
            os.path.join(root_path(path), CONTROLDIR))

    @classmethod
    def _init_maybe_bare(cls, path, bare):
        for d in BASE_DIRECTORIES:
            maybe_mkdirs(os.path.join(path, *d))
        objectdir_path = os.path.join(path, OBJECTDIR)
        for d in ('info', PACKDIR):
            maybe_mkdirs(os.path.join(objectdir_path, d))
        ret = cls(path)
        ret.refs.set_symbolic_ref(b'HEAD', DEFAULT_REF)
        ret._init_files(bare)
        return ret

    @classmethod
    def open(cls, name):
        """Open an existing repository."""
        return cls(name)

    @classmethod
    def repo_exists(cls, name):
        """Check if a repository exists."""
        return (
            os.path.isdir(root_path(name)) and
            os.path.isdir(os.path.join(root_path(name), CONTROLDIR))
        )

    @classmethod
    def list_repos(cls):
        """List all repository names."""
        return [d for d in os.listdir(settings.MEDIA_ROOT)
                if cls.repo_exists(d)]

    @classmethod
    def delete_repo(cls, name):
        """Delete a repository."""
        os.remove(root_path(name))
