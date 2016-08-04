from __future__ import unicode_literals

from django.db.models import (Model, BinaryField, BigIntegerField,
                              SmallIntegerField, CharField)
from django.db.models.base import ModelBase
from django.db.models.expressions import Func, Value
import six


class TinyIntegerField(SmallIntegerField):
    def db_type(self, connection):
        if connection.vendor == 'mysql':
            return "tinyint"
        else:
            return super(TinyIntegerField, self).db_type(connection)


class RealBinaryField(BinaryField):
    def db_type(self, connection):
        if connection.vendor == 'mysql':
            return "binary"
        else:
            return super(RealBinaryField, self).db_type(connection)


class CompressedBinaryField(BinaryField):
    def get_db_prep_save(self, value, connection):
        prepped_value = super(CompressedBinaryField, self).get_db_prep_save(
            value, connection)
        if connection.vendor == 'mysql':
            return Func(Value(prepped_value), function='COMPRESS')
        return prepped_value

    def select_format(self, compiler, sql, params):
        sql, params = super(CompressedBinaryField, self).select_format(
            compiler, sql, params)
        if compiler.connection.vendor == 'mysql':
            sql = 'UNCOMPRESS({})'.format(sql)
        return sql, params


class CompositePrimaryKeyModelBase(ModelBase):
    """
    Adds support for Model.Meta.composite_primary_key, adding it to Model._meta.
    """
    def __new__(cls, name, bases, attrs):
        attr_meta = attrs.get('Meta')
        composite_primary_key = getattr(attr_meta, 'composite_primary_key', ())
        if hasattr(attr_meta, 'composite_primary_key'):
            delattr(attr_meta, 'composite_primary_key')

        new_class = super(CompositePrimaryKeyModelBase, cls).__new__(
            cls, name, bases, attrs)

        meta = new_class._meta
        if meta.proxy:
            main_meta = meta
            while main_meta.proxy:
                main_meta = main_meta.proxy_for_model._meta
            meta.composite_primary_key = main_meta.composite_primary_key
        elif composite_primary_key:
            cpk_tuple = tuple(composite_primary_key)
            meta.composite_primary_key = cpk_tuple
        elif meta.pk:
            meta.composite_primary_key = (meta.pk.name,)
        else:
            meta.composite_primary_key = None

        return new_class


class CompositePrimaryKeyModel(six.with_metaclass(CompositePrimaryKeyModelBase,
                                                  Model)):
    class Meta:
        abstract = True

    def _do_update(self, base_qs, using, pk_val, values, update_fields,
                   forced_update):
        # Django doesn't support composite primary keys, so here it will do an
        # UPDATE <table> SET <field> = <value> [, ...] WHERE <pk_field> = <pk>
        # query.
        # That does not select the row uniquely and can cause an IntegrityError,
        # or in the worst case overwrite multiple rows :(
        # Here we modify the parameters to force it to select and update a
        # single row.
        meta = self._meta
        composite_primary_key = meta.composite_primary_key
        if composite_primary_key and len(composite_primary_key) > 1:
            base_qs = base_qs.filter(**{
                field: getattr(self, field)
                for field in self._meta.composite_primary_key
                if field != meta.pk.attname
            })
        return super(CompositePrimaryKeyModel, self)._do_update(
            base_qs, using, pk_val, values, update_fields, forced_update)


class Objs(CompositePrimaryKeyModel):
    oid = RealBinaryField(max_length=40, primary_key=True)
    repo = CharField(max_length=64, db_index=True)
    type = TinyIntegerField(db_index=True)
    size = BigIntegerField()
    data = CompressedBinaryField()

    class Meta(object):
        composite_primary_key = ('oid', 'repo')
        unique_together = (('oid', 'repo'),)
        index_together = (('oid', 'repo'),)
        db_table = 'objs'


class Refs(CompositePrimaryKeyModel):
    ref = CharField(max_length=100, primary_key=True)
    repo = CharField(max_length=64, db_index=True)
    value = RealBinaryField(max_length=40, db_index=True)

    class Meta(object):
        composite_primary_key = ('ref', 'repo')
        unique_together = (('ref', 'repo'),)
        index_together = (('ref', 'repo'),)
        db_table = 'refs'
