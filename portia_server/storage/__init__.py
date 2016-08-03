from django.conf import settings
from django.utils.module_loading import import_string

__all__ = [
    'get_storage_class',
    'create_project_storage',
]

storage_class = None


def get_storage_class():
    global storage_class
    if storage_class is None and settings.PORTIA_STORAGE_BACKEND:
        storage_class = import_string(settings.PORTIA_STORAGE_BACKEND)
        storage_class.setup()
    return storage_class


def create_project_storage(project_id, author=None, branch=None):
    storage_class = get_storage_class()
    return storage_class(project_id, author=author)
