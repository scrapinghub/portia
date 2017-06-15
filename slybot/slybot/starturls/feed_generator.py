import re
from scrapy import Request
_NEWLINE_RE = re.compile('[\r\n]')


class FeedGenerator(object):
    def __init__(self, callback):
        self.callback = callback

    def __call__(self, url):
        return Request(url, callback=self.parse_urls)

    def parse_urls(self, response):
        newline_urls = _NEWLINE_RE.split(response.text)
        urls = [url for url in newline_urls if url]
        for url in urls:
            yield Request(url, callback=self.callback)
