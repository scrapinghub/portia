import json
from os.path import dirname, join
from unittest import TestCase

from slybot.generic_form import fill_generic_form

_PATH = dirname(__file__)

class GenericFormTest(TestCase):

    def test_simple_search_form(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "xpath": ".//*[@name='_nkw']",
                  "type": "fixed",
                  "value": "Cars"
                }
            ]
        }""")

        start_requests = list(fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)

    def test_advanced_search_form(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "xpath": ".//*[@name='_nkw']",
                  "type": "fixed",
                  "value": "Cars"
                },
                {
                  "xpath": ".//*[@name='_in_kw']",
                  "type": "all"
                }
            ]
        }""")

        start_requests = list(fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '2'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '3'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '4'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)
