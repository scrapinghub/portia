from slyd.gitstorage import Repoman
from slyd.gitstorage.projectspec import GitProjectSpec


class ProjectSpec(GitProjectSpec):

    @classmethod
    def setup(cls, storage_backend, location, dash_url):
        GitProjectSpec.setup(storage_backend, location)

    def __init__(self, *args, **kwargs):
        GitProjectSpec.__init__(self, *args, **kwargs)
