from unittest import TestCase
from os.path import dirname

from scrapy.http import HtmlResponse
from scrapy.settings import Settings
from scrapy.item import DictItem
from scrapy.exceptions import DropItem

from slybot.spidermanager import SlybotSpiderManager
from slybot.dupefilter import DupeFilterPipeline

_PATH = dirname(__file__)

class DupeFilterTest(TestCase):
    smanager = SlybotSpiderManager("%s/data/SampleProject" % _PATH)

    def test_dupefilter(self):
        name = "seedsofchange2"
        spider = self.smanager.create(name)
        spec = self.smanager._specs["spiders"][name]
        t1, t2 = spec["templates"]

        dupefilter = DupeFilterPipeline(Settings({"SLYDUPEFILTER_ENABLED": True}))

        response1 = HtmlResponse(url=t1["url"], body=t1["original_body"].encode('utf-8'))
        response2 = HtmlResponse(url=t2["url"], body=t2["original_body"].encode('utf-8'))

        result1 = spider.handle_html(response1)
        for item1 in result1:
            if isinstance(item1, DictItem):
                break

        result2 = spider.handle_html(response2)
        for item2 in result2:
            if isinstance(item2, DictItem):
                break

        self.assertEqual(item1, dupefilter.process_item(item1, spider))
        self.assertEqual(item2, dupefilter.process_item(item2, spider))

        self.assertRaises(DropItem, dupefilter.process_item, item1, spider)
