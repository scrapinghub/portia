from unittest import TestCase
from os.path import dirname, join
from contextlib import contextmanager

from scrapy.http import (Response, HtmlResponse, XmlResponse, TextResponse,
                         Request)
from scrapy.utils.project import get_project_settings
from scrapy.utils.reqser import request_to_dict

from scrapely.htmlpage import HtmlPage

from slybot.spidermanager import SlybotSpiderManager


@contextmanager
def splash_spider_manager(splash_url='http://localhost:8050'):
    settings = get_project_settings()
    settings.set('SPLASH_URL', splash_url)
    yield SlybotSpiderManager("%s/data/SampleProject" % _PATH,
                              settings=settings)


_PATH = dirname(__file__)

class SpiderTest(TestCase):
    smanager = SlybotSpiderManager("%s/data/SampleProject" % _PATH)

    def test_list(self):
        self.assertEqual(set(self.smanager.list()), set(["seedsofchange", "seedsofchange2",
                "seedsofchange.com", "pinterest.com", "ebay", "ebay2", "ebay3", "ebay4", "cargurus",
                "networkhealth.com", "allowed_domains", "any_allowed_domains", "example.com", "example2.com",
                "example3.com"]))

    def test_spider_with_link_template(self):
        name = "seedsofchange"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t1, t2 = spec["templates"]
        target1, target2 = [HtmlPage(url=t["url"], body=t["original_body"]) for t in spec["templates"]]

        items, link_regions = spider.plugins['Annotations'].extract_items(target1)
        self.assertEqual(items, [])
        self.assertEqual(len(list(spider.plugins['Annotations']._process_link_regions(target1, link_regions))), 104)

        items, link_regions = spider.plugins['Annotations'].extract_items(target2)
        self.assertEqual(items[0], {
                '_template': u'4fac3b47688f920c7800000f',
                '_type': u'default',
                u'category': [u'Winter Squash'],
                u'days': [None],
                u'description': [u'1-2 lbs. (75-95 days)&nbsp;This early, extremely productive, compact bush variety is ideal for small gardens.&nbsp; Miniature pumpkin-shaped fruits have pale red-orange skin and dry, sweet, dark orange flesh.&nbsp; Great for stuffing, soups and pies.'],
                u'lifecycle': [u'Tender Annual'],
                u'name': [u'Gold Nugget'],
                u'price': [u'3.49'],
                u'product_id': [u'01593'],
                u'species': [u'Cucurbita maxima'],
                'url': u'http://www.seedsofchange.com/garden_center/product_details.aspx?item_no=PS14165',
                u'weight': [None]}
        )
        self.assertEqual(link_regions, [])
        self.assertEqual(len(list(spider.plugins['Annotations']._process_link_regions(target2, link_regions))), 0)

    def test_spider_with_link_region_but_not_link_template(self):
        name = "seedsofchange2"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t1, t2 = spec["templates"]

        target1, target2 = [HtmlPage(url=t["url"], body=t["original_body"]) for t in spec["templates"]]
        items, link_regions = spider.plugins['Annotations'].extract_items(target1)
        self.assertEqual(items[0], {
                '_template': u'4fad6a7c688f922437000014',
                '_type': u'default',
                u'category': [u'Onions'],
                u'days': [None],
                u'description': [u'(110-120 days)&nbsp; Midsized Italian variety.&nbsp; Long to intermediate day red onion that tolerates cool climates.&nbsp; Excellent keeper.&nbsp; We have grown out thousands of bulbs and re-selected this variety to be the top quality variety that it once was.&nbsp; 4-5&quot; bulbs are top-shaped, uniformly colored, and have tight skins.'],
                u'lifecycle': [u'Heirloom/Rare'],
                u'name': [u'Rossa Di Milano Onion'],
                u'price': [u'3.49'],
                u'species': [u'Alium cepa'],
                u'type': [u'Heirloom/Rare'],
                'url': u'http://www.seedsofchange.com/garden_center/product_details.aspx?item_no=PS15978'}
        )
        self.assertEqual(link_regions, [])

        items, link_regions = spider.plugins['Annotations'].extract_items(target2)
        self.assertEqual(items[0], {
                '_template': u'4fad6a7d688f922437000017',
                '_type': u'default',
                u'category': [u'Winter Squash'],
                u'days': [None],
                u'description': [u'1-2 lbs. (75-95 days)&nbsp;This early, extremely productive, compact bush variety is ideal for small gardens.&nbsp; Miniature pumpkin-shaped fruits have pale red-orange skin and dry, sweet, dark orange flesh.&nbsp; Great for stuffing, soups and pies.'],
                u'lifecycle': [u'Tender Annual'],
                u'name': [u'Gold Nugget'],
                u'price': [u'3.49'],
                u'species': [u'Cucurbita maxima'],
                'url': u'http://www.seedsofchange.com/garden_center/product_details.aspx?item_no=PS14165',
                u'weight': [None]}
        )
        self.assertEqual(len(link_regions), 1)
        self.assertEqual(len(list(spider.plugins['Annotations']._process_link_regions(target1, link_regions))), 25)

    def test_login_requests(self):
        name = "pinterest.com"
        spider = self.smanager.create(name)
        login_request = list(spider.start_requests())[0]

        response = HtmlResponse(url="https://pinterest.com/login/", body=open(join(_PATH, "data", "pinterest.html")).read())
        response.request = login_request
        form_request = login_request.callback(response)
        expected = {'_encoding': 'utf-8',
            'body': 'email=test&password=testpass&csrfmiddlewaretoken=nLZy3NMzhTswZvweHJ4KVmq9UjzaZGn3&_ch=ecnwmar2',
            'callback': 'after_login',
            'cookies': {},
            'dont_filter': True,
            'errback': None,
            'headers': {'Content-Type': ['application/x-www-form-urlencoded']},
            'meta': {},
            'method': 'POST',
            'priority': 0,
            'url': u'https://pinterest.com/login/?next=%2F'}

        self.assertEqual(request_to_dict(form_request, spider), expected)

        # simulate a simple response to login post from which extract a link
        response = HtmlResponse(url="http://pinterest.com/", body="<html><body><a href='http://pinterest.com/categories'></body></html>")
        result = list(spider.after_login(response))
        self.assertEqual([r.url for r in result], ['http://pinterest.com/categories', 'http://pinterest.com/popular/'])

    def test_generic_form_requests(self):
        name = "ebay"
        spider = self.smanager.create(name)
        generic_form_request = list(spider.start_requests())[0]

        response = HtmlResponse(url="http://www.ebay.com/sch/ebayadvsearch/?rt=nc", body=open(join(_PATH, "data", "ebay_advanced_search.html")).read())
        response.request = generic_form_request
        request_list = [request_to_dict(req, spider)
                             for req in generic_form_request.callback(response)]

        expected = [{'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/ebayadvsearch/?rt=nc', 'dont_filter': True, 'priority': 0, 'callback': 'parse', 'method': 'GET', 'errback': None}]
        self.assertEqual(request_list, expected)

    def test_generic_form_requests_with_file_field(self):
        name = "ebay2"
        spider = self.smanager.create(name)
        generic_form_request = list(spider.start_requests())[0]

        self.assertEqual(generic_form_request.url, 'file://tmp/test_params.txt')
        response = HtmlResponse(url='file://tmp/test_params.txt', body=open(join(_PATH, "data", "test_params.txt")).read())
        response.request = generic_form_request
        requests = list(generic_form_request.callback(response))
        request_list = [request_to_dict(req, spider) for req in requests]
        expected = [{'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {u'xpath': u"//form[@name='adv_search_from']", u'form_url': u'http://www.ebay.com/sch/ebayadvsearch/?rt=nc', u'type': u'form', 'field_index': 1, u'fields': [{u'xpath': u".//*[@name='_nkw']", 'file_values': ['Cars', 'Boats'], u'type': u'inurl', u'value': u'file://tmp/test_params.txt'}, {u'type': u'inurl', u'name': u'_nkw2', u'value': u'file://tmp/test_params.txt'}, {u'xpath': u".//*[@name='_in_kw']", u'type': u'iterate'}]}, 'headers': {}, 'url': u'file://tmp/test_params.txt', 'dont_filter': True, 'priority': 0, 'callback': 'parse_field_url_page', 'method': 'GET', 'errback': None}]
        self.assertEqual(request_list, expected)

        generic_form_request = requests[0]
        self.assertEqual(generic_form_request.url, 'file://tmp/test_params.txt')
        response = HtmlResponse(url='file://tmp/test_params.txt', body=open(join(_PATH, "data", "test_params.txt")).read())
        response.request = generic_form_request

        requests = list(generic_form_request.callback(response))
        request_list = [request_to_dict(req, spider) for req in requests]
        expected = [{'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {u'xpath': u"//form[@name='adv_search_from']", u'fields': [{u'xpath': u".//*[@name='_nkw']", 'file_values': ['Cars', 'Boats'], u'type': u'inurl', u'value': u'file://tmp/test_params.txt'}, {'file_values': ['Cars', 'Boats'], u'type': u'inurl', u'name': u'_nkw2', u'value': u'file://tmp/test_params.txt'}, {u'xpath': u".//*[@name='_in_kw']", u'type': u'iterate'}], u'type': u'form', 'field_index': 1}, 'headers': {}, 'url': u'http://www.ebay.com/sch/ebayadvsearch/?rt=nc', 'dont_filter': True, 'priority': 0, 'callback': 'parse_form_page', 'method': 'GET', 'errback': None}]
        self.assertEqual(request_list, expected)

        generic_form_request = requests[0]
        self.assertEqual(generic_form_request.url, 'http://www.ebay.com/sch/ebayadvsearch/?rt=nc')
        response = HtmlResponse(url="http://www.ebay.com/sch/ebayadvsearch/?rt=nc", body=open(join(_PATH, "data", "ebay_advanced_search.html")).read())
        response.request = generic_form_request
        request_list = [request_to_dict(req, spider)
                             for req in generic_form_request.callback(response)]
        expected = [{'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url':
            u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Cars&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_nkw2=Boats&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Boats&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=',
            'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None},
            {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {},
            'url': u'http://www.ebay.com/sch/ebayadvsearch/?rt=nc',
            'dont_filter': True, 'priority': 0, 'callback': 'parse', 'method': 'GET', 'errback': None}]
        self.assertEqual(request_list, expected)

    def test_generic_form_requests_with_spider_args(self):
        name = "ebay3"
        args = {'search_string': 'Cars'}
        spider = self.smanager.create(name, **args)
        generic_form_request = list(spider.start_requests())[0]

        response = HtmlResponse(url="http://www.ebay.com/sch/ebayadvsearch/?rt=nc", body=open(join(_PATH, "data", "ebay_advanced_search.html")).read())
        response.request = generic_form_request
        request_list = [request_to_dict(req, spider)
                             for req in generic_form_request.callback(response)]
        expected = [{'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=1&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=2&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=3&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/i.html?_adv=1&_ex_kw=&_ftrv=1&_ftrt=901&_sabdlo=&_sabdhi=&_sop=12&_samihi=&_ipg=50&_salic=1&_sasl=&_udlo=&_okw=&_fsradio=%26LH_SpecificSeller%3D1&_udhi=&_in_kw=4&_nkw=Cars&_sacat=0&_oexkw=&_dmd=1&_saslop=1&_samilow=', 'dont_filter': True, 'priority': 0, 'callback': 'after_form_page', 'method': 'GET', 'errback': None}, {'body': '', '_encoding': 'utf-8', 'cookies': {}, 'meta': {}, 'headers': {}, 'url': u'http://www.ebay.com/sch/ebayadvsearch/?rt=nc', 'dont_filter': True, 'priority': 0, 'callback': 'parse', 'method': 'GET', 'errback': None}]
        self.assertEqual(request_list, expected)

    def test_allowed_domains(self):
        name = "allowed_domains"
        spider = self.smanager.create(name)
        expected = ['www.ebay.com', 'www.yahoo.com']
        self.assertEqual(spider.allowed_domains, expected)

    def test_allowed_domains_all(self):
        name = "any_allowed_domains"
        spider = self.smanager.create(name)
        expected = None
        self.assertEqual(spider.allowed_domains, expected)

    def test_allowed_domains_previous_behavior(self):
        name = "cargurus"
        spider = self.smanager.create(name)
        expected = ['www.cargurus.com']
        self.assertEqual(spider.allowed_domains, expected)

    def test_links_from_rss(self):
        body = open(join(_PATH, "data", "rss_sample.xml")).read()
        response = XmlResponse(url="http://example.com/sample.xml", body=body,
                headers={'Content-Type': 'application/rss+xml;charset=ISO-8859-1'})

        name = "cargurus"
        spider = self.smanager.create(name)

        urls = [r.url for r in spider.parse(response)]
        self.assertEqual(len(urls), 3)
        self.assertEqual(set(urls), set([
                "http://www.cargurus.com/Cars/2004-Alfa-Romeo-GT-Reviews-c10012",
                "http://www.cargurus.com/Cars/2005-Alfa-Romeo-GT-Reviews-c10013",
                "http://www.cargurus.com/Cars/2007-Alfa-Romeo-GT-Reviews-c10015"]))

    def test_empty_content_type(self):
        name = "ebay4"
        spider = self.smanager.create(name)
        generic_form_request = list(spider.start_requests())[0]

        response = Response(url="http://www.ebay.com/sch/ebayadvsearch/?rt=nc",
                            body=open(join(_PATH, "data", "ebay_advanced_search.html")).read())
        response.request = generic_form_request
        # must not raise an error
        for result in spider.parse(response):
            pass

    def test_variants(self):
        """Ensure variants are extracted as list of dicts"""

        name = "networkhealth.com"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        template, = spec["templates"]
        target = HtmlPage(url=template["url"], body=template["original_body"])
        items, link_regions = spider.plugins['Annotations'].extract_items(target)
        for item in items:
            for variant in item["variants"]:
                self.assertEqual(type(variant), dict)

    def test_start_requests(self):
        name = "example.com"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        start_requests = list(spider.start_requests())
        self.assertEqual(len(start_requests), 2)
        self.assertEqual(start_requests[0].url, 'http://www.example.com/products.csv')
        self.assertEqual(start_requests[1].url, 'http://www.example.com/index.html')

        csv = """
My feed

name,url,id
Product A,http://www.example.com/path,A
Product B,http://www.example.com/path2,B"""
        response = TextResponse(url="http://www.example.com/products.csv", body=csv)
        requests = list(start_requests[0].callback(spider, response))
        self.assertEqual(len(requests), 2)
        self.assertEqual(requests[0].url, 'http://www.example.com/path')
        self.assertEqual(requests[1].url, 'http://www.example.com/path2')

    def test_start_requests_allowed_domains(self):
        name = "example2.com"
        spider = self.smanager.create(name)
        self.assertEqual(spider.allowed_domains, ['www.example.com'])

    def test_override_start_urls(self):
        name = "example2.com"
        spider = self.smanager.create(name, start_urls=['http://www.example.com/override.html'])
        start_requests = list(spider.start_requests())
        self.assertEqual(start_requests[1].url, 'http://www.example.com/override.html')

    def test_links_to_follow(self):
        html = "<html><body><a href='http://www.example.com/link.html'>Link</a></body></html>"
        response = HtmlResponse(url='http://www.example.com/index.html', body=html)

        name = "example3.com"
        spider = self.smanager.create(name, links_to_follow='none')
        start_requests = list(spider.start_requests())

        requests = list(start_requests[0].callback(response))
        self.assertEqual(len(requests), 0)

    def test_js_enable_patterns(self):
        with splash_spider_manager() as manager:
            spider = manager.create("example3.com", js_enabled=True,
                                    js_enable_patterns=['/products/'])
        product_url = 'http://www.example.com/products/1234'
        aboutus_url = 'http://www.example.com/aboutus'
        request = spider._add_splash_meta(Request(product_url))
        self.assertEqual(request.meta['splash']['args']['url'], product_url)
        request = spider._add_splash_meta(Request(aboutus_url))
        self.assertEqual(request.meta.get('splash'), None)

    def test_js_disable_patterns(self):
        with splash_spider_manager() as manager:
            spider = manager.create("example3.com", js_enabled=True,
                                    js_disable_patterns=['/products/'])
        product_url = 'http://www.example.com/products/1234'
        aboutus_url = 'http://www.example.com/aboutus'
        request = spider._add_splash_meta(Request(product_url))
        self.assertEqual(request.meta.get('splash'), None)
        request = spider._add_splash_meta(Request(aboutus_url))
        self.assertEqual(request.meta['splash']['args']['url'], aboutus_url)

    def test_js_enable_and_disable_patterns(self):
        with splash_spider_manager() as manager:
            spider = manager.create("example3.com", js_enabled=True,
                                    js_enable_patterns=['/products/'],
                                    js_disable_patterns=['/products/[a-zA-Z]'])
        product_list_url = 'http://www.example.com/products/cameras'
        product_url = 'http://www.example.com/products/1234'
        request = spider._add_splash_meta(Request(product_list_url))
        self.assertEqual(request.meta.get('splash'), None)
        request = spider._add_splash_meta(Request(product_url))
        self.assertEqual(request.meta['splash']['args']['url'], product_url)
