import json
import os
from os.path import splitext, split, join
from .repoman import Repoman
from slyd.projectspec import ProjectSpec


class GitProjectSpec(ProjectSpec):

    @classmethod
    def setup(cls, storage_backend, location):
        Repoman.setup(storage_backend, location)

    def _open_repo(self):
        return Repoman.open_repo(self.project_name)

    def _get_branch(self, read_only=False):
        repo = self._open_repo()
        if repo.has_branch(self.user):
            return self.user
        elif not read_only:
            repo.create_branch(self.user, repo.get_branch('master'))
            return self.user
        else:
            return 'master'

    def _rfile_contents(self, resources):
        return self._open_repo().file_contents_for_branch(
            self._rfile_name(*resources), self._get_branch(read_only=True))

    def _rfile_name(self, *resources):
        return join(*resources) + '.json'

    def list_spiders(self):
        files = self._open_repo().list_files_for_branch(
            self._get_branch(read_only=True))
        return [splitext(split(f)[1])[0] for f in files
                if f.startswith("spiders") and f.count(os.sep) == 1
                and f.endswith(".json")]

    def rename_spider(self, from_name, to_name):
        self._open_repo().rename_file(self._rfile_name('spiders', from_name),
                                      self._rfile_name('spiders', to_name),
                                      self._get_branch())

    def remove_spider(self, name):
        self._open_repo().delete_file(
            self._rfile_name('spiders', name), self._get_branch())

    def remove_template(self, spider_name, name):
        try:
            self._open_repo().delete_file(
                self._rfile_name('spiders', spider_name, name),
                self._get_branch())
        except KeyError:
            pass
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
        self._open_repo().save_file(self._rfile_name(*resources),
                                    json.dumps(obj, sort_keys=True, indent=4),
                                    self._get_branch())
