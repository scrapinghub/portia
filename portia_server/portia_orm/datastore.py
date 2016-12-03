from contextlib import contextmanager
from threading import local
from weakref import WeakKeyDictionary


class DataStoreHandler(local):
    @property
    def data_store(self):
        if not hasattr(self, '_data_store'):
            raise RuntimeError(
                u"No data store available, you may need to wrap your code in "
                u"the portia_orm.datastore.data_store_context context manager.")
        return self._data_store

    @data_store.setter
    def data_store(self, value):
        self._data_store = value

    @data_store.deleter
    def data_store(self):
        delattr(self, '_data_store')

    @property
    def loaded(self):
        if not hasattr(self, '_loaded'):
            raise RuntimeError(
                u"No data store available, you may need to wrap your code in "
                u"the portia_orm.datastore.data_store_context context manager.")
        return self._loaded

    @loaded.setter
    def loaded(self, value):
        self._loaded = value

    @loaded.deleter
    def loaded(self):
        delattr(self, '_loaded')


@contextmanager
def data_store_context():
    shared_data.data_store = WeakKeyDictionary()
    shared_data.loaded = WeakKeyDictionary()
    yield
    del shared_data.data_store
    del shared_data.loaded


shared_data = DataStoreHandler()
