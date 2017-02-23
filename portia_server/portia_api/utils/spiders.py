import json

from scrapy.settings import Settings
from slybot.spider import IblSpider


def load_spider_data(model):
    storage = model.storage
    items = json.load(storage.open_with_default('items.json', {}))
    extractors = json.load(storage.open_with_default('extractors.json', {}))
    spider = json.loads(model.dumps())
    spider['templates'] = []
    samples = []
    for sample in model.samples:
        json_sample = json.loads(sample.dumps())
        default = u'<html></html>'
        for key in ('original_body', 'rendered_body'):
            try:
                html = getattr(sample, key).html
                assert html
                json_sample[key] = html
            except (IOError, AttributeError, AssertionError):
                json_sample[key] = default
            else:
                default = json_sample[key]
        samples.append(json_sample)
    spider['templates'] = samples
    return model.id, spider, items, extractors


def load_spider(model):
    name, spider, items, extractors = load_spider_data(model)
    return IblSpider(name, spider, items, extractors, Settings())
