from collections import OrderedDict
from itertools import chain
import json
import re
from weakref import WeakKeyDictionary

from six import iteritems, iterkeys, string_types, with_metaclass
from toposort import toposort_flatten

from storage.backends import ContentFile
from .collection import ModelCollection
from .datastore import shared_data
from .deletion import Collector
from .exceptions import (ImproperlyConfigured, PathResolutionError,
                         ValidationError)
from .fields import Field
from .registry import models, get_polymorphic_model
from .relationships import BaseRelationship
from .serializers import FileSerializer
from .snapshots import ModelSnapshots
from .utils import (cached_property, class_property, short_guid, unspecified,
                    AttributeDict)

__all__ = [
    'Model',
]


AUTO_PK = object()


class ModelOpts(object):
    """Meta options for Models."""
    def __init__(self, meta, model):
        self.path = getattr(meta, 'path', None)
        if self.path is not None and not isinstance(self.path, string_types):
            raise ValueError("'path' option must be a string or None.")
        self.owner = getattr(meta, 'owner', False)
        if self.owner != False and not isinstance(self.owner, string_types):
            raise ValueError("'owner' option must be a string or False.")
        if self.owner and not isinstance(model._fields.get(self.owner),
                                         BaseRelationship):
            raise ValueError("'owner' option must be a relationship name.")
        self.polymorphic = getattr(meta, 'polymorphic', False)
        if not isinstance(self.polymorphic, (bool, string_types)):
            raise ValueError(
                "'polymorphic' option must be a string or boolean.")
        self.initialize_boolean('raw', meta)
        self.initialize_boolean('single', meta)
        self.initialize_boolean('ignore_if_missing', meta)

    def initialize_boolean(self, key, meta):
        value = getattr(meta, key, False)
        if not isinstance(value, bool):
            raise ValueError("'{}' option must be a boolean".format(key))
        setattr(self, key, value)


class ModelMeta(type):
    """Meta class for models"""
    def __new__(mcs, name, bases, attrs):
        parents = [b for b in bases if isinstance(b, ModelMeta)]
        if not parents:
            return super(ModelMeta, mcs).__new__(mcs, name, bases, attrs)

        # check if a model with the same name exists in the registry
        if name in models:
            raise ImproperlyConfigured(
                u"A Model named '{}' already exists".format(name))

        meta = attrs.pop('Meta', None)
        meta_bases = tuple(parent.Meta for parent in parents) + (object,)
        if meta:
            meta_bases = (meta,) + meta_bases
        meta = type('Meta', meta_bases, {})

        primary_key = None
        fields = {}
        basic_attrs = {
            'Meta': meta,
        }
        file_schema_attrs = {}

        for attrs in chain([attrs], (getattr(parent, '_class_attrs', {})
                                     for parent in parents)):
            for attrname, value in iteritems(attrs):
                if isinstance(value, BaseRelationship):
                    fields[attrname] = value
                elif isinstance(value, Field):
                    if value.primary_key:
                        if primary_key:
                            raise ImproperlyConfigured(
                                u"Model '{}' declared with more than one primary "
                                u"key".format(name))
                        primary_key = attrname
                    fields[attrname] = value
                # move decorated marshmallow methods to the file schema
                elif hasattr(value, '__marshmallow_tags__'):
                    file_schema_attrs[attrname] = value
                else:
                    basic_attrs[attrname] = value

        if fields and not primary_key:
            raise ImproperlyConfigured(
                u"Model '{}' declared with no primary key".format(name))

        class_attrs = {}
        class_attrs.update(fields)
        class_attrs.update(file_schema_attrs)
        class_attrs.update(basic_attrs)
        cls = super(ModelMeta, mcs).__new__(mcs, name, bases, basic_attrs)

        cls._class_attrs = class_attrs
        cls._pk_field = primary_key
        cls._fields = fields
        cls._file_fields = file_fields = {k for k, f in iteritems(fields)
                                          if not f.ignore_in_file}
        cls._field_names = sorted(k for k, f in iteritems(fields)
                                  if isinstance(f, Field))
        cls._relationship_names = sorted(k for k, f in iteritems(fields)
                                         if isinstance(f, BaseRelationship))
        cls.opts = ModelOpts(meta, cls)
        cls.collection = type(name + 'Collection', (ModelCollection,), {
            'model': cls
        })

        for attrname, field in iteritems(fields):
            if attrname in file_fields:
                file_schema_attrs[attrname] = field
            field.contribute_to_class(cls, attrname)

        # compute an safe order for setting fields during construction
        try:
            cls._ordered_fields = toposort_flatten({
                attrname: field.get_dependencies(cls)
                for attrname, field in iteritems(fields)
            })
        except ValueError as e:
            raise ImproperlyConfigured(e.message)

        # build a marshmallow schema for the filesystem format
        file_schema_attrs['Meta'] = type('Meta', (meta,), {
            'model': cls
        })
        cls.file_schema = type(cls.__name__ + 'FileSerializer',
                               (FileSerializer,), file_schema_attrs)

        # add new model to registry by name
        models[name] = cls
        return cls


