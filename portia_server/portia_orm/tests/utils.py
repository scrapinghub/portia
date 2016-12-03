import errno
import mock
import unittest

from storage.backends import ContentFile
from ..datastore import data_store_context


class DataStoreTestCase(unittest.TestCase):
    def setUp(self):
        context_manager = data_store_context()
        self.addCleanup(context_manager.__exit__, None, None, None)
        context_manager.__enter__()


def mock_storage(files):
    def exists(name):
        return name in files

    def open_(name, *args, **kwargs):
        try:
            data = files[name]
        except KeyError:
            raise IOError(2, 'No file or directory', name)
        return ContentFile(data, name)

    def open_with_default(name, default=None, *args, **kwargs):
        try:
            return open_(name, *args, **kwargs)
        except IOError as error:
            if error.errno == errno.ENOENT:
                return ContentFile(json.dumps(default), name)
            raise error

    def save(name, content):
        files[name] = content.read()

    def delete(name):
        try:
            del files[name]
        except KeyError:
            raise IOError(2, 'No file or directory', name)

    def listdir(path):
        path = path.rstrip('/') + '/'
        dir_set, file_set = set(), set()
        for p in files.keys():
            if not p.startswith(path):
                continue
            parts = p[len(path):].split('/')
            if len(parts) == 1:
                file_set.add(parts[0])
            else:
                dir_set.add(parts[0])
        return sorted(dir_set), sorted(file_set)

    storage = mock.MagicMock()
    storage.name = 'example'
    storage.files = files
    storage.exists.side_effect = exists
    storage.open.side_effect = open_
    storage.open_with_default.side_effect = open_with_default
    storage.save.side_effect = save
    storage.delete.side_effect = delete
    storage.listdir.side_effect = listdir
    return storage
