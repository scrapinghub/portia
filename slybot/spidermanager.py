import os, json

from zope.interface import implements
from scrapy.interfaces import ISpiderManager

from slybot.spider import IblSpider

class SlybotSpiderManager(object):

    implements(ISpiderManager)

    def __init__(self, datadir):
        self.datadir = datadir

    @classmethod
    def from_crawler(cls, crawler):
        datadir = crawler.settings['PROJECT_DIR']
        return cls(datadir)

    def create(self, name, **args):
        with open(os.path.join(self.datadir, 'spiders', '%s.json' % name)) as f:
            spec = json.load(f)
        with open(os.path.join(self.datadir, 'extractors.json')) as f:
            extractors = json.load(f)
        items = self._load_items()
        return IblSpider(name, spec, items, extractors, **args)

    def list(self):
        return os.listdir(self.datadir)

    def _load_items(self):
        items = {}
        itemsdir = os.path.join(self.datadir, 'items')
        for name in os.listdir(itemsdir):
            with open(os.path.join(itemsdir, '%s.json' % name)) as f:
                items[name] = json.load(f)
        return items
