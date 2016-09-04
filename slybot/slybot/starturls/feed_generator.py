from scrapy import Request


class FeedGenerator(object):
    def __init__(self, callback):
        self.callback = callback

    def __call__(self, url):
        raw_url = self.rawify(url)
        return Request(raw_url, callback=self.parse_urls)

    @staticmethod
    def rawify(url):
        not_raw = 'raw' not in url
        if 'gist.github' in url and not_raw:
            trailing_slash = '' if url[-1] == '/' else '/'
            return url + trailing_slash + 'raw'

        if 'dropbox.com' in url and not_raw:
            return url + '&raw=1'

        if 'google.com' in url and 'export' not in url:
            components = url.split('/')
            return '/'.join(components[:-1] + ['export?format=txt'])

        return url


    def parse_urls(self, response):
        newline_urls = response.text.split('\n')
        urls = [url.replace('\r', '') for url in newline_urls if url]
        for url in urls:
            yield Request(url, callback=self.callback)
