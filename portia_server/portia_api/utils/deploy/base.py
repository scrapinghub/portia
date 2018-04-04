from portia_api.utils.download import ProjectArchiver


class BaseDeploy(object):
    def __init__(self, project):
        self.project = project
        self.storage = project.storage
        self.config = self._get_config()
        self.config.version = self.project.version

    def build_archive(self):
        return ProjectArchiver(self.storage, project=self.project).archive(
            egg_info=True)

    def _get_config(self):
        raise NotImplementedError

    def deploy(self, target=None):
        raise NotImplementedError

    def schedule(self, spider, args=None, settings=None, target=None):
        raise NotImplementedError
