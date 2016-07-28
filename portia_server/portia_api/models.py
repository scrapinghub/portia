from __future__ import unicode_literals

from django.db.models import (Model, BinaryField, BigIntegerField,
                              SmallIntegerField, CharField)
from django.db.models.expressions import Func, Value


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


class Objs(Model):
    oid = RealBinaryField(max_length=40, primary_key=True)
    repo = CharField(max_length=64, db_index=True)
    type = TinyIntegerField(db_index=True)
    size = BigIntegerField()
    data = CompressedBinaryField()

    class Meta(object):
        unique_together = (('oid', 'repo'),)
        index_together = (('oid', 'repo'),)
        db_table = 'objs'


class Refs(Model):
    ref = CharField(max_length=100, primary_key=True)
    repo = CharField(max_length=64, db_index=True)
    value = RealBinaryField(max_length=40, db_index=True)

    class Meta(object):
        unique_together = (('ref', 'repo'),)
        index_together = (('ref', 'repo'),)
        db_table = 'refs'
