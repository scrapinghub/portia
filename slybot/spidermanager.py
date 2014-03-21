import tempfile, shutil, atexit
from zipfile import ZipFile

from zope.interface import implements
from scrapy.interfaces import ISpiderManager
from scrapy.utils.misc import load_object

from slybot.spider import IblSpider
from slybot.utils import open_project_from_dir

class SlybotSpiderManager(object):

    implements(ISpiderManager)

    def __init__(self, datadir, spider_cls=None):
        self.spider_cls = load_object(spider_cls) if spider_cls else IblSpider
        self._specs = open_project_from_dir(datadir)

    @classmethod
    def from_crawler(cls, crawler):
        datadir = crawler.settings['PROJECT_DIR']
        spider_cls = crawler.settings['SLYBOT_SPIDER_CLASS']
        return cls(datadir, spider_cls)

    def create(self, name, **args):
        spec = self._specs["spiders"][name]
        items = self._specs["items"]
        extractors = self._specs["extractors"]
        return self.spider_cls(name, spec, items, extractors, **args)

    def list(self):
        return self._specs["spiders"].keys()

class ZipfileSlybotSpiderManager(SlybotSpiderManager):

    def __init__(self, datadir, zipfile=None, spider_cls=None):
        if zipfile:
            datadir = tempfile.mkdtemp(prefix='slybot-')
            ZipFile(zipfile).extractall(datadir)
            atexit.register(shutil.rmtree, datadir)
        super(ZipfileSlybotSpiderManager, self).__init__(datadir, spider_cls)

    @classmethod
    def from_crawler(cls, crawler):
        s = crawler.settings
        sm = cls(s['PROJECT_DIR'], s['PROJECT_ZIPFILE'], s['SLYBOT_SPIDER_CLASS'])
        return sm
