"""
This extension closes spiders after they have been crawling inefficiently for a
while
Each SLYCLOSE_SPIDER_CHECK_PERIOD seconds, it checks that at least SLYCLOSE_SPIDER_PERIOD_ITEMS
have been extracted along the last time interval of same length.
"""

from twisted.internet import task

from scrapy.xlib.pydispatch import dispatcher
from scrapy import signals
from scrapy.exceptions import NotConfigured

DEFAULT_CHECK_PERIOD = 3600
DEFAULT_PERIOD_MIN_ITEMS = 200


class SlybotCloseSpider(object):

    def __init__(self, crawler):
        if not crawler.settings.getbool("SLYCLOSE_SPIDER_ENABLED"):
            raise NotConfigured

        self.crawler = crawler
        self.check_period = crawler.settings.getint("SLYCLOSE_SPIDER_CHECK_PERIOD", DEFAULT_CHECK_PERIOD)
        self.period_items = crawler.settings.getint("SLYCLOSE_SPIDER_PERIOD_ITEMS", DEFAULT_PERIOD_MIN_ITEMS)

        self.items_in_period = 0

        dispatcher.connect(self.spider_opened, signal=signals.spider_opened)
        dispatcher.connect(self.spider_closed, signal=signals.spider_closed)
        dispatcher.connect(self.item_scraped, signal=signals.item_scraped)

    def spider_opened(self, spider):
        self.task = task.LoopingCall(self._check_crawled_items, spider)
        self.task.start(self.check_period, now=False)

    def spider_closed(self, spider):
        if self.task.running:
            self.task.stop()

    def item_scraped(self, item, spider):
        self.items_in_period += 1

    def _check_crawled_items(self, spider):
        if self.items_in_period >= self.period_items:
            self.items_in_period = 0
        else:
            spider.log("Closing spider because of low item throughput. Items in last period: %d" % self.items_in_period)
            self.crawler.engine.close_spider(spider, 'slybot_fewitems_scraped')

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)
