import json
from os.path import splitext, split
from .repoman import Repoman
from slyd.projectspec import ProjectSpec


class GitProjectSpec(ProjectSpec):

    def __init__(self, *args, **kwargs):
        ProjectSpec.__init__(self, *args, **kwargs)
        self.project_dir = ''

    def _open_repo(self):
        return Repoman.open_repo(self.project_name)

    def list_spiders(self):
        files = self._open_repo().list_files_for_branch(self.user)
        return [splitext(split(f)[1])[0] for f in files
            if f.startswith("spiders") and f.endswith(".json")]
            
    def rename_spider(self, from_name, to_name):
        self._open_repo().rename_file(self._rfilename('spiders', from_name),
            self._rfilename('spiders', to_name), self.user)

    def remove_spider(self, name):
        self._open_repo().delete_file(
            self._rfilename('spiders', name), self.user)

    def _rfile_contents(self, resources):
        return self._open_repo().file_contents_for_branch(
            self._rfilename(*resources), self.user)

    def resource(self, *resources):
        return json.loads(self._rfile_contents(resources))

    def writejson(self, outf, *resources):
        outf.write(self._rfile_contents(resources))

    def savejson(self, obj, resources):
        self._open_repo().save_file(self._rfilename(*resources),
            json.dumps(obj, sort_keys=True, indent=4), self.user)