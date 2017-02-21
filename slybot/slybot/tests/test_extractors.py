from unittest import TestCase

from datetime import datetime

from scrapely.htmlpage import HtmlPage
from scrapely.extraction import InstanceBasedLearningExtractor

from slybot.extractors import (create_regex_extractor, apply_extractors,
                               add_extractors_to_descriptors)
from slybot.fieldtypes import TextFieldTypeProcessor
from slybot.item import create_slybot_item_descriptor
from slybot.plugins.scrapely_annotations.extraction import SlybotIBLExtractor
from slybot.plugins.scrapely_annotations.builder import (
    Annotations, _clean_annotation_data
)


class ExtractorTest(TestCase):

    annotated = u"""
<table>
<tr data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;gender&quot;}}">
<th class="item-key">Gender</th>
<td >Male</td></tr>
</table>"""
    _target = u"""
<table>
<tr>
<th class="item-key">Gender</th>
<td >Male</td></tr>
</table>"""
    annotated2 = u"""
<table>
<tr data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;name&quot;}}">
<th class="item-key">Name</th>
<td >John</td></tr>
<span data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;gender&quot;}}">Male</span>
</table>"""
    _target2 = u"""
<body>
<tr>
<th class="item-key">Name</th><td>Olivia</td></tr>
<span></span>
</body>"""

    annotations = _clean_annotation_data([{
        'id': 'annotation1',
        'selector': 'td > a',
        'container_id': 'parent',
        'data': {
            1: {
                'attribute': 'content',
                'field': 'title',
                'required': False,
                'extractors': []
            },
            2: {
                'attribute': 'content',
                'field': 'name',
                'required': False,
                'extractors': ['3']
            },
            3: {
                'attribute': 'href',
                'field': 'url',
                'required': False,
                'extractors': ['1', '2']
            }
        }
    }, {
        'id': 'annotation2',
        'selector': 'span',
        'container_id': 'parent',
        'data': {
            1: {
                'attribute': 'content',
                'field': 'price',
                'required': False,
                'extractors': ['8', '4', '5', '6']
            },
            2: {
                'attribute': 'content',
                'field': 'date',
                'required': False,
                'extractors': ['4', '7']
            }
        }
    }, {
        'id': 'parent',
        'item_container': True,
        'selector': 'body'
    }])
    target3 = u"""
    <html>
    <body>
    <tr>
        <th class="item-key">Name</th>
        <td>
            <a href="/olivia.html">Name: Olivia</a>
        </td>
    </tr><span>2016-03-17 20:25</span>
    </body></html>"""

    template = HtmlPage(url="http://www.test.com/", body=annotated)
    target = HtmlPage(url="http://www.test.com/", body=_target)
    template2 = HtmlPage(url="http://www.test.com/", body=annotated2)
    target2 = HtmlPage(url="http://www.test.com/a", body=_target2)
    sample3 = {'plugins': {'annotations-plugin': {'extracts': annotations}},
               'original_body': target3}
    template3 = HtmlPage(url="http://www.test.com/a",
                         body=Annotations(sample3).apply())
    target3 = HtmlPage(url="http://www.test.com/a", body=target3)

    def test_regex_extractor(self):
        extractor = create_regex_extractor("(\d+).*(\.\d+)")
        extracted = extractor(u"The price of this product is <div>45</div> </div class='small'>.50</div> pounds")
        self.assertEqual(extracted, u"45.50")
        processor = TextFieldTypeProcessor()
        self.assertEqual(processor.adapt(extracted, None), u"45.50")

    def test_raw_type_w_regex(self):
        schema = {
            'fields': {
                'gender': {
                    'required': False,
                    'type': 'raw',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {
            1: {"regular_expression": "Gender.*(<td\s*>(?:Male|Female)</td>)"}
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0]['gender'], [u'<td >Male</td>'])

    def test_negative_hit_w_regex(self):
        schema = {
            'fields': {
                'gender': {
                    'required': False,
                    'type': 'number',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {1: {"regular_expression": "Gender\\s+(Male|Female)"}}
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0], None)

    def test_text_type_w_regex(self):
        schema = {
            "fields": {
                'gender': {
                    'required': False,
                    'type': 'text',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {1: {"regular_expression": "Gender\\s+(Male|Female)"}}
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0]['gender'], [u'Male'])

    def test_type_extractor(self):
        schema = {
            "fields": {
                'gender': {
                    'required': False,
                    'type': 'number',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {
            1: {"type_extractor": "text"},
            2: {"regular_expression": "Gender\\s+(Male|Female)"}
        }
        apply_extractors(descriptor, {"gender": [1, 2]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0]['gender'], [u'Male'])

    def test_default_type_extractor(self):
        schema = {
            'fields': {}
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {
            1: {"regular_expression": "Gender\\s+(Male|Female)"}
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0]['gender'], [u'Male'])

    def test_text_type_w_regex_and_no_groups(self):
        schema = {
            'fields': {
                'gender': {
                    'required': False,
                    'type': 'text',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {
            1: {"regular_expression": "Gender"}
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0]['gender'], [u'Gender'])

    def test_extractor_w_empty_string_extraction(self):
        schema = {
            'fields': {
                'gender': {
                    'required': False,
                    'type': 'text',
                    'vary': False,
                },
                'name': {
                    'required': True,
                    'type': 'text',
                    'vary': False,
                }
            }
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors = {
            1: {
                "regular_expression": "([0-9]+)"
            }
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = SlybotIBLExtractor([
            (self.template2, {'#default': descriptor}, '0.12.0')])
        self.assertEqual(ibl_extractor.extract(self.target2)[0][0]['name'], [u'Name Olivia'])

    def test_per_annotation_extractors(self):
        schema = {
            'fields': {
                'url': {
                    'required': False,
                    'type': 'text',
                    'vary': False,
                },
                'name': {
                    'required': True,
                    'type': 'text',
                    'vary': False,
                }
            }
        }
        extractors = {
            '1': {
                'type_extractor': 'url'
            },
            '2': {
                'regular_expression': '(.*)\.html'
            },
            '3': {
                'regular_expression': 'Name: (.*)'
            },
            '4': {
                'type_extractor': 'text'
            },
            '5': {
                'type_extractor': 'price'
            },
            '6': {
                'type_extractor': 'number'
            },
            '7': {
                'type_extractor': 'date'
            },
            '8': {
                'regular_expression': '(\d+)-'
            }
        }
        descriptors = {'#default': create_slybot_item_descriptor(schema)}
        add_extractors_to_descriptors(descriptors, extractors)
        ibl_extractor = SlybotIBLExtractor([
            (self.template3, descriptors, '0.13.0')
        ])
        result = {u'_template': '6223d000057491040e4f411cf1f0734ea802eeb6',
                  'name': [u'Olivia'], 'url': [u'http://www.test.com/olivia'],
                  'title': [u'Name: Olivia'], 'price': [u'2016'],
                  'date': [datetime(2016, 3, 17, 20, 25)]}
        data = ibl_extractor.extract(self.target3)[0][0]
        self.assertEqual(data, result)
