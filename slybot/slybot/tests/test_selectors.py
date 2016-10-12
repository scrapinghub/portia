from unittest import TestCase
from scrapy.http import HtmlResponse
from slybot.spidermanager import SlybotSpiderManager
from os.path import dirname
_PATH = dirname(__file__)

class SpiderTest(TestCase):
    smanager = SlybotSpiderManager("%s/data/SampleProject" % _PATH)

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
        name = 'books.toscrape.com'
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t = spec["templates"][0]
        response = HtmlResponse(t['url'], body=t['original_body'].encode('utf-8'))
        results = [i for i in spider.parse(response)
                   if hasattr(i, '__getitem__')]
        for result in results:
            result['posted'] = [result['posted'][0].strftime('%Y-%m-%d %H:%M')]
        self.assertEqual(results, t['_results'])
