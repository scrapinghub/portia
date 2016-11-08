from __future__ import absolute_import
import tempfile
import shutil
import atexit
import logging

import slybot

from zipfile import ZipFile

from zope.interface import implementer
from scrapy.interfaces import ISpiderManager
from scrapy.utils.misc import load_object
from scrapy.utils.project import get_project_settings

from slybot.spider import IblSpider
from slybot.utils import open_project_from_dir, load_plugins


@implementer(ISpiderManager)
class SlybotSpiderManager(object):

    def __init__(self, datadir, spider_cls=None, settings=None, **kwargs):
        logging.info('Slybot %s Spider', slybot.__version__)
        if settings is None:
            settings = get_project_settings()
        self.spider_cls = load_object(spider_cls) if spider_cls else IblSpider
        self._specs = open_project_from_dir(datadir)
        settings = settings.copy()
        settings.frozen = False
        settings.set('LOADED_PLUGINS', load_plugins(settings))
        self.settings = settings

    @classmethod
    def from_crawler(cls, crawler):
        # backwards compatibility with Scrapy < 0.25
        return cls.from_settings(crawler.settings)

    @classmethod
    def from_settings(cls, settings):
        datadir = settings['PROJECT_DIR']
        spider_cls = settings['SLYBOT_SPIDER_CLASS']
        return cls(datadir, spider_cls, settings=settings)

    def load(self, spider_name):
        spec = self._specs["spiders"][spider_name]
        items = self._specs["items"]
        extractors = self._specs["extractors"]

        class SlybotSpider(self.spider_cls):
            def __init__(self_, **kwargs):
                super(SlybotSpider, self_).__init__(spider_name, spec, items,
                                                    extractors, self.settings,
                                                    **kwargs)

        return SlybotSpider

    def create(self, name, **args):
        # backwards compatibility with Scrapy < 0.25
        spec = self._specs["spiders"][name]
        items = self._specs["items"]
        extractors = self._specs["extractors"]
        return self.spider_cls(name, spec, items, extractors, self.settings,
                               **args)

    def list(self):
        return list(self._specs["spiders"].keys())

    def find_by_request(self, request):
        """Placeholder to meet SpiderManager interface"""
        raise NotImplementedError()


class ZipfileSlybotSpiderManager(SlybotSpiderManager):

    def __init__(self, datadir, zipfile=None, spider_cls=None, settings=None,
                 **kwargs):
        if zipfile:
            datadir = tempfile.mkdtemp(prefix='slybot-')
            ZipFile(zipfile).extractall(datadir)
            atexit.register(shutil.rmtree, datadir)
        super(ZipfileSlybotSpiderManager, self).__init__(datadir, spider_cls,
                                                         settings=settings)

    @classmethod
    def from_settings(cls, settings):
        datadir = settings['PROJECT_DIR']
        zipfile = settings['PROJECT_ZIPFILE']
        spider_cls = settings['SLYBOT_SPIDER_CLASS']
        return cls(datadir, zipfile, spider_cls, settings=settings)
