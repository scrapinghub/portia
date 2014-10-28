from scrapy.utils.misc import load_object


class AuthManager(object):

    def __init__(self, settings):
        self.settings = settings
        auth_settings = settings.get('AUTH_CONFIG', {})
        self.auth_method = load_object(
            auth_settings.get('CALLABLE', 'slyd.dummyauth.protectResource'))
        self.config = auth_settings.get('CONFIG', {})

    def protectResource(self, resource):
        return self.auth_method(resource, config=self.config)
