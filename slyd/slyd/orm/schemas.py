from collections import OrderedDict, Sequence

from marshmallow import schema
from six import iteritems

from slyd.orm.decorators import pre_dump, post_dump, pre_load, post_load
from slyd.orm.utils import unwrap_envelopes, wrap_envelopes

__all__ = [
    'BaseFileSchema',
]


class FileSchemaOpts(schema.SchemaOpts):
    def __init__(self, meta):
        super(FileSchemaOpts, self).__init__(meta)
        if meta is schema.BaseSchema.Meta:
            return

        self.strict = True
        # make marshmallow use OrderedDicts, so that collections of enveloped
        # objects maintain their order when loaded
        self.ordered = True
        # the model from which the Schema was created, required
        self.model = getattr(meta, 'model')
        # whether to wrap the output in an envelope keyed by primary key
        self.envelope = getattr(meta, 'envelope', False)
        if not isinstance(self.envelope, bool):
            raise ValueError("'envelope' option must be a boolean.")
        # whether to remove the key from the body of the enveloped object
        self.envelope_remove_key = getattr(meta, 'envelope_remove_key', False)
        if not isinstance(self.envelope_remove_key, bool):
            raise ValueError("'envelope_remove_key' option must be a boolean.")


class BaseFileSchema(schema.Schema):
    OPTIONS_CLASS = FileSchemaOpts

    def __init__(self, envelope=None, envelope_remove_key=None,
                 *args, **kwargs):
        super(BaseFileSchema, self).__init__(*args, **kwargs)
        self.envelope = (envelope
                         if envelope is not None
                         else self.opts.envelope)
        self.envelope_remove_key = (envelope_remove_key
                                    if envelope_remove_key is not None
                                    else self.opts.envelope_remove_key)

    def __getattr__(self, item):
        # try to resolve missing attributes from the model
        return getattr(self.opts.model, item)

    def get_attribute(self, attr, obj, default):
        return super(BaseFileSchema, self).get_attribute(attr, obj, default)

    @pre_load(pass_many=True)
    def unwrap_envelopes(self, data, many):
        if self.envelope:
            return unwrap_envelopes(data, many, self.opts.model._pk_field,
                                    self.envelope_remove_key)
        return data

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

    @post_dump(pass_many=True)
    def wrap_envelopes(self, data, many):
        if self.envelope:
            return wrap_envelopes(data, many, self.opts.model._pk_field,
                                  self.envelope_remove_key)
        return data

    def _do_load(self, data, many=None, *args, **kwargs):
        # support the case where we have only a single field to load and we get
        # it directly rather than wrapped in a dict. this happens when loading
        # a relationship with a single field in 'only'
        many = self.many if many is None else bool(many)
        if not many:
            data = self._wrap_only(data)
        elif isinstance(data, Sequence):
            data = [self._wrap_only(value) for value in data]

        result, errors = super(BaseFileSchema, self)._do_load(
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
