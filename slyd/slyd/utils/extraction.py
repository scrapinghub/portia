import json
import traceback

from twisted.internet.defer import inlineCallbacks
from twisted.web.client import getPage
from twisted.web.error import Error

from scrapy.item import DictItem
from scrapy.settings import Settings

from slybot.spider import IblSpider


@inlineCallbacks
def extract_items(spec, spider_name, urls, request):
    try:
        spider = load_spider(spec, spider_name)
        items = []
        for url in urls:
            if isinstance(url, unicode):
                url = url.encode('utf-8')
            try:
                body = yield getPage(url)
                responses = spec._process_extraction_response(url, body)
            except (AssertionError, Error):
                traceback.print_exc()
            else:
                for key, resp in responses:
                    item = {'key': key, 'items': None, 'templates': None}
                    extracted_items = [dict(x) for x in spider.parse(resp)
                                       if isinstance(x, DictItem)]
                    if extracted_items:
                        item['items'] = extracted_items
                        item['templates'] = [i['_template']
                                             for i in extracted_items]
                    items.append(item)
    except Exception:
        traceback.print_exc()
        request.setResponseCode(500)
        request.write(json.dumps({
            'error': 'An unexpected error has occurred'
        }))
    else:
        request.write(json.dumps({
            'status': 'ok',
            'subitems': items
        }))
    if not request.finished:
        request.finish()


def load_spider(spec, spider_name):
    spider = spec.spider_with_templates(spider_name)
    try:
        items = spec.resource('items')
    except IOError:
        items = {}
    try:
        extractors = spec.resource('extractors')
    except IOError:
        extractors = {}
    return IblSpider(spider_name, spider, items, extractors, Settings())
