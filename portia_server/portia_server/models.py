from __future__ import unicode_literals

import getpass
import socket

from django.db.models.fields import CharField
from django.contrib.auth.models import AnonymousUser
from django.utils.encoding import python_2_unicode_compatible


@python_2_unicode_compatible
class LocalUser(AnonymousUser):
    is_active = True
    default_username = getpass.getuser()

    # add this so that the methods in django.contrib.auth that expect a user
    # model with a pk field work correctly
    class _meta:
        pk = CharField()
        pk.set_attributes_from_name('pk')

    def __init__(self, **kwargs):
        super(LocalUser, self).__init__()
        self.username = kwargs.get('username', self.default_username)
        if not hasattr(self, 'id'):
            self.id = None

    @property
    def pk(self):
        return self.id

    def __str__(self):
        return 'LocalUser({})'.format(self.username)

    def __eq__(self, other):
        return isinstance(other, self.__class__) and other.id == self.id

    def __hash__(self):
        hash(self.id)

    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True

    def save(self, *args, **kwargs):
        pass
