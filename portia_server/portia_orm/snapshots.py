from collections import defaultdict

from six import iteritems

__all__ = [
    'ModelSnapshots',
]


class ModelSnapshots(defaultdict):
    default_snapshots = ('working', 'staged', 'committed')

    class ModelSnapshotsAccessor(object):
        __slots__ = ['instance', 'snapshots']

        def __init__(self, instance, snapshots=None):
            self.instance = instance
            self.snapshots = snapshots or ModelSnapshots.default_snapshots

        def __getattr__(self, name):
            try:
                value = self.instance.get(name, self.snapshots)
                try:
                    store = getattr(value, 'data_store')
                    value = store.accessor(self.snapshots)
                except AttributeError:
                    pass
                return value
            except KeyError:
                raise AttributeError(
                    u"'{}' object has no attribute '{}'".format(
                        self.__class__.__name__, name))

        def __setattr__(self, name, value):
            if name in self.__slots__:
                super(ModelSnapshots.ModelSnapshotsAccessor,
                      self).__setattr__(name, value)
                return
            self.instance.set(name, value, self.snapshots[0])

    def __init__(self):
        super(ModelSnapshots, self).__init__(dict)

    def get(self, key, snapshots=None):
        if not snapshots:
            snapshots = self.default_snapshots
        for snapshot in snapshots:
            try:
                return self[snapshot][key]
            except KeyError:
                pass
        raise KeyError(repr(key))

    def set(self, key, value, snapshot=None):
        if not snapshot:
            snapshot = self.default_snapshots[0]
        self[snapshot][key] = value

    def copy_from(self, other):
        assert isinstance(other, ModelSnapshots)
        for key, snapshot in iteritems(other):
            self[key].update(snapshot)

    def dirty_fields(self, changed, original):
        dirty = set()
        for field, value in iteritems(self[changed]):
            try:
                if self.get(field, snapshots=original) == value:
                    continue
            except KeyError:
                pass
            dirty.add(field)
        return dirty

    def update_snapshot(self, destination, snapshots, fields=None):
        if fields is None:
            fields = set()
            for snapshot in snapshots:
                fields.update(self[snapshot].keys())
        self[destination].update({k: self.get(k, snapshots) for k in fields})

    def clear_snapshot(self, snapshot, fields=None):
        if fields is not None:
            data = self[snapshot]
            for field in fields:
                del data[field]
        else:
            del self[snapshot]

    def accessor(self, snapshots=None):
        return self.ModelSnapshotsAccessor(self, snapshots)
