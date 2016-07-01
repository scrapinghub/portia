import json
import logging
import os

from scrapely.htmlpage import HtmlPage
from scrapy import signals
from scrapy.exceptions import NotConfigured
from scrapy.utils.request import request_fingerprint
from scrapy.utils.project import data_path
from slybot.plugins.scrapely_annotations.annotations import _CLUSTER_NA


class PersistentClusteringMiddleware(object):
    def __init__(self, directory, reset=False, stats=None):
        try:
            import anydbm as _dbm
        except ImportError:
            import dbm as _dbm
        self.dbmodule = _dbm
        self.directory = directory
        self.reset = reset
        self.stats = stats
        self.clustering_enabled = False

    @classmethod
    def from_crawler(cls, crawler):
        s = crawler.settings
        if not s.getbool('PERSISTENT_PAGE_CLUSTERING'):
            raise NotConfigured
        directory = data_path(s.get('CLUSTERING_DIR', 'clustering'))
        reset = s.getbool('CLUSTERING_RESET')
        o = cls(directory, reset, crawler.stats)
        crawler.signals.connect(o.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(o.spider_closed, signal=signals.spider_closed)
        return o

    def spider_opened(self, spider):
        try:
            clustering = spider.plugins['Annotations'].clustering
            assert bool(clustering) == True
            self.clustering_enabled = True
        except (KeyError, AttributeError, AssertionError):
            logging.warning('Persistent page clustering has not been enabled '
                            'because page clustering is not enabled for this '
                            'spider')
            return
        if not os.path.exists(self.directory):
            os.makedirs(self.directory)
        dbpath = os.path.join(self.directory, spider.name)
        flag = 'n' if self.reset else 'c'
        self.db = self.dbmodule.open(dbpath, flag=flag)
        for data in getattr(self.db, 'itervalues', self.db.values)():
            page, encoding = json.loads(data)
            clustering.add_page(HtmlPage(body=page.decode(encoding)))

    def spider_closed(self, spider):
        self.db.close()

    def process_spider_output(self, response, result, spider):
        """Store page tag details if page clustering was not available."""
        saved = False
        for out in result:
            if (not saved and self.clustering_enabled and
                    hasattr(out, 'get') and
                    out.get('_template_cluster') == _CLUSTER_NA):
                key = request_fingerprint(response.request)
                logging.debug('Saving %s for clustering on next crawl',
                              response.request)
                self.db[key] = json.dumps([response.body_as_unicode(),
                                           response.encoding])
                saved = True
            yield out
