from scrapy.utils.misc import load_object


class SpecManager(object):

    def __init__(self, settings):
        self.settings = settings

        factory_settings = settings['SPEC_FACTORY']
        self.spec_class = load_object(factory_settings['PROJECT_SPEC'])
        plugins = []
        for plugin in settings['PLUGINS']:
            options = plugin['options']
            if 'name' not in options:
                options['name'] = plugin['ui'].split('.')[-1]
            plugins.append((load_object(plugin['web']), options))

        self.spec_class.setup(**factory_settings['PARAMS'])
        self.spec_class.plugins = plugins
        self.manager_class = load_object(factory_settings['PROJECT_MANAGER'])
        self.manager_class.setup(**factory_settings['PARAMS'])
        self.capabilities = factory_settings.get('CAPABILITIES', {})
        self.customizations = factory_settings.get('CUSTOM', {})
        self.capabilities['plugins'] = [
            {'component': p['ui'], 'options': p.get('options', {})}
            for p in factory_settings.get('PLUGINS', settings['PLUGINS'])]
        if 'API_ROUTES' in factory_settings:
            self.api_routes = load_object(factory_settings['API_ROUTES'])

    def project_spec(self, project, auth_info):
        return self.spec_class(str(project), auth_info)

    def project_manager(self, auth_info):
        return self.manager_class(auth_info)
