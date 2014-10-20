from os.path import join
from scrapy.utils.misc import load_object


class ConfigManager(object):

    def __init__(self, settings):
        self.settings = settings
        self.basedir = self.settings['SPEC_DATA_DIR']
        self.supports_version_control = self.settings.get(
            'VERSION_CONTROL', False)
        protect_method = self.settings.get(
            'PORTIA_AUTH', 'slyd.dummyauth.protectResource')
        self.resource_protector = load_object(protect_method)
        self.spec_class = load_object(self.settings['PROJECT_SPEC'])
        self.manager_class = load_object(self.settings['PROJECT_MANAGER'])

    def project_spec(self, project, auth_info):
        return self.spec_class(str(project), join(self.basedir, str(project)), auth_info)

    def project_manager(self, auth_info):
        return self.manager_class(self.basedir, auth_info)

    def resource_protector(self):
        raise NotImplementedError





