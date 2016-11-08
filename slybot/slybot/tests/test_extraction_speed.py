import json
import os
from os.path import dirname
from collections import namedtuple
from unittest import TestCase

from slybot.item import create_slybot_item_descriptor
from slybot.utils import read
from slybot.plugins.scrapely_annotations.extraction import (
    SlybotIBLExtractor, BaseContainerExtractor)

from scrapy.selector.unified import SelectorList, Selector
from scrapely.extraction.pageobjects import TokenDict
from scrapely.htmlpage import HtmlPage


def _next_3(iterable):
    i = iter(iterable[1:-3])
    while True:
        yield SelectorList((next(i), next(i), next(i)))
ITERATIONS = int(os.environ.get('SLYBOT_SPEED_TEST_ITERATIONS', 1))
Extractor = namedtuple('Extractor', ['containers', 'selectors', 'group'])
parsel_extractors = {
    'daft': Extractor('//div[@class="box"]',
                      {u'name': './/h2/a/text()',
                       u'price': './/strong[@class="price"]/text()',
                       u'description': './/div[@class="text-block"]/p/text()',
                       u'url': './/h2/a/@href'}, None),
    'hn': Extractor('//table//table//tr',
                    {u'name': './/td[@class="title"]/a/text()',
                     u'price': './/td/span[contains(@id,"score")]/text()',
                     u'description': './/td/span/a//text()',
                     u'url': './/td[@class="title"]/a/@href'}, _next_3),
    'pol': Extractor('//div[contains(@class, "item")]',
                     {u'name': './/div[@class="product-image"]/a/@title',
                      u'price': './/li[@class="fund"]/strong/text()',
                      u'description': './/div[@class="descbox"]/ul',
                      u'url': './/div[@class="product-image"]/a/@href',
                      u'product_id': './/div[@class="product-image"]/a/@id'},
                     None)
}


def extract(extractor, selector):
    items = []
    item_selectors = selector.xpath(extractor.containers)
    if extractor.group:
        item_selectors = extractor.group(item_selectors)
    for row in item_selectors:
        item = {k: row.xpath(xpath).extract()
                for k, xpath in extractor.selectors.items()}
        item = {k: v for k, v in item.items() if v}
        validated = validate(item, html_page)
        if not validated:
            continue
        if hasattr(validated, 'dump'):
            validated = validated.dump()
        validated['_template'] = None
        items.append(validated)
    items = list(filter(bool, items))
    return [i for i in items if '_type' in i]

_PATH = dirname(__file__)
td = TokenDict()
with open('%s/data/SampleProject/items.json' % _PATH) as f:
    items = json.load(f)
descriptors = {'#default': create_slybot_item_descriptor(items['default'],
                                                         'default')}


class FakeContainer(BaseContainerExtractor):
    def __init__(self, schema, legacy=False):
        self.schema = schema
        self.extra_requires = []
        self.legacy = legacy
        self.modifiers = {}


schema = FakeContainer(descriptors['#default'])
validate = schema._validate_and_adapt_item
_names_map = {'daft_ie': 'daft', 'patchofland': 'pol'}
ibl_extractors = {}
ibl_pages = {}
selector_pages = {}
for template_name in ('daft_ie', 'hn', 'patchofland'):
    with open('%s/data/templates/%s.html' % (_PATH, template_name), 'rb') as f:

        html_page = HtmlPage(body=read(f))
        name = _names_map.get(template_name, template_name)
        ibl_pages[name] = html_page
        ibl_extractors[name] = SlybotIBLExtractor([(html_page, descriptors,
                                                    '0.13.0')])
        selector_pages[name] = Selector(text=html_page.body)


class TestExtractionSpeed(TestCase):
    def test_parsel_parse_and_extract(self):
        for i in range(ITERATIONS):
            for name, page in ibl_pages.items():
                s = Selector(text=page.body)
                extract(parsel_extractors[name], s)

    def test_slybot_parse_and_extract(self):
        for i in range(ITERATIONS):
            for name, page in ibl_pages.items():
                extraction_page = HtmlPage(body=page.body)
                ibl_extractors[name].extract(extraction_page)

    def test_parsel_extract(self):
        for i in range(ITERATIONS):
            for name, page in ibl_pages.items():
                extract(parsel_extractors[name], selector_pages[name])

    def test_slybot_extract(self):
        for i in range(ITERATIONS):
            for name, page in ibl_pages.items():
                ibl_extractors[name].extract(page)
