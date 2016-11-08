import json

import six

from scrapy.settings import Settings
from os.path import dirname

from scrapy.http.response import Response
from scrapy.http.response.html import HtmlResponse
from scrapy.http.response.text import TextResponse
from scrapy.http.response.xml import XmlResponse
from scrapy.utils.spider import arg_to_iter

from scrapely.htmlpage import HtmlPage

from slybot.spider import IblSpider
from slybot.plugins.scrapely_annotations.builder import Annotations
from slybot.utils import read


PATH = dirname(__file__)


def request_to_set(requests):
    return [(set(t[0]),) + t[1:] for t in requests]


class UTF8Response(Response):
    def __init__(self, *args, **kwargs):
        body = kwargs.get('body', args[3] if len(args) >= 4 else b'')
        if 'encoding' not in kwargs and isinstance(body, six.text_type):
            kwargs['encoding'] = 'utf-8'
        super(UTF8Response, self).__init__(*args, **kwargs)


class UTF8HtmlResponse(UTF8Response, HtmlResponse):
    pass


class UTF8TextResponse(UTF8Response, TextResponse):
    pass


class UTF8XmlResponse(UTF8Response, XmlResponse):
    pass


def make_spider(start_urls=None, sample=None):
    sample = [] if sample is None else arg_to_iter(sample)
    start_urls = [] if start_urls is None else arg_to_iter(start_urls)
    return {'start_urls': start_urls, 'templates': sample}


def open_spec(name):
    use_json = True if name.endswith('.json') else False
    with open('%s/data/templates/%s' % (PATH, name)) as f:
        return json.load(f) if use_json else read(f)


def open_sample_and_page(name):
    sample_spec = open_spec(name)
    url = sample_spec['url']
    return (HtmlPage(url=url, body=Annotations(sample_spec).apply()),
            HtmlPage(url=url, body=sample_spec['original_body']))


def open_page(name):
    return HtmlResponse(url=name, body=open_spec(name), encoding='utf-8')


def open_spider_page_and_results(name):
    sample_spec = open_spec(name)
    schemas = sample_spec['schemas']
    results = sample_spec['results']
    page = UTF8HtmlResponse('http://url', body=sample_spec['original_body'])
    spider = IblSpider(name, make_spider(sample=sample_spec), schemas, {},
                       Settings())
    return spider, page, results
