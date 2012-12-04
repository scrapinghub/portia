import json
from os.path import dirname, join
from unittest import TestCase

from slybot.generic_form import GenericForm

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
                  "type": "constants",
                  "value": ["Cars"]
                }
            ]
        }""")

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)

    def test_simple_search_form_2_values(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "xpath": ".//*[@name='_nkw']",
                  "type": "constants",
                  "value": ["Cars", "Boats"]
                }
            ]
        }""")

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Boats'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
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
                  "type": "constants",
                  "value": ["Cars"]
                },
                {
                  "xpath": ".//*[@name='_in_kw']",
                  "type": "iterate"
                }
            ]
        }""")

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '2'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '3'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '4'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)

    def test_advanced_search_form_regex(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "xpath": ".//*[@name='_nkw']",
                  "type": "constants",
                  "value": ["Cars"]
                },
                {
                  "xpath": ".//*[@name='_in_kw']",
                  "type": "iterate",
                  "value": "[1-2]"
                }
            ]
        }""")

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '2'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', u'Cars'), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)


    def test_simple_search_form_with_named_parameter(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "name": "my_param",
                  "type": "constants",
                  "value": ["Cars"]
                }
            ]
        }""")

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', ''), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), (u'my_param', u'Cars'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)

    def test_simple_search_form_with_file_type(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
            "xpath": "//form[@name='adv_search_from']",
            "fields": [
                {
                  "name": "my_param",
                  "type": "inurl",
                  "value": "file://%s/test_params.txt",
                  "file_values": ["Cars", "Boats", "Houses", "Electronics"]
                }
            ]
        }""" % join(_PATH, "data"))

        generic_form = GenericForm()
        start_requests = list(generic_form.fill_generic_form(url, body, form_descriptor))
        expected_requests = [([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', ''), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), (u'my_param', u'Cars'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', ''), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), (u'my_param', u'Boats'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', ''), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), (u'my_param', u'Houses'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET'),
                             ([('_in_kw', '1'), ('_udlo', ''), ('_ex_kw', ''), ('_nkw', ''), ('_ipg', '50'), ('_adv', '1'), ('_salic', '1'), ('_dmd', '1'), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_sop', '12'), (u'my_param', u'Electronics'), ('_sasl', '')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(start_requests, expected_requests)

