from os.path import join
from .crawlerspec import GitProjectSpec, ProjectSpec
from .projects import GitProjectsManager, ProjectsManager
from scrapy.utils.misc import load_object


class ConfigManager(object):

    def __init__(self, settings, use_git_storage=False):
        self.settings = settings
        self.use_git = use_git_storage
        settings_key = self.use_git and 'GIT_SPEC_DATA_DIR' or 'SPEC_DATA_DIR'
        self.basedir = self.settings[settings_key]
        if self.settings.get('PORTIA_AUTH'):
            self.resource_protector = load_object(self.settings['PORTIA_AUTH'])

    def project_spec(self, project, auth_info):
        project_spec_class = self.use_git and GitProjectSpec or ProjectSpec
        return project_spec_class(str(project), join(self.basedir, str(project)), auth_info)

    def project_manager(self, auth_info):
        manager_class = self.use_git and GitProjectsManager or ProjectsManager
        return manager_class(self.basedir, auth_info)

    def resource_protector(self):
        raise NotImplementedError





