import requests

from configparser import ConfigParser
from urllib.parse import urljoin

from django.conf import settings as app_settings
from portia_api.jsonapi.exceptions import JsonApiGeneralException

from .base import BaseDeploy


class ScrapydDeploy(BaseDeploy):
    def _get_config(self):
        conf = ConfigParser()
        conf.read_dict(self._get_config_defaults())
        if getattr(app_settings, 'SCRAPYD_CFG_DEFAULT', None):
            conf.read(app_settings.SCRAPYD_CFG_DEFAULT)
        try:
            scrapy_cfg = self.storage.open('scrapy.cfg').read().decode('utf-8')
            conf.read_string(scrapy_cfg)
        except OSError:
            pass
        return conf

    def _get_config_defaults(self):
        deploy_settings = [
            ('username', 'SCRAPYD_USERNAME'),
            ('password', 'SCRAPYD_PASSWORD'),
            ('url', 'SCRAPYD_URL'),
        ]
        deploy_defaults = {}
        for default, setting in deploy_settings:
            setting = getattr(app_settings, setting, None)
            if setting is not None:
                deploy_defaults[default] = setting
        defaults = {
            'deploy': deploy_defaults,
            'deploy:default': {
                'project': self.project.name,
                'version': self.project.version,
            },
        }
        return defaults

    def deploy(self, target='default'):
        cfg = dict(self.config.items('deploy'))
        cfg.update(self.config.items('deploy:default'))
        if target and self.config.has_section('deploy:{}'.format(target)):
            cfg.update(self.config.items('deploy:{}'.format(target)))
        data = {
            'project': cfg['project'],
            'version': cfg['version'],
        }
        files = {
            'egg': ('project.egg', self.build_archive())
        }
        url = urljoin(cfg['url'], '/addversion.json')
        user = cfg.get('username')
        if user:
            auth = (user, cfg.get('password', ''))
        else:
            auth = None
        requests.post(url, data=data, files=files, auth=auth)
        return {
            'message': 'Your deploy completed successfully',
        }

    def schedule(self, spider, args=None, settings=None, target=None):
        schedule_data = self._schedule_data(
            spider, self._schedule_data(spider, args))
        request = requests.post(
            urljoin(app_settings.SCRAPYD_URL, 'schedule.json'),
            data=schedule_data)
        if request.status_code != 200:
            raise JsonApiGeneralException(
                request.status_code, request.content)
        data = {}
        data.setdefault('meta', {})['scheduled'] = True
        return data

    def _schedule_data(self, spider_id, args):
        data = {
            'project': self.project.id,
            'spider': spider_id
        }
        if self.storage.version_control:
            branch = self.query.get('branch', None)
            commit = self.query.get('commit_id', None)
            if not branch and self.storage.repo.has_branch(self.user.username):
                branch = self.user.username
            self.storage.checkout(commit, branch)
            commit_id = self.storage._commit.id
            data['version'] = commit_id
        return data
