# -*- coding: utf-8 -*-
import json
from os.path import dirname
from unittest import TestCase
from slybot.plugins.scrapely_annotations.extraction import (
    parse_template, BaseContainerExtractor, group_tree, ContainerExtractor,
    RepeatedContainerExtractor, TemplatePageMultiItemExtractor,
    SlybotIBLExtractor)
from slybot.extractors import add_extractors_to_descriptors
from slybot.item import create_slybot_item_descriptor
from slybot.plugins.scrapely_annotations.builder import (
    apply_annotations, _clean_annotation_data
)
from scrapely.extraction.pageobjects import TokenDict
from scrapely.htmlpage import HtmlPage
from scrapely.extraction.regionextract import BasicTypeExtractor
from scrapely.extraction.pageparsing import parse_extraction_page
from scrapely.htmlpage import HtmlTagType

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

simple_template = HtmlPage(url="http://www.test.com/a",
                           body=apply_annotations(annotations, html))
target1 = base_page('\n'.join(item_template(idx=i, rank=1)
                              for i in range(1, 11)))
target2 = base_page('\n'.join(item_template(idx=i, rank=i if i % 2 else '')
                              for i in range(1, 11)))
target1 = HtmlPage(url="http://www.test.com/a", body=target1)
target2 = HtmlPage(url="http://www.test.com/a", body=target2)
simple_descriptors = {k: create_slybot_item_descriptor(v)
                      for k, v in schemas.items()}
add_extractors_to_descriptors(simple_descriptors, {})

_PATH = dirname(__file__)
td = TokenDict()
with open('%s/data/templates/stack_overflow.html' % _PATH) as f:
    html_page = HtmlPage(body=f.read().decode('utf-8'))
extraction_page = parse_extraction_page(td, html_page)
with open('%s/data/SampleProject/items.json' % _PATH) as f:
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

with open('%s/data/templates/411_list.json' % _PATH) as f:
    sample = json.load(f)
annotations = sample['plugins']['annotations-plugin']['extracts']
annotated = apply_annotations(_clean_annotation_data(annotations),
                              sample['original_body'])
sample_411 = HtmlPage(url=sample['url'], body=annotated)
page_411 = HtmlPage(url=sample['url'],
                    body=sample['original_body'])
with open('%s/data/templates/daft_list.json' % _PATH) as f:
    sample = json.load(f)
annotations = sample['plugins']['annotations-plugin']['extracts']
annotated = apply_annotations(_clean_annotation_data(annotations),
                              sample['original_body'])

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
        self.assertEqual(bce._validate_and_adapt_item(data, template), {})
        data['_type'] = 'skip_checks'
        self.assertEqual(bce._validate_and_adapt_item(data, template),
                         {'price': ['10'], '_type': 'skip_checks'})
        data = {
            'price': ['10'],
            'description': ['It can do everything except make calls'],
            'name': ['Smartphone 6']
        }
        result = data.copy()
        result['_type'] = 'default'
        self.assertEqual(bce._validate_and_adapt_item(data, template), result)
        bce.extra_requires = ['pid']
        self.assertEqual(bce._validate_and_adapt_item(data, template), {})
        data['pid'] = ['13532']
        result = data.copy()
        result['_type'] = 'default'
        self.assertEqual(bce._validate_and_adapt_item(data, template), result)
        bce.extra_requires = ['pid', '_sticky1']
        self.assertEqual(bce._validate_and_adapt_item(data, template), {})
        data['_sticky1'] = True
        self.assertEqual(bce._validate_and_adapt_item(data, template), result)

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
        data = ibl_extractor.extract(extraction_page)
        self.assertEqual(len(data), 96)
        self.assertEqual({tuple(sorted(i.keys())) for i in data},
                         {('_template', u'date', u'text', u'title', u'url')})
        self.assertDictEqual(data[0], {
            u'_template': u'stack_overflow_test',
            u'date': [u'2015-08-07 10:09:32Z'],
            u'text': [u"Bootstrap navbar doesn't open - mobile view"],
            u'title': [u'I have a sticky nav with this code (Which is not mine'
                       u') // Create a clone of the menu, right next to '
                       u'original. ...'],
            u'url': [u'https://stackoverflow.com/questions/31875193/bootstrap-'
                     u'navbar-doesnt-open-mobile-view']
        })
        self.assertDictEqual(data[50], {
            u'_template': 'stack_overflow_test',
            u'date': [u'2015-08-07 10:01:03Z'],
            u'text': [u'Rails in production with Apache+passenger error'],
            u'title': [u"Last days i'm trying to put my rails app in "
                       u"production with apache and passenger(no rvm), but "
                       u"still nothing. In my browser i get an error like "
                       u"this: We're sorry, but something went wrong. "
                       u"We've been ..."],
            u'url': [u'https://stackoverflow.com/questions/31874997/rails-in-'
                     u'production-with-apachepassenger-error']
        })
        self.assertDictEqual(data[-1], {
            u'_template': 'stack_overflow_test',
            u'date': [u'2015-08-07 08:16:43Z'],
            u'text': [u'iPython + Spark + Cassandra - Py4JJavaError and How to'
                      u' connect to Cassandra from Spark?'],
            u'title': [u"How can I connect to Cassandra from Spark with "
                       u"iPython? I have followed the code from here and "
                       u"modified it, import os import sys # Path for spark "
                       u"source folder os.environ['SPARK_HOME'] = ..."],
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
        data = extractor.extract(page_411)[0]
        self.assertEqual(data[1]['full_name'], [u'Joe Smith'])
        self.assertEqual(data[1][u'prénom'], [u'Joe'])
        self.assertEqual(data[1]['nom'], [u'Smith'])

    def test_extract_missing_schema(self):
        extractor = SlybotIBLExtractor([(sample_411, {}, '0.13.0')])
        data = extractor.extract(page_411)[0]
        self.assertEqual(data[1]['full_name'], [u'Joe Smith'])
        self.assertEqual(data[1]['first_name'], [u'Joe Smith'])
        self.assertEqual(data[1]['last_name'], [u'Joe Smith'])

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
