from slyd.gitstorage.repoman import Repoman
from slyd.gitstorage.projectspec import GitProjectSpec
from slyd.dash.dashclient import search_spider_names
from slyd.errors import BadRequest


class ProjectSpec(GitProjectSpec):

    @classmethod
    def setup(cls, storage_backend, location, dash_url, **kwargs):
        GitProjectSpec.setup(storage_backend, location)

    def __init__(self, *args, **kwargs):
        GitProjectSpec.__init__(self, *args, **kwargs)

    def rename_spider(self, from_name, to_name):
        if from_name == to_name:
            return
        if to_name in search_spider_names(self.project_name,
                                          self.auth_info['service_token']):
            raise BadRequest('Bad Request', 'Spider already exists with the '
                             'name, "%s"' % to_name)
        return super(ProjectSpec, self).rename_spider(from_name, to_name)
