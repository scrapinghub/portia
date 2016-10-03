from scrapy import Request


class FeedGenerator(object):
    def __init__(self, callback):
        self.callback = callback

    def __call__(self, url):
        return Request(url, callback=self.parse_urls)

    def parse_urls(self, response):
        newline_urls = response.text.split('\n')
        urls = [url.replace('\r', '') for url in newline_urls if url]
        for url in urls:
            yield Request(url, callback=self.callback)
