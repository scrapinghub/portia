import json
from os.path import dirname
from unittest import TestCase
from slybot.plugins.scrapely_annotations.extraction import (
    parse_template, BaseContainerExtractor, group_tree, ContainerExtractor,
    RepeatedContainerExtractor, TemplatePageMultiItemExtractor)
from slybot.item import create_slybot_item_descriptor
from scrapely.extraction.pageobjects import TokenDict
from scrapely.htmlpage import HtmlPage
from scrapely.extraction.regionextract import BasicTypeExtractor
from scrapely.extraction.pageparsing import parse_extraction_page
from scrapely.htmlpage import HtmlTagType

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
        self.assertEqual(len(data), 95)
        self.assertEqual({tuple(i.keys()) for i in data},
                         {(u'date', u'text', '_template', u'url', u'title')})
        self.assertDictEqual(data[0], {
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
            u'_template': 'stack_overflow_test',
            u'date': [u'2015-08-07 10:01:03Z'],
            u'text': [u'Rails in production with Apache+passenger error'],
            u'title': [u"Last days i'm trying to put my rails app in "
                       u"production with apache and passenger(no rvm), but "
                       u"still nothing. In my browser i get an error like "
                       u"this:\n\nWe're sorry, but something went wrong.\n"
                       u"We've been ..."],
            u'url': [u'https://stackoverflow.com/questions/31874997/rails-in-'
                     u'production-with-apachepassenger-error']
        })
        self.assertDictEqual(data[-1], {
            u'_template': 'stack_overflow_test',
            u'date': [u'2015-08-07 08:19:38Z'],
            u'text': [u'pylab cannot find reference for its modules'],
            u'title': [u"I have a mac OS X Yosimite and I'm using python "
                       u"2.7.10 and Pycharm as my IDLE. I have pylab installed"
                       u" properly but I cannot use any of its modules.\n\n"
                       u"When a try:\nfrom pylab import show (or any module) "
                       u"..."],
            u'url': [u'https://stackoverflow.com/questions/31872881/pylab-'
                     u'cannot-find-reference-for-its-modules']
        })
