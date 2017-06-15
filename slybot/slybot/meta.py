"""
Clean up meta data if it is not wanted in the final output
"""
from scrapy.exceptions import NotConfigured
from scrapy.exceptions import DropItem


class DropMetaPipeline(object):
    def __init__(self, settings):
        if not settings.getbool('SLYDROPMETA_ENABLED'):
            raise NotConfigured

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler.settings)

    def process_item(self, item, spider):
        if not hasattr(item, 'items'):
            return item
        meta_keys = []
        for key, value in item.items():
            if key.startswith('_'):
                meta_keys.append(key)
            if isinstance(value, list):
                for v in value:
                    self.process_item(v, spider)
            else:
                self.process_item(value, spider)
        for key in meta_keys:
            del item[key]
        return item
