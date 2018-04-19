import json
import os

from six import StringIO
from urllib.parse import urljoin

from django.conf import settings as app_settings
from rest_framework import status
from shub import exceptions
from shub.config import ShubConfig
from shub.schedule import schedule_spider
from shub.utils import make_deploy_request
from portia_api.jsonapi.exceptions import JsonApiGeneralException
from storage.projecttemplates import templates

from .base import BaseDeploy


class ScrapinghubDeploy(BaseDeploy):
    SHUB_DOCS_URL = 'https://shub.readthedocs.io/en/stable/configuration.html'
    EXCEPTIONS = (
        exceptions.InvalidAuthException,  # EX_NOPERM
        exceptions.RemoteErrorException,  # EX_PROTOCOL
    )
    STATUS_CODES = {
        os.EX_UNAVAILABLE: status.HTTP_404_NOT_FOUND,
        os.EX_PROTOCOL: status.HTTP_503_SERVICE_UNAVAILABLE,
    }

    def _get_config(self):
        conf = ShubConfig()
        conf.load(StringIO(json.dumps(self._default_config())))
        if 'SHUB_APIKEY' in os.environ:
            conf.apikeys['default'] = os.environ['SHUB_APIKEY']
        try:
            conf.load(self.storage.open('scrapinghub.yml'))
        except OSError:
            raise ('Need a `scrapinghub.yml` file to identify which project '
                   'to deploy to. Find more information at: {}'.format(
                    self.SHUB_DOCS_URL
                   ))
        return conf

    def _default_config(self):
        config = {
            'stack': 'scrapy:1.5-py-latest',
        }
        if getattr(app_settings, 'SCRAPINGHUB_APIKEY', None):
            config['apikeys'] = {
                'default': app_settings.SCRAPINGHUB_APIKEY,
            }
        return config

    def deploy(self, target='default'):
        try:
            conf = self.config.get_target_conf(target)
            archive = self.build_archive()
            data = {
                'project': conf.project_id,
                'version': self.project.version,
                'stack': conf.stack
            }
            files = [('egg', archive)]
            if conf.requirements_file:
                try:
                    file = self.storage.open(conf.requirements_file)
                except OSError:
                    file = StringIO(templates['REQUIREMENTS'])
                files.append(('requirements', file))
            make_deploy_request(
                urljoin(conf.endpoint, 'scrapyd/addversion.json'),
                data, files, (conf.apikey, ''), False, False)
        except self.EXCEPTIONS as e:
            raise JsonApiGeneralException(
                e.format_message(),
                self.STATUS_CODES.get(getattr(e, 'exit_code', None), 500),
            )
        return {
            'message': 'Your deploy completed successfully',
        }

    def schedule(self, spider, args=None, settings=None, target='default'):
        try:
            conf = self.config.get_target_conf(target)
            schedule_spider(
                conf.project_id, conf.endpoint, conf.apikey, spider,
                arguments=args or (), settings=settings or ())
        except self.EXCEPTIONS as e:
            raise JsonApiGeneralException(
                e.format_message(),
                self.STATUS_CODES.get(getattr(e, 'exit_code', None), 500),
            )
