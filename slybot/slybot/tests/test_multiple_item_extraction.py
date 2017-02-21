# -*- coding: utf-8 -*-
import json
import re

from unittest import TestCase
from scrapy import Request, Item
from scrapy.settings import Settings
from scrapy.http.response.html import HtmlResponse
from slybot.plugins.scrapely_annotations.extraction import (
    TemplatePageMultiItemExtractor,
    SlybotIBLExtractor)
from slybot.plugins.scrapely_annotations.extraction.pageparsing import (
    parse_template)
from slybot.plugins.scrapely_annotations.extraction.container_extractors import (
    BaseContainerExtractor, ContainerExtractor, RepeatedContainerExtractor)
from slybot.plugins.scrapely_annotations.extraction.utils import group_tree
from slybot.extractors import add_extractors_to_descriptors
from slybot.item import create_slybot_item_descriptor
from slybot.plugins.scrapely_annotations.builder import (
    Annotations, _clean_annotation_data
)
from slybot.spider import IblSpider
from slybot.spidermanager import SlybotSpiderManager
from scrapely.extraction.pageobjects import TokenDict
from scrapely.htmlpage import HtmlPage
from scrapely.extraction.regionextract import BasicTypeExtractor
from scrapely.extraction.pageparsing import parse_extraction_page
from scrapely.htmlpage import HtmlTagType

from .utils import (open_spec, open_sample_and_page, open_page, make_spider,
                    PATH, open_spider_page_and_results)


base_page = u"""<html><body>
    <ul>{}</ul>
</body></html>""".format

item_template = u"""
    <li>
        <div><span>{rank}</span><h3><a href='/item/{idx}'>Item i</a></h3></div>
        <div><p>Text {idx} Text {idx}</p><p>Text {idx} Text {idx}</p></div>
    </li>
""".format

html = base_page('\n'.join(item_template(idx=i, rank=i if i % 2 else '')
                           for i in range(1, 11)))

annotations = _clean_annotation_data([{
    'id': 'annotation1', 'selector': 'li > div > h3 > a',
    'container_id': 'repeated_parent',
    'data': {1: {'attribute': 'content', 'field': 'title', 'required': False,
                 'extractors': []},
             2: {'attribute': 'href', 'field': 'url', 'required': False,
                 'extractors': ['1', '2']}}},
    {'id': 'annotation2', 'selector': 'li > div > span',
     'container_id': 'repeated_parent',
     'data': {1: {'attribute': 'content', 'field': 'rank',
                  'required': True, 'extractors': []}}},
    {'id': 'annotation3', 'selector': 'li > div:nth-child(2)',
     'container_id': 'repeated_parent',
     'data': {1: {'attribute': 'content', 'field': 'description',
                  'required': True, 'extractors': []}}},
    {'id': 'parent', 'item_container': True, 'selector': 'ul'},
    {'id': 'repeated_parent', 'item_container': True, 'container_id': 'parent',
     'selector': 'li', 'repeated': True}])
schemas = {
    '#default': {'name': 'default_item', 'fields': {}},
    'data': {
        'name': 'data_item',
        'fields': {
            'title': {'required': False, 'vary': False, 'type': 'text'},
            'url': {'required': False, 'vary': False, 'type': 'url'},
            'description': {'required': False, 'vary': False, 'type': 'text'},
            'rank': {'required': False, 'vary': False, 'type': 'price'}}
    }
}


sample = {'plugins': {'annotations-plugin': {'extracts': annotations}},
          'original_body': html}
simple_template = HtmlPage(url="http://www.test.com/a",
                           body=Annotations(sample).apply())
target1 = base_page('\n'.join(item_template(idx=i, rank=1)
                              for i in range(1, 11)))
target2 = base_page('\n'.join(item_template(idx=i, rank=i if i % 2 else '')
                              for i in range(1, 11)))
target1 = HtmlPage(url="http://www.test.com/a", body=target1)
target2 = HtmlPage(url="http://www.test.com/a", body=target2)
simple_descriptors = {k: create_slybot_item_descriptor(v)
                      for k, v in schemas.items()}
