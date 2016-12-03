from collections import OrderedDict, Sequence

from marshmallow import schema
from six import iteritems, string_types

from .decorators import pre_dump, post_dump, post_load

__all__ = [
    'FileSerializer',
]


class FileSerializerOpts(schema.SchemaOpts):
    def __init__(self, meta):
        super(FileSerializerOpts, self).__init__(meta)
        if meta is schema.BaseSchema.Meta:
            return

        self.strict = True
        # make marshmallow use OrderedDicts, so that collections of enveloped
        # objects maintain their order when loaded
        self.ordered = True
        # the model from which the Schema was created, required
        self.model = getattr(meta, 'model')
        self.polymorphic = getattr(meta, 'polymorphic', False)
        # whether to include the model name in the serialized output, if a
        # string use that as the output attribute, otherwise uses 'type'
        if not isinstance(self.polymorphic, (bool, string_types)):
            raise ValueError(
                "'polymorphic' option must be a string or boolean.")


class FileSerializer(schema.Schema):
    OPTIONS_CLASS = FileSerializerOpts

    def __init__(self, *args, **kwargs):
        super(FileSerializer, self).__init__(*args, **kwargs)
        if self.opts.polymorphic:
            self.extra = self.extra or {}
            polymorphic_key = self.opts.polymorphic
            if isinstance(polymorphic_key, bool):
                polymorphic_key = 'type'
            self.extra[polymorphic_key] = self.opts.model.__name__

    def __getattr__(self, item):
        # try to resolve missing attributes from the model
        return getattr(self.opts.model, item)

    def get_attribute(self, attr, obj, default):
        return super(FileSerializer, self).get_attribute(attr, obj, default)

    @post_load
    def create_object(self, data):
        storage = self.context.get('storage', None)
        model = self.opts.model(storage, snapshots=('committed',), **data)
        return model.with_snapshots()

    @pre_dump
    def select_snapshots(self, instance):
        snapshots = self.context.get('snapshots', None)
        if snapshots is not None:
            instance = instance.with_snapshots(snapshots)
        return instance

    @post_dump
    def order_keys(self, data):
        """
        Create ordered dictionaries sorted by key. We do this here instead of
        using the sort_keys parameter of json.dumps, so that object keys are
        sorted, while collections can maintain their insertion order
        """
        return OrderedDict((item for item in sorted(iteritems(data))))

    def _do_load(self, data, many=None, *args, **kwargs):
        # support the case where we have only a single field to load and we get
        # it directly rather than wrapped in a dict. this happens when loading
        # a relationship with a single field in 'only'
        many = self.many if many is None else bool(many)
        if not many:
            data = self._wrap_only(data)
        elif isinstance(data, Sequence):
            data = [self._wrap_only(value) for value in data]

        result, errors = super(FileSerializer, self)._do_load(
            data, many, *args, **kwargs)

        # we need to wrap the result of a many load in a ModelCollection, but
        # post_load(pass_many=True) processors are called before the Model
        # instances are created in the post_load(pass_many=False) processor
        if many:
            result = self.opts.model.collection(result)
        return result, errors

    def _wrap_only(self, data):
        if self.only and len(self.only) == 1 and not isinstance(data, dict):
            data = {
                # only can be an OrderedSet which doesn't support indexing
                next(iter(self.only)): data
            }
        return data
