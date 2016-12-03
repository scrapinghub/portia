from django.db.transaction import get_autocommit
from django.db.utils import IntegrityError
from dulwich.errors import ObjectMissing
from dulwich.object_store import BaseObjectStore, MemoryObjectStore
from dulwich.objects import sha_to_hex
from dulwich.repo import BaseRepo, MemoryRepo
from dulwich.refs import DictRefsContainer, RefsContainer, SYMREF
from six import get_unbound_function

from .models import Objs, Refs


class MysqlObjectStore(BaseObjectStore):
    """Object store that keeps all objects in a mysql database."""

    def __init__(self, repo):
        super(MysqlObjectStore, self).__init__()
        self._repo = repo

    add_objects = get_unbound_function(MemoryObjectStore.add_objects)
    add_thin_pack = get_unbound_function(MemoryObjectStore.add_thin_pack)
    contains_packed = get_unbound_function(MemoryObjectStore.contains_packed)
    packs = MemoryObjectStore.packs
    _complete_thin_pack = get_unbound_function(
        MemoryObjectStore._complete_thin_pack)

    def _to_hexsha(self, sha):
        if len(sha) == 40:
            return sha
        elif len(sha) == 20:
            return sha_to_hex(sha)
        else:
            raise ValueError("Invalid sha %r" % (sha,))

    def _has_sha(self, sha):
        """Look for the sha in the database."""
        return Objs.objects.filter(repo=self._repo, oid=sha).exists()

    def _all_shas(self):
        """Return all db sha keys."""
        for obj in Objs.objects.filter(repo=self._repo).only('oid').iterator():
            yield obj.oid

    def contains_loose(self, sha):
        """Check if a particular object is present by SHA1 and is loose."""
        return self._has_sha(self._to_hexsha(sha))

    def __iter__(self):
        """Iterate over the SHAs that are present in this store."""
        return self._all_shas()

    def get_raw(self, name):
        """Obtain the raw text for an object.

        :param name: sha for the object.
        :return: tuple with numeric type and object contents.
        """
        try:
            obj = Objs.objects.only('type', 'data')\
                              .get(repo=self._repo, oid=self._to_hexsha(name))
        except Objs.DoesNotExist:
            # last resort fallback, this exception will cause a retry
            raise ObjectMissing(name)
        else:
            return obj.type, obj.data

    def add_object(self, obj):
        data = obj.as_raw_string()
        oid = obj.id
        tnum = obj.get_type()
        try:
            Objs.objects.update_or_create(
                repo=self._repo, oid=oid, type=tnum, size=len(data), data=data)
        except IntegrityError:
            pass

    def delete_objects(self, object_ids):
        Objs.objects.filter(repo=self._repo, oid__in=object_ids).delete()


class MysqlRefsContainer(RefsContainer):
    """RefsContainer backed by MySql.

    This container does not support packed references.
    """
    def __init__(self, repo):
        super(MysqlRefsContainer, self).__init__()
        self._repo = repo

    get_packed_refs = get_unbound_function(DictRefsContainer.get_packed_refs)

    def allkeys(self):
        for ref in Refs.objects.filter(repo=self._repo).only('ref').iterator():
            yield ref.ref

    def read_loose_ref(self, name):
        qs = Refs.objects.only('value')
        if not get_autocommit(using=qs._db):
            qs = qs.select_for_update()
        try:
            ref = qs.get(repo=self._repo, ref=name)
        except Refs.DoesNotExist:
            return None
        else:
            return ref.value

    def set_symbolic_ref(self, name, other):
        self._update_ref(name, SYMREF + other)

    def set_if_equals(self, name, old_ref, new_ref):
        if old_ref is not None and self.read_loose_ref(name) != old_ref:
            return False
        realnames, _ = self.follow(name)
        for realname in realnames:
            self._check_refname(realname)
            self._update_ref(realname, new_ref)
        return True

    def add_if_new(self, name, ref):
        if self.read_loose_ref(name):
            return False
        self._update_ref(name, ref)
        return True

    def remove_if_equals(self, name, old_ref):
        if old_ref is not None and self.read_loose_ref(name) != old_ref:
            return False
        self._remove_ref(name)
        return True

    def _update_ref(self, name, value):
        Refs.objects.update_or_create(repo=self._repo, ref=name, defaults={
            'value': value,
        })

    def _remove_ref(self, name):
        Refs.objects.filter(repo=self._repo, ref=name).delete()


class MysqlRepo(BaseRepo):
    """Repo that stores refs, objects, and named files in MySql.

    MySql repos are always bare: they have no working tree and no index, since
    those have a stronger dependency on the filesystem.
    """

    def __init__(self, name):
        self._name = name
        BaseRepo.__init__(self, MysqlObjectStore(name),
                          MysqlRefsContainer(name))
        self.bare = True

    open_index = get_unbound_function(MemoryRepo.open_index)

    def head(self):
        """Return the SHA1 pointed at by HEAD."""
        return self.refs['refs/heads/master']

    @classmethod
    def init_bare(cls, name):
        """Create a new bare repository."""
        return cls(name)

    @classmethod
    def open(cls, name):
        """Open an existing repository."""
        return cls(name)

    @classmethod
    def repo_exists(cls, name):
        """Check if a repository exists."""
        return Objs.objects.filter(repo=name).exists()

    @classmethod
    def list_repos(cls):
        """List all repository names."""
        return Objs.objects.distinct().values_list('repo', flat=True)

    @classmethod
    def delete_repo(cls, name):
        """Delete a repository."""
        Objs.objects.filter(repo=name).delete()
        Refs.objects.filter(repo=name).delete()
