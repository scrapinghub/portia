from __future__ import unicode_literals

from django.apps import AppConfig
from django.conf import settings


class StorageConfig(AppConfig):
    name = 'storage'

    def ready(self):
        if settings.PORTIA_DATA_STORAGE == 'storage.storage.GitStorage':
            from .repoman import Repoman
            Repoman.setup(settings.REPO_BACKEND)
