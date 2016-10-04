from __future__ import unicode_literals

from django.db.models import (Model, BinaryField, BigIntegerField,
                              PositiveSmallIntegerField, CharField)
from django.db.models.expressions import Func, Value


class PositiveTinyIntegerField(PositiveSmallIntegerField):
    def db_type(self, connection):
        if connection.vendor == 'mysql':
            return "tinyint(1) unsigned"
        else:
            return super(PositiveTinyIntegerField, self).db_type(connection)


class PositiveBigIntegerField(BigIntegerField):
    def db_type(self, connection):
        if connection.vendor == 'mysql':
            return "bigint(20) unsigned"
        else:
            return super(PositiveBigIntegerField, self).db_type(connection)


class RealBinaryField(BinaryField):
    def db_type(self, connection):
        if connection.vendor == 'mysql':
            return "binary({})".format(self.max_length)
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
    oid = RealBinaryField(max_length=40, default='\0' * 40, null=False)
    repo = CharField(max_length=64, null=False)
    type = PositiveTinyIntegerField(null=False, db_index=True)
    size = PositiveBigIntegerField(null=False, db_index=True)
    data = CompressedBinaryField(null=False)

    class Meta(object):
        unique_together = (('oid', 'repo'),)
        db_table = 'objs'


class Refs(Model):
    ref = CharField(max_length=100, default='', null=False)
    repo = CharField(max_length=64, null=False)
    value = RealBinaryField(max_length=40, null=False, db_index=True)

    class Meta(object):
        unique_together = (('ref', 'repo'),)
        db_table = 'refs'
