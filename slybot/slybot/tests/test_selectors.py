from unittest import TestCase
from scrapy.http import HtmlResponse, Request
from slybot.spidermanager import SlybotSpiderManager

from .utils import open_spider_page_and_results, PATH


class SpiderTest(TestCase):
    smanager = SlybotSpiderManager("%s/data/SampleProject" % PATH)

    def test_spider_with_selectors(self):
        name = "seedsofchange"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t = spec["templates"][1]
        response = HtmlResponse(t["url"], body=t["original_body"].encode('utf-8'))

        item = {
            '_template': u'4fac3b47688f920c7800000f',
            '_type': u'default',
            'image': u'previous data',
        }

        spider.plugins['Selectors'].process_item(item, response)

        self.assertEqual(item['breadcrumbs'], [u'Seeds & Supplies', u'Seeds', u'Vegetables', u'Squash & Pumpkins'])
        self.assertEqual(item['image'], [u'previous data', u'/images/product_shots/PPS14165B.jpg'])

    def test_spider_with_inbuilt_selectors(self):
        """Test selectors for text, price, date and html extractors."""
        name = 'books.toscrape.com'
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t = [t for t in spec["templates"]
             if t['page_id'] == "0a96a4dba3c62275ecf13903f42a007dd06718d8"][0]
        response = HtmlResponse(t['url'], body=t['original_body'].encode('utf-8'))
        results = [i for i in spider.parse(response)
                   if hasattr(i, '__getitem__')]
        for result in results:
            result['posted'] = [result['posted'][0].strftime('%Y-%m-%d %H:%M')]
        self.assertEqual(results, t['_results'])

    def test_spider_with_surrounded_selectors(self):
        spider, page, results = open_spider_page_and_results('cs-cart.json')
        items = [i for i in spider.parse(page) if not isinstance(i, Request)]
        self.assertEqual(items, results)
