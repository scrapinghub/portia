from unittest import TestCase
from slybot.pageactions import filter_for_url, PageActionsMiddleware
from os.path import dirname
from scrapy import Request
from scrapy import Spider
from slybot.spider import IblSpider
_PATH = dirname(__file__)

def mkreq():
    return Request('http://localhost:9050', meta={
        "splash": {
            "endpoint": "render.html",
            "args": {
                "url": "http://test.com",
            }
        }
    })

class PATest(TestCase):
    def test_url_filter(self):
        f = filter_for_url('http://test.com/path/foo/bar')
        self.assertTrue(f(dict(accept="\\/\\/test.com", reject="baz")))
        self.assertTrue(f(dict(accept=None, reject="baz")))
        self.assertTrue(f(dict(accept='foo/bar', reject=None)))

        self.assertFalse(f(dict(accept="//test.com", reject="foo/bar")))
        self.assertFalse(f(dict(accept="foo", reject="bar")))
        self.assertFalse(f(dict(accept=None, reject="foo/bar")))
        self.assertFalse(f(dict(accept="baz", reject=None)))

    def test_middleware(self):
        m = PageActionsMiddleware()
        spider = Spider('test_spider')

        req = mkreq()
        spider.page_actions = [{
            "type": "click",
            "selector": "#showmore"
        }]
        m.process_request(req, spider)
        self.assertEqual(req.meta['splash']['endpoint'], 'execute') # Page actions enabled

        req = mkreq()
        spider.page_actions = []
        m.process_request(req, spider)
        self.assertEqual(req.meta['splash']['endpoint'], 'render.html') # Page actions disabled

        req = mkreq()
        spider.page_actions = [{
            "type": "click",
            "selector": "#showmore",
            "reject": "test\\.com"
        }]
        m.process_request(req, spider)
        self.assertEqual(req.meta['splash']['endpoint'], 'render.html') # Page actions disabled

