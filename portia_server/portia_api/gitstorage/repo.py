import os

from contextlib import contextmanager

from django.db.transaction import get_autocommit
from django.db.utils import IntegrityError
from dulwich.errors import NoIndexPresent, ObjectMissing
from dulwich.object_store import BaseObjectStore, MemoryObjectStore
from dulwich.objects import sha_to_hex
from dulwich.repo import BaseRepo, MemoryRepo
from dulwich.refs import DictRefsContainer, RefsContainer, SYMREF

from retrying import retry

from six import get_unbound_function
from six.moves.urllib.parse import urlparse

from twisted.enterprise.adbapi import ConnectionPool, ConnectionLost

from slyd.projects import ProjectsManager
from slyd.projectspec import ProjectSpec
from ..utils.retry import deferred_retry

from portia_api.models import Objs, Refs


try:
    from MySQLdb import DatabaseError, InterfaceError
except ImportError:
    DatabaseError = InterfaceError = type(None)


CONNECTION_RETRY_CONFIG = {
    # Connections may fail because of a network issue or from timeouts, try 4
    # times with increasing delays of 100ms, 500ms, 5000ms
    'stop_max_attempt_number': 4,
    'wait_func': lambda attempts, delay: [100, 500, 5000][min(attempts - 1, 2)],
    'retry_on_exception': lambda exception: (
        isinstance(exception, (ConnectionLost, InterfaceError)) or
        # 2006: MySQL server has gone away
        # 2013: Lost connection to MySQL server during query
        # 2014: Commands out of sync; you can't run this command now
        (isinstance(exception, DatabaseError) and
         exception[0] in (2006, 2013, 2014))),
}

DEADLOCK_RETRY_CONFIG = {
    # Retry deadlocks until success with a small delay, since they will occur for
    # all concurrent conflicting transactions
    'stop_func': lambda attempts, delay: False,
    'wait_random_min': 10,
    'wait_random_max': 30,
    'retry_on_exception': lambda exception: (
        # 1205: Lock wait timeout exceeded; try restarting transaction
        # 1213: Deadlock found when trying to get lock
        isinstance(exception, DatabaseError) and exception[0] in (1205, 1213)),
}

MISSING_OBJECT_RETRY_CONFIG = {
    # These shouldn't happen, and they may occur because a row was deleted, try
    # a limited number of times with a small delay
    'stop_max_attempt_number': 3,
    'wait_random_min': 10,
    'wait_random_max': 30,
    'retry_on_exception': lambda exception: (
        isinstance(exception, (ObjectMissing, IOError))),
}


class ReconnectionPool(ConnectionPool):
    '''This pool will reconnect if the server goes away or a deadlock occurs.

    This also injects a connection into `ProjectsManager` and `ProjectSpec`
    instances.

    [source] http://www.gelens.org/2009/09/13/twisted-connectionpool-revisited/
    [via] http://stackoverflow.com/questions/12677246/
    '''

    @deferred_retry(**DEADLOCK_RETRY_CONFIG)
    @deferred_retry(**MISSING_OBJECT_RETRY_CONFIG)
    @deferred_retry(**CONNECTION_RETRY_CONFIG)
    def run_deferred_with_connection(self, func, *args, **kw):
        return self._runner(func, *args, **kw)

    @retry(**DEADLOCK_RETRY_CONFIG)
    @retry(**MISSING_OBJECT_RETRY_CONFIG)
    @retry(**CONNECTION_RETRY_CONFIG)
    def _runWithConnection(self, func, *args, **kw):
        return self._runner(func, *args, **kw)

    def _runner(self, func, *args, **kw):
        conn = self.connectionFactory(self)
        try:
            for manager in args:
                if isinstance(manager, (ProjectsManager, ProjectSpec)):
                    break
        # Handle case where no manager is used
        except (AttributeError, UnboundLocalError):
            manager = None

        try:
            if (not hasattr(manager, 'storage') and
                    hasattr(manager, '_open_repo') and
                    hasattr(manager, 'project_name')):
                manager._open_repo()
            result = func(conn, *args, **kw)
            conn.commit()
            return result
        except:
            if hasattr(manager, 'storage'):
                del manager.storage
            conn.rollback()
            raise


@contextmanager
def closing_cursor(connection):
    cursor = connection.cursor()
    yield cursor
    cursor.close()


def _parse(url):
    """Parse a database URL."""
    url = urlparse(url)
    # Remove query strings.
    path = url.path[1:]
    path = path.split('?', 2)[0]
    config = {
        'host': url.hostname or '',
        'port': url.port or 3306,
        'db': path or '',
        'user': url.username or '',
        'passwd': url.password or '',
    }
    return config


connection_pool = None
DB_CONFIG = 'DB_URL' in os.environ and _parse(os.environ['DB_URL']) or {}
# REPEATABLE READ is not enough, we need SERIALIZABLE
# From https://dev.mysql.com/doc/refman/5.7/en/commit.html
#   If you use tables from more than one transaction-safe storage engine (such
#   as InnoDB), and the transaction isolation level is not SERIALIZABLE, it is
#   possible that when one transaction commits, another ongoing transaction
#   that uses the same tables will see only some of the changes made by the
#   first transaction.
INIT_COMMAND = 'SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE'
POOL_NAME = 'PORTIA'
POOL_SIZE = 8
USE_PREPARED_STATEMENTS = False


def init_connection(connection):
    connection.autocommit(False)


def set_db_url(url):
    global DB_CONFIG
    DB_CONFIG = _parse(url)
    global connection_pool
    if connection_pool is None:
        connection_pool = ReconnectionPool(
            'MySQLdb', cp_reconnect=True, cp_min=3, cp_max=POOL_SIZE,
            cp_name=POOL_NAME, cp_openfun=init_connection,
            init_command=INIT_COMMAND,
            **DB_CONFIG)
    return connection_pool


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
            Objs.objects.create(
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
        Refs.objects.update_or_create(repo=self._repo, ref=name, value=value)

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
