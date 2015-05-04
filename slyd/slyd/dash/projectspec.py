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
        if not self._new_spider(from_name):
            raise BadRequest('Rename Forbidden',
                             'The spider, "%s", cannot be renamed. Only '
                             'spiders that have not yet been published may be '
                             'renamed.' % from_name)

        if from_name == to_name:
            return
        if to_name in search_spider_names(self.project_name,
                                          self.auth_info['service_token']):
            raise BadRequest('Bad Request', 'A spider already exists with the '
                             'name, "%s".' % to_name)
        return super(ProjectSpec, self).rename_spider(from_name, to_name)

    def _new_spider(self, name):
        repoman = self._open_repo()
        current = set(repoman.list_files_for_branch(self._get_branch()))
        master = set(repoman.list_files_for_branch('master'))
        return self._rfile_name('spiders', name) in current - master
