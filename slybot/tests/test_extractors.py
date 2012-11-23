from unittest import TestCase

from scrapely.htmlpage import HtmlPage
from scrapely.extraction import InstanceBasedLearningExtractor

from slybot.extractors import create_regex_extractor, apply_extractors
from slybot.fieldtypes import TextFieldTypeProcessor
from slybot.item import create_slybot_item_descriptor


class ExtractorTest(TestCase):

    annotated = u"""
<tr data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;gender&quot;}}">
<th class="item-key">Gender</th>
<td >Male</td></tr>"""
    _target =  u"""
<tr>
<th class="item-key">Gender</th>
<td >Male</td></tr>"""
    annotated2 = u"""
<tr data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;name&quot;}}">
<th class="item-key">Name</th>
<td >John</td></tr>
<span data-scrapy-annotate="{&quot;required&quot;: [], &quot;variant&quot;: 0, &quot;annotations&quot;: {&quot;content&quot;: &quot;gender&quot;}}">Male</span>"""
    _target2 =  u"""
<body>
<tr>
<th class="item-key">Name</th><td>Olivia</td></tr>
<span></span>
</body>"""

    template = HtmlPage(url="http://www.test.com/", body=annotated)
    target = HtmlPage(url="http://www.test.com/", body=_target)
    template2 = HtmlPage(url="http://www.test.com/", body=annotated2)
    target2 = HtmlPage(url="http://www.test.com/a", body=_target2)

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
        extractors =  {1: {
                        "regular_expression": "Gender.*(<td\s*>(?:Male|Female)</td>)"
        }}
        apply_extractors(descriptor, {"gender": [1]}, extractors)

        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0], {u'gender': [u'<td >Male</td>']})

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
        extractors =  {1: {
                        "regular_expression": "Gender\\s+(Male|Female)"
        }}
        apply_extractors(descriptor, {"gender": [1]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
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
        extractors =  {1: {
                        "regular_expression": "Gender\\s+(Male|Female)"
        }}
        apply_extractors(descriptor, {"gender": [1]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0], {u'gender': [u'Male']})

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
        extractors =  {
                    1: {
                        "type_extractor": "text"
                    },
                    2: {
                        "regular_expression": "Gender\\s+(Male|Female)"
                    }
        }
        apply_extractors(descriptor, {"gender": [1, 2]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0], {u'gender': [u'Male']})

    def test_default_type_extractor(self):
        schema = {
            'fields': {}
        }
        descriptor = create_slybot_item_descriptor(schema)
        extractors =  {
                    1: {
                        "regular_expression": "Gender\\s+(Male|Female)"
                    }
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0], {u'gender': [u'Male']})

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
        extractors =  {1: {
                        "regular_expression": "Gender"
        }}
        apply_extractors(descriptor, {"gender": [1]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target)[0][0], {u'gender': [u'Gender']})

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
        extractors =  {
                    1: {
                        "regular_expression": "([0-9]+)"
                    }
        }
        apply_extractors(descriptor, {"gender": [1]}, extractors)
        
        ibl_extractor = InstanceBasedLearningExtractor([(self.template2, descriptor)])
        self.assertEqual(ibl_extractor.extract(self.target2)[0][0], {u'name': [u'Name Olivia']})
        
