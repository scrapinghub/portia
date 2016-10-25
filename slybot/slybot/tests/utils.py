import json

from scrapy.settings import Settings
from os.path import dirname

from scrapy.http.response.html import HtmlResponse
from scrapy.utils.spider import arg_to_iter

from scrapely.htmlpage import HtmlPage

from slybot.spider import IblSpider
from slybot.plugins.scrapely_annotations.builder import (
    apply_annotations, _clean_annotation_data
)


PATH = dirname(__file__)


def make_spider(start_urls=None, sample=None):
    sample = [] if sample is None else arg_to_iter(sample)
    start_urls = [] if start_urls is None else arg_to_iter(start_urls)
    return {'start_urls': start_urls, 'templates': sample}


def open_spec(name):
    use_json = True if name.endswith('.json') else False
    with open('%s/data/templates/%s' % (PATH, name)) as f:
        return json.load(f) if use_json else f.read()


def open_sample_and_page(name):
    sample_spec = open_spec(name)
    annotations = sample_spec['plugins']['annotations-plugin']['extracts']
    annotated = apply_annotations(_clean_annotation_data(annotations),
                                  sample_spec['original_body'])
    url = sample_spec['url']
    return (HtmlPage(url=url, body=annotated),
            HtmlPage(url=url, body=sample_spec['original_body']))


def open_spider_page_and_results(name):
    sample_spec = open_spec(name)
    schemas = sample_spec['schemas']
    results = sample_spec['results']
    page = HtmlResponse('http://url', body=sample_spec['original_body'],
                        encoding='utf-8')
    spider = IblSpider(name, make_spider(sample=sample_spec), schemas, {},
                       Settings())
    return spider, page, results
