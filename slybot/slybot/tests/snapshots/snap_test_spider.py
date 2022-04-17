# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import GenericRepr, Snapshot


snapshots = Snapshot()

snapshots['SpiderTest::test_generic_form_requests 1'] = [
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        'body': b'',
        'callback': 'parse',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
    }
]

snapshots['SpiderTest::test_generic_form_requests_with_file_field 1'] = [
    {
        '_class': 'scrapy.http.request.form.FormRequest',
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'parse_field_url_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
            'field_index': 1,
            'fields': [
                {
                    'file_values': [
                        'Cars',
                        'Boats'
                    ],
                    'type': 'inurl',
                    'value': 'file://tmp/test_params.txt',
                    'xpath': ".//*[@name='_nkw']"
                },
                {
                    'file_values': [
                        'Cars',
                        'Boats'
                    ],
                    'name': '_nkw2',
                    'type': 'inurl',
                    'value': 'file://tmp/test_params.txt'
                },
                {
                    'type': 'iterate',
                    'xpath': ".//*[@name='_in_kw']"
                }
            ],
            'type': 'form',
            'xpath': "//form[@name='adv_search_from']"
        },
        'method': 'GET',
        'priority': 0,
        'url': 'file://tmp/test_params.txt'
    }
]

snapshots['SpiderTest::test_generic_form_requests_with_file_field 2'] = [
    {
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'parse_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
            'field_index': 1,
            'fields': [
                {
                    'file_values': [
                        'Cars',
                        'Boats'
                    ],
                    'type': 'inurl',
                    'value': 'file://tmp/test_params.txt',
                    'xpath': ".//*[@name='_nkw']"
                },
                {
                    'file_values': [
                        'Cars',
                        'Boats'
                    ],
                    'name': '_nkw2',
                    'type': 'inurl',
                    'value': 'file://tmp/test_params.txt'
                },
                {
                    'type': 'iterate',
                    'xpath': ".//*[@name='_in_kw']"
                }
            ],
            'type': 'form',
            'xpath': "//form[@name='adv_search_from']"
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
    }
]

snapshots['SpiderTest::test_generic_form_requests_with_file_field 3'] = [
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Cars'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Boats&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50&_nkw2=Boats'
    },
    {
        'body': b'',
        'callback': 'parse',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
    }
]

snapshots['SpiderTest::test_generic_form_requests_with_spider_args 1'] = [
    {
        '_class': 'scrapy.http.request.form.FormRequest',
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=1&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        '_class': 'scrapy.http.request.form.FormRequest',
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=2&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        '_class': 'scrapy.http.request.form.FormRequest',
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=3&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        '_class': 'scrapy.http.request.form.FormRequest',
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'after_form_page',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/i.html?_nkw=Cars&_in_kw=4&_ex_kw=&_sacat=0&_okw=&_oexkw=&_adv=1&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_salic=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=&_sop=12&_dmd=1&_ipg=50'
    },
    {
        '_encoding': 'utf-8',
        'body': b'',
        'callback': 'parse',
        'cb_kwargs': {
        },
        'cookies': {
        },
        'dont_filter': True,
        'errback': None,
        'flags': [
        ],
        'headers': {
        },
        'meta': {
        },
        'method': 'GET',
        'priority': 0,
        'url': 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc'
    }
]

snapshots['SpiderTest::test_list 1'] = set([
    'cargurus',
    'seedsofchange',
    'example2.com',
    'ebay',
    'any_allowed_domains',
    'books.toscrape.com',
    'seedsofchange.com',
    'example.com',
    'ebay4',
    'networkhealth.com',
    'books.toscrape.com_1',
    'ebay3',
    'example4.com',
    'pinterest.com',
    'seedsofchange2',
    'ebay2',
    'sitemaps',
    'example3.com',
    'allowed_domains'
])

snapshots['SpiderTest::test_login_requests 1'] = {
    '_class': 'scrapy.http.request.form.FormRequest',
    '_encoding': 'utf-8',
    'body': b'email=test&password=testpass&csrfmiddlewaretoken=nLZy3NMzhTswZvweHJ4KVmq9UjzaZGn3&_ch=ecnwmar2',
    'callback': 'after_login',
    'cb_kwargs': {
    },
    'cookies': {
    },
    'dont_filter': True,
    'errback': None,
    'flags': [
    ],
    'headers': {
        b'Content-Type': [
            b'application/x-www-form-urlencoded'
        ]
    },
    'meta': {
    },
    'method': 'POST',
    'priority': 0,
    'url': 'https://pinterest.com/login/?next=%2F'
}

snapshots['SpiderTest::test_spider_with_link_region_but_not_link_template 1'] = GenericRepr("{'_template': '4fad6a7d688f922437000017',\n '_type': 'default',\n 'category': ['Winter Squash'],\n 'days': [None],\n 'description': ['1-2 lbs. (75-95 days)&nbsp;This early, extremely productive, '\n                 'compact bush variety is ideal for small gardens.&nbsp; '\n                 'Miniature pumpkin-shaped fruits have pale red-orange skin '\n                 'and dry, sweet, dark orange flesh.&nbsp; Great for stuffing, '\n                 'soups and pies.'],\n 'lifecycle': ['Tender Annual'],\n 'name': ['Gold Nugget'],\n 'price': ['3.49'],\n 'species': ['Cucurbita maxima'],\n 'url': 'http://www.seedsofchange.com/garden_center/product_details.aspx?item_no=PS14165',\n 'weight': [None]}")

snapshots['SpiderTest::test_spider_with_link_template 1'] = GenericRepr("{'_template': '4fac3b47688f920c7800000f',\n '_type': 'default',\n 'category': ['Winter Squash'],\n 'days': [None],\n 'description': ['1-2 lbs. (75-95 days)&nbsp;This early, extremely productive, '\n                 'compact bush variety is ideal for small gardens.&nbsp; '\n                 'Miniature pumpkin-shaped fruits have pale red-orange skin '\n                 'and dry, sweet, dark orange flesh.&nbsp; Great for stuffing, '\n                 'soups and pies.'],\n 'lifecycle': ['Tender Annual'],\n 'name': ['Gold Nugget'],\n 'price': ['3.49'],\n 'product_id': ['01593'],\n 'species': ['Cucurbita maxima'],\n 'url': 'http://www.seedsofchange.com/garden_center/product_details.aspx?item_no=PS14165',\n 'weight': [None]}")