class Model(with_metaclass(ModelMeta)):
    _own_attributes = {'data_key', 'storage', 'snapshots', '_initializing'}

    # set by metaclass
    _fields = None
    _field_names = None
    _relationship_names = None
    _ordered_fields = None
    _file_fields = None
    _pk_field = None
    collection = None
    file_schema = None
    opts = None

    snapshot_class = ModelSnapshots

    class Meta:
        pass

    def __init__(self, storage=None, snapshots=None, _data_key=unspecified,
                 **kwargs):
        if _data_key is unspecified:
            if (self._pk_field not in kwargs or
                    (kwargs[self._pk_field] is AUTO_PK and storage is None)):
                raise TypeError(
                    u"Model '{}' must be initialized with a value for the '{}' "
                    u"field".format(self.__class__.__name__, self._pk_field))

            pk = kwargs[self._pk_field]
            if pk is AUTO_PK:
                pk = kwargs[self._pk_field] = self.generate_pk(storage)

            _data_key = self.__class__, pk

        self.data_key = _data_key
        self.storage = storage
        self.snapshots = snapshots or ModelSnapshots.default_snapshots

        for attrname in iterkeys(kwargs):
            if attrname not in self._fields:
                raise TypeError(
                    u"'{}' is not a field of model '{}'".format(
                        attrname, self.__class__.__name__))

        errors = {}
        self._initializing = set(kwargs.keys())
        for attrname in self._ordered_fields:
            if attrname in kwargs:
                try:
                    setattr(self, attrname, kwargs[attrname])
                except ValidationError as err:
                    errors[attrname] = err.messages
        self._initializing.clear()

        if errors:
            raise ValidationError(errors)

    def __eq__(self, other):
        if isinstance(other, Model):
            return other.data_key == self.data_key
        if isinstance(other, tuple):
            self_class, self_pk = self.data_key
            other_class, other_pk = other
            return self_pk == other_pk and (
                issubclass(self_class, other_class) or
                issubclass(other_class, self_class))
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    def __repr__(self, *field_names):
        if field_names:
            if self._pk_field not in field_names:
                field_names = (self._pk_field,) + field_names
        else:
            field_names = [k for k, v in iteritems(self._fields)
                           if k != self._pk_field and isinstance(v, Field)]
            field_names.sort()
            field_names.insert(0, self._pk_field)

        data_store = self.data_store
        fields = OrderedDict()
        for field_name in field_names:
            try:
                fields[field_name] = data_store.get(field_name)
            except KeyError:
                pass
        return u'{}<{}>({})'.format(
            self.__class__.__name__,
            self.snapshots[0],
            u', '.join(u'{}={!r}'.format(k, v) for k, v in iteritems(fields)))

    def __setattr__(self, key, value):
        if key not in self._own_attributes and key not in self._fields:
            raise TypeError(
                u"'{}' is not a field of model '{}'".format(
                    key, self.__class__.__name__))
        super(Model, self).__setattr__(key, value)

    def with_snapshots(self, snapshots=None):
        if self.snapshots == (snapshots or ModelSnapshots.default_snapshots):
            return self
        copy = self.__class__(self.storage, snapshots, _data_key=self.data_key)
        if copy.data_store is not self.data_store:
            copy.data_store.copy_from(self.data_store)
        return copy

    # share data between instances of the same model, to simplify relationships
    @class_property
    def shared_data_store(cls):
        return shared_data.data_store

    # keeps track of files that are loading
    @class_property
    def loaded(cls):
        return shared_data.loaded

    @class_property
    def _file_model(cls):
        """Find the top-level model stored in this model's path."""
        model = getattr(cls, '_cached_file_model', unspecified)
        if model is not unspecified:
            return model

        path = cls.opts.path
        model = cls
        while True:
            if model.opts.owner:
                try:
                    owner = model._fields[model.opts.owner].model
                    path = re.sub(r'{{self.{}(\.|}})'.format(model.opts.owner),
                                  '{self\\1', path)
                    if owner is not model and owner.opts.path == path:
                        model = owner
                        continue
                except KeyError:
                    pass
            cls._cached_file_model = model
            return model

    @classmethod
    def generate_pk(cls, storage):
        data_stores = cls.shared_data_store.get(storage, {})
        pk = short_guid()
        while (cls, pk) in data_stores:
            pk = short_guid()
        return pk

    @property
    def pk(self):
        return getattr(self, self._pk_field)

    @cached_property
    def data_store(self):
        if self.storage:
            return self.shared_data_store.setdefault(
                self.storage, {}).setdefault(
                self.data_key, self.snapshot_class())
        return self.shared_data_store.setdefault(self, self.snapshot_class())

    def has_data(self, key):
        try:
            self.get_data(key)
        except AttributeError:
            return False
        return True

    def get_data(self, key, default=unspecified):
        self.resolve_attributes(key)
        try:
            return self.data_store.get(key, snapshots=self.snapshots)
        except KeyError:
            pass
        if default is not unspecified:
            return default
        raise AttributeError(
            u"'{}' object has no attribute '{}'".format(
                self.__class__.__name__, key))

    def set_data(self, key, value):
        self.data_store.set(key, value, snapshot=self.snapshots[0])

    def dump(self, state='working'):
        try:
            index = ModelSnapshots.default_snapshots.index(state)
        except ValueError:
            raise ValueError(u"'{}' is not a valid state".format(state))

        context = {
            'snapshots': ModelSnapshots.default_snapshots[index:]
        }
        return self.file_schema(context=context).dump(self).data

    def dumps(self, state='working'):
        return json.dumps(self.dump(state=state), sort_keys=False, indent=4)

    def rollback(self):
        self.data_store.clear_snapshot('working')

    def save(self, only=None):
        if self.storage is None:
            return

        # make sure all attributes have been loaded before saving, we need them
        # to correctly detect path changes and to prevent data loss
        self.resolve_attributes(snapshots=('committed',))
        # stage changes to the selected fields in the model and across
        # relationships
        self._stage_changes(only)
        # now that all changes are staged we can save from the staged and
        # committed snapshots to get a consistent save of the selected fields
        self._commit_changes()

    def _stage_changes(self, only=None):
        store = self.data_store
        dirty = store.dirty_fields('working', ('committed',))
        if only is not None:
            dirty = dirty.intersection(only)
        if dirty:
            store.update_snapshot('staged', ('working',), fields=dirty)
        for model, field in self._staged_model_references():
            related_store = model.data_store
            related_field = model._fields[field]
            if related_field.only is None:
                related_dirty = dirty
            elif isinstance(related_field.only, string_types):
                related_dirty = dirty.intersection((related_field.only,))
            else:
                related_dirty = dirty.intersection(related_field.only)
            if related_dirty or field in related_store.dirty_fields(
                    'working', ('committed',)):
                related_store.update_snapshot(
                    'staged', ('working', 'committed'), fields=[field])

    def _commit_changes(self, saved_paths=None, deleted_paths=None):
        if saved_paths is None:
            saved_paths = set()
        if deleted_paths is None:
            deleted_paths = set()

        for model in chain([self], (model for model, _
                                    in self._staged_model_references())):
            store = model.data_store
            dirty = (
                model._file_fields.intersection(iterkeys(store['staged'])) or
                'project' in store.dirty_fields('working', ('committed',))
            )
            path = model.storage_path(model, snapshots=('staged', 'committed'))
            old_path = model.storage_path(model,
                                          snapshots=('committed', 'staged'))
            if dirty or old_path != path:
                if path not in saved_paths and path not in deleted_paths:
                    to_save = self._get_object_to_dump(
                        model, parent_snapshots=('staged', 'committed'))
                    model.storage.save(path, ContentFile(
                        to_save.dumps(state='staged'), path))
                    saved_paths.add(path)
                if old_path != path and old_path not in deleted_paths:
                    model.storage.delete(old_path)
                    deleted_paths.add(old_path)

        for model in chain([self], (model for model, _
                                    in self._staged_model_references())):
            store = model.data_store
            dirty = set(iterkeys(store['staged']))
            if dirty:
                store.update_snapshot('committed', ('staged',), fields=dirty)
                store.clear_snapshot('staged')
                store.clear_snapshot('working', fields=dirty.intersection(
                    iterkeys(store['working'])))

    def _get_object_to_dump(self, model, parent_snapshots):
        child = model
        while child.opts.owner:
            parent = child._get_parent_object(parent_snapshots)
            if isinstance(parent, ModelCollection):
                parent = next(iter(parent))
            to_save = getattr(
                parent.with_snapshots(('staged', 'committed')),
                child._fields[child.opts.owner].related_name)
            child = parent
        if child.__class__ is model._file_model:
            to_save = child
        return to_save

    def _get_parent_object(self, parent_snapshots):
        parent_field = self.opts.owner
        return getattr(self.with_snapshots(parent_snapshots), parent_field)

    def _staged_model_references(self, load_relationships=False):
        for name, field in iteritems(self._fields):
            if isinstance(field, BaseRelationship):
                try:
                    if load_relationships:
                        value = getattr(self, name)
                    else:
                        value = self.data_store.get(
                            name, ('staged', 'committed'))
                except (AttributeError, KeyError, PathResolutionError):
                    continue
                if value is None:
                    continue
                if not isinstance(value, ModelCollection):
                    value = [value]
                for related in value:
                    related_name = field.related_name
                    yield related, related_name

    def delete(self):
        if self.storage is None:
            return

        self.resolve_attributes(snapshots=('committed',))
        collector = Collector()
        self._stage_delete(collector=collector)
        self._commit_delete(collector=collector)
        return collector.delete

    def _stage_delete(self, collector):
        if self in collector:
            return
        collector.add(self)
        collector.delete_instance(self)

        for model, field in self._staged_model_references(
                load_relationships=True):
            if model is None:
                continue
            related_field = model._fields[field]
            related_field.on_delete(
                collector, model.with_snapshots(('staged', 'committed')),
                field, self)

    def _commit_delete(self, collector, saved_paths=None, deleted_paths=None):
        if saved_paths is None:
            saved_paths = set()
        if deleted_paths is None:
            deleted_paths = set()

        for model, fields in iteritems(collector.save):
            model.resolve_attributes(snapshots=('committed',))
            model._stage_changes(fields)

        for model in collector.delete:
            path = model.storage_path(model, snapshots=('committed',))
            if model.opts.owner:
                if path and path not in saved_paths and path not in deleted_paths:
                    to_save = self._get_object_to_dump(
                        model, parent_snapshots=('committed',))
                    model.storage.save(path, ContentFile(
                        to_save.dumps(state='staged'), path))
                    saved_paths.add(path)
            else:
                if path not in deleted_paths:
                    model.storage.delete(path)
                    deleted_paths.add(path)

        for model, fields in iteritems(collector.save):
            model._commit_changes(saved_paths, deleted_paths)

        for model in collector.delete:
            store = model.data_store
            store.update_snapshot('working', ('working', 'staged', 'committed'))
            store.clear_snapshot('staged')
            store.clear_snapshot('committed')

    @classmethod
    def load(cls, storage, instance=None, **kwargs):
        if storage is None:
            return

        path = cls.storage_path(instance or kwargs,
                                snapshots=('committed', 'working'))
        if not path:
            return

        many = bool(cls.opts.owner) and not cls.opts.single
        if instance and many:
            try:
                instance.data_store.get(instance._pk_field)
            except KeyError:
                return

        if path in cls.loaded.setdefault(storage, set()):
            return
        cls.loaded[storage].add(path)

        if not storage.exists(path):
            if many:
                return cls.collection()
            return instance  # may be None

        file_data = storage.open(path).read()
        if not cls.opts.raw:
            file_data = json.loads(file_data, object_pairs_hook=OrderedDict)

        if cls.opts.polymorphic:
            if not many:
                file_data = [file_data]
            collection_type = cls.__bases__[0]
            result = collection_type.collection()
            for polymorphic_data in file_data:
                polymorphic_type = get_polymorphic_model(polymorphic_data)
                polymorphic_schema = polymorphic_type._file_model.file_schema
                result.append(
                    polymorphic_schema(
                        context={'storage': storage}).load(
                            polymorphic_data).data)
            if len(result) == 1 and not many:
                result = result[0]
            return result

        file_schema = cls._file_model.file_schema
        result = file_schema(
            context={'storage': storage, 'path': path}).load(
                file_data, many=many).data
        return result

    @classmethod
    def storage_path(cls, data, snapshots=None):
        if isinstance(data, cls):
            data = data.data_store.accessor(snapshots)
        else:
            data = AttributeDict(data)
        try:
            path = (cls.opts.path or u'').format(self=data)
        except AttributeError as e:
            if cls.opts.ignore_if_missing:
                return
            raise PathResolutionError(
                u"Could not resolve file path for model '{}':\n"
                u"    {}".format(cls.__name__, e))
        return path or None

    def resolve_attributes(self, *attributes, **kwargs):
        if not self.storage:
            return

        file_fields = self._file_fields
        if not attributes:
            attributes = file_fields

        snapshots = kwargs.get('snapshots')
        if snapshots is None:
            snapshots = self.snapshots
        data = self.data_store.accessor(snapshots)
        try:
            for attribute in attributes:
                if (attribute in file_fields and
                        attribute not in self._initializing and
                        not hasattr(data, attribute)):
                    self.load(self.storage, instance=self)
                    break
        except PathResolutionError:
            pass

    def copy(self, new_id = None, storage = None):
        if new_id is None:
            new_id = short_guid()
        field_names = {field: getattr(self, field)
                       for field in self._field_names if field != 'id'}
        field_names.update({
            'id': new_id,
            'storage': storage,
        })
        return self.__class__(**field_names)
