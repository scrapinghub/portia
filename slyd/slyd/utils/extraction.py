import json

from twisted.internet.defer import inlineCallbacks
from twisted.web.client import getPage
from twisted.web.error import Error

from scrapy.http import HtmlResponse
from scrapy.item import DictItem
from scrapy.settings import Settings

from slybot.spider import IblSpider


@inlineCallbacks
def extract_items(spec, spider_name, urls, request):
    spider = load_spider(spec, spider_name)
    items = []
    for key, url in urls:
        item = {
            'key': key,
            'items': None,
            'templates': None
        }
        if isinstance(url, unicode):
            url = url.encode('utf-8')
        try:
            body = yield getPage(url)
            resp = HtmlResponse(url, body=body)
        except (AssertionError, Error):
            pass
        else:
            extracted_items = [dict(x) for x in spider.parse(resp)
                               if isinstance(x, DictItem)]
            if extracted_items:
                item['items'] = extracted_items
                item['templates'] = [i['_template'] for i in extracted_items]
        items.append(item)
    request.write(json.dumps({
        'status': 'ok',
        'subitems': items
    }))
    if not request.finished:
        request.finish()


def load_spider(spec, spider_name):
    spider = spec.spider_with_templates(spider_name)
    items = spec.resource('items')
    extractors = spec.resource('extractors')
    return IblSpider(spider_name, spider, items, extractors, Settings())
