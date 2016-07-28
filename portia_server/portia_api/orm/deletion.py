from collections import OrderedDict

from .exceptions import ProtectedError
from .relationships import HasMany

__all__ = [
    'Collector',
    'CASCADE',
    'CLEAR',
    'PROTECT'
]


class Collector(set):
    def __init__(self):
        super(Collector, self).__init__()
        self.save = OrderedDict()
        self.delete = []

    def save_instance(self, instance, *fields):
        if instance in self.delete:
            return
        elif instance in self.save:
            self.save[instance].update(fields)
        else:
            self.save[instance] = set(fields)

    def delete_instance(self, instance):
        if instance in self.delete:
            return
        if instance in self.save:
            del self.save[instance]
        self.delete.append(instance)


def CASCADE(collector, instance, field_name, related_instance):
    field = instance._fields[field_name]
    if isinstance(field, HasMany):
        getattr(instance, field_name).discard(related_instance)
    else:
        setattr(instance, field_name, None)
    instance._stage_delete(collector)


def CLEAR(collector, instance, field_name, related_instance):
    field = instance._fields[field_name]
    if isinstance(field, HasMany):
        getattr(instance, field_name).discard(related_instance)
    else:
        setattr(instance, field_name, None)
    if not field.ignore_in_file:
        collector.save_instance(instance, field_name)


def PROTECT(collector, instance, field_name, related_instance):
    raise ProtectedError(
        u"Cannot delete model {} because it is referenced through a "
        u"protected relationship '{}' of model {}".format(
            related_instance, field_name, instance))
