from os.path import join
from scrapy.utils.misc import load_object


class SpecManager(object):

    def __init__(self, settings):
        self.settings = settings
        factory_settigs = settings['SPEC_FACTORY']
        self.spec_class = load_object(factory_settigs['PROJECT_SPEC'])
        self.spec_class.setup(**factory_settigs['PARAMS'])
        self.manager_class = load_object(factory_settigs['PROJECT_MANAGER'])
        self.manager_class.setup(**factory_settigs['PARAMS'])
        self.capabilities = factory_settigs.get('CAPABILITIES', {})

    def project_spec(self, project, auth_info):
        return self.spec_class(str(project), auth_info)

    def project_manager(self, auth_info):
        return self.manager_class(auth_info)
