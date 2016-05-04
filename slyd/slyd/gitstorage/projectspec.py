import json
import re

from os.path import join
from .repoman import Repoman, CHANGE_DELETE
from slyd.projectspec import ProjectSpec
from slyd.gitstorage.projects import GitProjectMixin
from slyd.errors import BadRequest


class GitProjectSpec(GitProjectMixin, ProjectSpec):

    def __init__(self, project_name, auth_info):
        super(GitProjectSpec, self).__init__(project_name, auth_info)
        self._changed_file_data = {}

    @classmethod
    def setup(cls, storage_backend, location, **kwargs):
        Repoman.setup(storage_backend, location)

    def _rfile_contents(self, resources):
        return self._open_repo().file_contents_for_branch(
            self._rfile_name(*resources), self._get_branch(read_only=True))

    def _rfile_name(self, *resources):
        return join(*resources) + '.json'

    def rename_spider(self, from_name, to_name):
        if to_name == from_name:
            return
        if not re.match('^[a-zA-Z0-9][a-zA-Z0-9_\.-]*$', to_name):
            raise BadRequest('Bad Request', 'Invalid spider name')

        if to_name in self.list_spiders():
            raise BadRequest('Bad Request', 'A spider already exists with the '
                             'name, "%s".' % to_name)
        self._open_repo().rename_file(self._rfile_name('spiders', from_name),
                                      self._rfile_name('spiders', to_name),
                                      self._get_branch())
        self._open_repo().rename_folder(join('spiders', from_name),
                                        join('spiders', to_name),
                                        self._get_branch())

    def remove_spider(self, name):
        repo, branch = self._open_repo(), self._get_branch()
        for file_path in repo.list_files_for_branch(branch):
            split_path = file_path.split('/')
            if len(split_path) > 2 and split_path[1] == name:
                self.delete_file(file_path)
        self.delete_file(self._rfile_name('spiders', name))

    def remove_template(self, spider_name, name, save_spider=True):
        try:
            self.delete_file(self._rfile_name('spiders', spider_name, name))
        except KeyError:
            pass
        if save_spider:
            spider = self.spider_json(spider_name)
            try:
                spider['template_names'].remove(name)
            except ValueError:
                pass
            self.savejson(spider, ['spiders', spider_name])

    def resource(self, *resources):
        return json.loads(self._rfile_contents(resources))

    def writejson(self, outf, *resources):
        outf.write(self._rfile_contents(resources))

    def savejson(self, obj, resources):
        self._changed_file_data[self._rfile_name(*resources)] = (
            json.dumps(obj, sort_keys=True, indent=4),
            'update'
        )

    def delete_file(self, path):
        self._changed_file_data[path] = (None, CHANGE_DELETE)

    def commit_changes(self):
        if not self._changed_file_data:
            return
        repo = self._open_repo()
        repo.save_files(self._changed_file_data, self._get_branch())
