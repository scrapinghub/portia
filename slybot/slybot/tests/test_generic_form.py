import json
from os.path import dirname, join
from unittest import TestCase

from slybot.generic_form import GenericForm
from .utils import request_to_set

_PATH = dirname(__file__)


class GenericFormTest(TestCase):

    def test_simple_search_form(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))

    def test_simple_search_form_2_values(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', u'Boats'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))

    def test_advanced_search_form(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '2'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '3'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '4'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))

    def test_advanced_search_form_regex(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '2'), ('_nkw', u'Cars'), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))


    def test_simple_search_form_with_named_parameter(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), (u'my_param', u'Cars'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', ''), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))

    def test_simple_search_form_with_file_type(self):
        url = 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
        body = open(join(_PATH, "data", "ebay_advanced_search.html")).read()
        form_descriptor = json.loads("""{
            "type": "form",
            "form_url": "http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
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
        expected_requests = [([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), (u'my_param', u'Cars'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', ''), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), (u'my_param', u'Boats'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', ''), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), (u'my_param', u'Houses'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', ''), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET'), ([('_adv', '1'), ('_ex_kw', ''), ('_ftrv', '1'), ('_ftrt', '901'), ('_sabdlo', u''), ('_sabdhi', u''), ('_sop', '12'), ('_samihi', u''), ('_ipg', '50'), ('_salic', '1'), (u'my_param', u'Electronics'), ('_sasl', ''), ('_udlo', ''), ('_okw', u''), ('_fsradio', '&LH_SpecificSeller=1'), ('_udhi', ''), ('_in_kw', '1'), ('_nkw', ''), ('_sacat', '0'), ('_oexkw', u''), ('_dmd', '1'), ('_saslop', '1'), ('_samilow', u'')], 'http://www.ebay.com/sch/i.html', 'GET')]
        self.assertEqual(request_to_set(start_requests), request_to_set(expected_requests))

