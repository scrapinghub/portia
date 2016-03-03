import json

from os.path import join
from .repoman import Repoman
from slyd.projectspec import ProjectSpec
from slyd.gitstorage.projects import retry_operation, GitProjectMixin
from slyd.errors import BadRequest


class GitProjectSpec(GitProjectMixin, ProjectSpec):
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
                repo.delete_file(file_path, branch)
        repo.delete_file(self._rfile_name('spiders', name), branch)

    def remove_template(self, spider_name, name, save_spider=True):
        try:
            self._open_repo().delete_file(
                self._rfile_name('spiders', spider_name, name),
                self._get_branch())
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

    @retry_operation(catches=(KeyError,), seconds=0.5)
    def savejson(self, obj, resources):
        self._open_repo().save_file(self._rfile_name(*resources),
                                    json.dumps(obj, sort_keys=True, indent=4),
                                    self._get_branch())
