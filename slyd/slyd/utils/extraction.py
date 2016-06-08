import json
import traceback

from twisted.internet.defer import inlineCallbacks
from twisted.web.client import getPage
from twisted.web.error import Error

from scrapy.item import DictItem
from scrapy.settings import Settings

from slybot.spider import IblSpider

from ..errors import BadRequest, BaseError


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
    except BaseError as e:
        request.setResponseCode(e.status)
        request.write(json.dumps({
            'error': e.title
        }))
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
    try:
        spider = spec.spider_with_templates(spider_name)
    except (TypeError, ValueError):
        raise BadRequest('The spider %s, could not be cound' % spider_name)
    try:
        items = spec.resource('items')
    except (TypeError, ValueError):
        items = {}
    try:
        extractors = spec.resource('extractors')
    except (TypeError, ValueError):
        extractors = {}
    return IblSpider(spider_name, spider, items, extractors, Settings())
