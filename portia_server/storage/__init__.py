from django.conf import settings
from django.utils.module_loading import import_string

from .storage import GitStorage


def create_storage(project_id, author, branch):
    storage_class = import_string(settings.PORTIA_DATA_STORAGE)
    return storage_class(project_id, author=author, branch=branch)