add_extractors_to_descriptors(simple_descriptors, {})


td = TokenDict()
html_page = HtmlPage(body=open_spec('stack_overflow.html'))
extraction_page = parse_extraction_page(td, html_page)
with open('%s/data/SampleProject/items.json' % PATH) as f:
    items = json.load(f)
descriptors = {'#default': create_slybot_item_descriptor(items['default'],
                                                         'default')}
template = parse_template(td, html_page, descriptors)
unvalidated_template = parse_template(td, html_page, {})
unvalidated_template.id = u'stack_overflow_test'
basic_extractors = BasicTypeExtractor.create(template.annotations)
uncontained_annotation = basic_extractors[0]
root_container = basic_extractors[1]
child_container = basic_extractors[2]
child_annotations = basic_extractors[3:]

sample_411, page_411 = open_sample_and_page('411_list.json')
xceed_spider = open_spec('xceed.json')


def _annotation_tag_to_dict(tag):
    return {attr: getattr(tag, attr, object())
            for attr in ['annotation_text', 'end_index', 'metadata',
                         'start_index', 'surrounds_attribute',
                         'tag_attributes', 'variant_id']}


class ContainerExtractorTest(TestCase):

    def test_get_container_info(self):
        containers, annotations, remaining_annotations = \
            BaseContainerExtractor._get_container_data(basic_extractors)
        self.assertEqual(remaining_annotations, [uncontained_annotation])
        self.assertEqual(containers, {'root': root_container,
                                      'child': child_container})
        self.assertEqual(annotations, {'child': child_annotations,
                                       'root': [child_container]})
        # TODO: test template with missing referenced container

    def test_build_extraction_tree(self):
        containers = {'root': root_container, 'child': child_container}
        tree = BaseContainerExtractor._build_extraction_tree(containers)
        self.assertEqual([['root'], ['root', 'child']], tree)
        # TODO: test cyclical tree

    def test_group_tree(self):
        annotations = {'child': child_annotations, 'root': [child_container]}
        tree1 = [['root']]
        self.assertEqual(group_tree(tree1, annotations),
                         {'root': [child_container]})
        tree2 = [['root'], ['root', 'child']]
        self.assertEqual(group_tree(tree2, annotations),
                         {'root': {'child': child_annotations}})

    def test_find_annotation(self):
        bce = BaseContainerExtractor(basic_extractors, template)
        a2d = _annotation_tag_to_dict
        self.assertEqual(a2d(bce._find_annotation(template, 'child')),
                         a2d(child_container.annotation))
        self.assertIsNone(bce._find_annotation(template, 'non_existant'))

    def test_validate_and_adapt_item(self):
        bce = BaseContainerExtractor(basic_extractors, template)
        data = {'price': ['10']}
        data['_type'] = 'skip_checks'
        result = bce._validate_and_adapt_item(data, template).dump()
        self.assertEqual(result,
                         {'price': ['10'], '_type': 'skip_checks'})
        data = {
            'price': ['10'],
            u'description': [u'It can do everything except make calls'],
            u'name': ['Smartphone 6']
        }
        result = data.copy()
        result['_type'] = 'default'
        extracted = bce._validate_and_adapt_item(data, template).dump()
        self.assertEqual(extracted,
                         result)
        data['pid'] = ['13532']
        result = data.copy()
        result['_type'] = 'default'
        extracted = bce._validate_and_adapt_item(data, template).dump()
        self.assertEqual(extracted, result)
        bce.extra_requires = ['pid', '_sticky1']
        data['_sticky1'] = True
        extracted = bce._validate_and_adapt_item(data, template).dump()
        self.assertEqual(extracted, result)

    def test_find_tokens(self):
        htt = HtmlTagType
        s = RepeatedContainerExtractor._find_tokens(template.page_tokens[::-1],
                                                    (htt.OPEN_TAG,),
                                                    template)
        self.assertEqual(s, [16777216, 16777217, 16777218])
        e = RepeatedContainerExtractor._find_tokens(template.page_tokens,
                                                    (htt.CLOSE_TAG,),
                                                    template)
        self.assertEqual(e, [33554432, 33554439, 33554438])

    def test_extract(self):
        extractors = ContainerExtractor.apply(unvalidated_template,
                                              basic_extractors)
        ibl_extractor = TemplatePageMultiItemExtractor(unvalidated_template,
                                                       extractors)
        data = [i.dump() for i in ibl_extractor.extract(extraction_page)]
        self.assertEqual(len(data), 96)
        self.assertEqual(
            {tuple(sorted(i.keys())) for i in data},
            {(u'_index', u'_template', u'date', u'text', u'title', u'url')})
        self.assertDictEqual(data[0], {
            u'_index': 1,
            u'_template': u'stack_overflow_test',
            u'date': [u'2015-08-07 10:09:32Z'],
            u'text': [u"Bootstrap navbar doesn't open - mobile view"],
            u'title': [u'I have a sticky nav with this code (Which is not mine'
                       u')\n\n// Create a clone of the menu, right next to '
                       u'original.\n...'],
            u'url': [u'https://stackoverflow.com/questions/31875193/bootstrap-'
                     u'navbar-doesnt-open-mobile-view']
        })
        self.assertDictEqual(data[50], {
            u'_index': 51,
            u'_template': u'stack_overflow_test',
            u'date': [u'2015-08-07 10:01:03Z'],
            u'text': [u'Rails in production with Apache+passenger error'],
            u'title': [u"Last days i'm trying to put my rails app in "
                       u"production with apache and passenger(no rvm), but "
                       u"still nothing. In my browser i get an error like "
                       u"this:\n\nWe're sorry, but something went wrong."
                       u"\nWe've been ..."],
            u'url': [u'https://stackoverflow.com/questions/31874997/rails-in-'
                     u'production-with-apachepassenger-error']
        })
        self.assertDictEqual(data[-1], {
            u'_index': 96,
            u'_template': u'stack_overflow_test',
            u'date': [u'2015-08-07 08:16:43Z'],
            u'text': [u'iPython + Spark + Cassandra - Py4JJavaError and How to'
                      u' connect to Cassandra from Spark?'],
            u'title': [u"How can I connect to Cassandra from Spark with "
                       u"iPython?\n\nI have followed the code from here and "
                       u"modified it,\n\nimport os\nimport sys\n\n# Path for "
                       u"spark source folder\nos.environ['SPARK_HOME'] = ..."],
            u'url': [u'https://stackoverflow.com/questions/31872831/ipython-'
                     u'spark-cassandra-py4jjavaerror-and-how-to-connect-to-'
                     u'cassandra-from']
        })

    def test_extract_single_attribute_to_multiple_fields(self):
        extractors = {'1': {'regular_expression': '(.*)\s'},
                      '2': {'regular_expression': '\s(.*)'}}
        descriptors = {'#default': create_slybot_item_descriptor({'fields': {
            'full_name': {'type': 'text', 'required': False, 'vary': False},
            'first_name': {'type': 'text', 'required': False, 'vary': False,
                           'name': u'prénom'},
            'last_name': {'type': 'text', 'required': False, 'vary': False,
                          'name': 'nom'},
            'address': {'type': 'text', 'required': False, 'vary': False}}})}
        add_extractors_to_descriptors(descriptors, extractors)
        extractor = SlybotIBLExtractor([(sample_411, descriptors, '0.13.0')])
        data = extractor.extract(page_411)[0][1]
        self.assertEqual(data['full_name'], [u'Joe Smith'])
        self.assertEqual(data[u'prénom'], [u'Joe'])
        self.assertEqual(data['nom'], [u'Smith'])

    def test_extract_missing_schema(self):
        extractor = SlybotIBLExtractor([(sample_411, {}, '0.13.0')])
        data = extractor.extract(page_411)[0][1]
        raw_html = ('<span itemprop="name"><span itemprop="givenName">Joe'
                    '</span> <span itemprop="familyName">Smith</span></span>')
        self.assertEqual(data['full_name'], [raw_html])
        self.assertEqual(data['first_name'], [raw_html])
        self.assertEqual(data['last_name'], [raw_html])

    def test_extract_multiple_item_types(self):
        spider = IblSpider('xceed', xceed_spider, xceed_spider['items'], {},
                           Settings())
        data = list(spider.parse(
            HtmlResponse('http://url',
                         body=xceed_spider['templates'][0]['original_body'],
                         encoding='utf-8')
        ))
        items = sorted([d for d in data if not isinstance(d, Request)],
                       key=lambda x: ('ticket', 'venue', 'event').index(x['_type']))
        self.assertEqual(items, xceed_spider['results'])

    def test_extract_repeated_field(self):
        sample = {
            'plugins': {'annotations-plugin': {}},
            'url': 'https://stackoverflow.com',
            'original_body': re.sub(
                'data-scrapy-annotate=".*"', '', html_page._body),
            'scrapes': 'default',
            'page_id': '507f520c3bf361f4c5cd55c44307a271bccb2218',
            'version': '0.13.0'
        }
        data = open_spec('so_annotations.json')
        annos, items, results = data['annos'], data['items'], data['results']
        sample['plugins']['annotations-plugin']['extracts'] = annos
        spider = IblSpider('so', make_spider(sample=sample),
                           items, {}, Settings())
        page = HtmlResponse('http://url', body=sample['original_body'],
                            encoding='utf-8')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        keys = {(u'_index', u'_template', u'_type', u'answered', u'tags',
                 u'title', 'url')}
        self.assertEqual({tuple(sorted(i.keys())) for i in items}, keys)
        self.assertEqual([items[0], items[52], items[-1]], results)
        self.assertEqual(len(items), 96)
        spider, page, results = open_spider_page_and_results('autoevolution.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, results)

    def test_item_merging_in_container(self):
        spider, page, results = open_spider_page_and_results('autoevolution2.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, results)

    def test_extracted_items_are_scrapy_items(self):
        spider, page, results = open_spider_page_and_results('autoevolution2.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertTrue(len(items) > 0)
        self.assertTrue(all(isinstance(i, Item) for i in items))

    def test_required_annotation(self):
        ibl_extractor = SlybotIBLExtractor([
            (simple_template, simple_descriptors, '0.13.0')
        ])
        data, _ = ibl_extractor.extract(target1)
        self.assertEqual(len(data), 10)
        self.assertTrue(all('rank' in item and item['rank'] for item in data))
        self.assertTrue(all('description' in item and item['description']
                            for item in data))
        data, _ = ibl_extractor.extract(target2)
        self.assertEqual(len(data), 5)
        self.assertTrue(all('rank' in item and item['rank'] for item in data))
        self.assertTrue(all('description' in item and item['description']
                            for item in data))

    def test_missing_selectors(self):
        spider, page, results = open_spider_page_and_results('cars.com.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, results)

    def test_against_false_positive(self):
        page = open_page('autoevolution.html')
        spider, _, _ = open_spider_page_and_results('autoevolution2.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, [])

    def test_nested_items(self):
        smanager = SlybotSpiderManager("%s/data/SampleProject" % PATH)
        name = 'books.toscrape.com'
        spider = smanager.create(name)
        spec = smanager._specs["spiders"][name]
        t = [t for t in spec["templates"] if t['page_id'] == '3617-44af-a2f0'][0]
        response = HtmlResponse(t['url'], body=t['original_body'].encode('utf-8'))
        results = [i for i in spider.parse(response)
                   if hasattr(i, '__getitem__')]
        self.assertEqual(results, t['results'])

    def test_nested_items_without_nested_structure(self):
        spider, page, results = open_spider_page_and_results(
            'cars.com_nested.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, results)
