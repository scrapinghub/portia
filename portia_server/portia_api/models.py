from __future__ import unicode_literals

from django.db.models import (Model, BinaryField, BigIntegerField,
                              SmallIntegerField, CharField)


class TinyIntegerField(SmallIntegerField):
    def db_type(self, connection):
        if connection.settings_dict['ENGINE'] == 'django.db.backends.mysql':
            return "tinyint"
        else:
            return super(TinyIntegerField, self).db_type(connection)


class Objs(Model):
    oid = BinaryField(max_length=40, primary_key=True)
    repo = CharField(max_length=64, primary_key=True)
    type = TinyIntegerField(db_index=True)
    size = BigIntegerField(db_index=True)
    data = BinaryField()


class Refs(Model):
    ref = CharField(max_length=100, primary_key=True)
    repo = CharField(max_length=64, primary_key=True)
    value = BinaryField(max_length=40, db_index=True)
