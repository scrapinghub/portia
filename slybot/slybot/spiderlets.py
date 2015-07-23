"""
Spider middleware for AS for completing the work made by AS with a "spiderlet" code

"""
from __future__ import absolute_import
import pkgutil, inspect

from scrapy.xlib.pydispatch import dispatcher
from scrapy import signals
from scrapy.exceptions import NotConfigured
from scrapy.http import Request


class DefaultSpiderlet(object):
    name = None

    def __init__(self, spider):
        self.spider = spider

    def process_request(self, request, response):
        return request

    def process_item(self, item, response):
        return item

    def process_start_request(self, request):
        return request

    def parse_login_page(self, response):
        return self.spider.parse_login_page(response)


def list_spiderlets(spiderlets_module_path):
    spiderlets_module = __import__(spiderlets_module_path, {}, {}, [''])
    seen_classes = set()
    for _, mname, _ in pkgutil.iter_modules(spiderlets_module.__path__):
        module = __import__(".".join([spiderlets_module_path, mname]), {}, {}, [''])
        for cls in [c for c in vars(module).values() if inspect.isclass(c)]:
            if cls in seen_classes:
                continue
            seen_classes.add(cls)
            name = getattr(cls, 'name', None)
            if name:
                yield cls


def _load_spiderlet(spiderlets_module_path, spider):
    for cls in list_spiderlets(spiderlets_module_path):
        if cls.name == spider.name:
            class _spiderlet_cls(cls, DefaultSpiderlet):
                pass
            spider.log("SpiderletMiddleware: loaded %s" % _spiderlet_cls.name)
            return _spiderlet_cls(spider)
    return DefaultSpiderlet(spider)


class SpiderletsMiddleware(object):
    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler.settings)

    def __init__(self, settings):
        self.annotating = "annotating" in settings.getlist('SHUB_JOB_TAGS')
        self.spiderlets_module_path = settings["SPIDERLETS_MODULE"]
        if not self.spiderlets_module_path:
            raise NotConfigured
        dispatcher.connect(self.spider_opened, signals.spider_opened)

    def spider_opened(self, spider):
        self.spiderlet = _load_spiderlet(self.spiderlets_module_path, spider)

    def process_spider_output(self, response, result, spider):
        for item_or_request in result:
            if isinstance(item_or_request, Request):
                yield self.spiderlet.process_request(item_or_request, response)
            else:
                yield self.spiderlet.process_item(item_or_request, response)

    def process_start_requests(self, start_requests, spider):
        for request in start_requests:
            if request.callback == spider.parse_login_page:
                request.callback = self.spiderlet.parse_login_page
            yield self.spiderlet.process_start_request(request)
