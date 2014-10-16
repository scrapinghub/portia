from .crawlerspec import GitProjectSpec, ProjectSpec
from .projects import GitProjectsManager, ProjectsManager


class ConfigManager(object):

    def __init__(self, settings, use_git_storage=False):
        self.settings = settings
        self.use_git = use_git_storage
        settings_key = self.use_git and 'GIT_SPEC_DATA_DIR' or 'SPEC_DATA_DIR'
        self.basedir = self.settings[settings_key]

    def project_spec_class(self):
        return self.use_git and GitProjectSpec or ProjectSpec

    def project_spec(self, project, user):
        spec = GitProjectSpec(str(project)) if self.use_git else ProjectSpec(join(self.basedir, str(project)))
        spec.user = user
        return spec

    def project_manager(self, request):
        manager_class = self.use_git and GitProjectsManager or ProjectsManager
        return manager_class(self.basedir, request.user,
            request.authorized_projects, request.apikey)
