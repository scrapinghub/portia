import logging

from twisted.internet import defer
from twisted.web.client import getPage

from scrapy import Request
from scrapy.http import HtmlResponse
from scrapy.utils.misc import arg_to_iter

from crochet import setup, wait_for, TimeoutError
setup()


class FetchError(Exception):
    status = 400

    def __init__(self, errors):
        for error in errors:
            print(vars(error))
        self.errors = errors
        self.message = str(self)

    def __str__(self):
        return '\n'.join(e.getErrorMessage() for e in self.errors)


def get_page(times, url):
    errors = []
    deferred = defer.Deferred()

    def run():
        d = getPage(url)
        d.addCallbacks(lambda html: deferred.callback((url, html)), error)

    def error(error):
        errors.append(error)
        retry = True if len(errors) < times else False
        logging.warn('Failed to get %s %d times, %s', url, len(errors),
                     'retrying' if retry else 'stop')
        run() if retry else deferred.errback((url, errors))
    run()
    return deferred


def _load_urls(urls):
    deferreds = []
    for url in urls:
        deferreds.append(get_page(3, url.encode('utf-8')))
    return defer.DeferredList(deferreds)


@wait_for(timeout=50)
def load_urls(urls):
    return _load_urls(urls)


class Pages(object):
    def __init__(self, urls, spider):
        if hasattr(urls, 'get'):
            urls = urls.get('urls', [])
        if isinstance(urls, dict):
            self.urls = urls.items()
        else:
            self.urls = urls
        self.spider = spider

    def fetch(self):
        try:
            responses = load_urls(self.urls)
        except TimeoutError:
            raise FetchError(['Requests timed out, try loading fewer urls'])
        results, errors = [], []
        for success, result in responses:
            if not success:
                errors.append(result.value[1][-1])
            else:
                results.extend(arg_to_iter(self.process(*result)))
        if errors and not results:
            raise FetchError(errors)
        return results

    def process(self, url, page):
        return HtmlResponse(url, body=page, request=Request(url))

    def extract_items(self):
        responses = self.fetch()
        items = []
        for response in responses:
            page_key = response.meta.get('page_key') or response.url
            item = {'key': page_key, 'items': None, 'templates': None}
            extracted_items = [dict(i) for i in self.spider.parse(response)
                               if not isinstance(i, Request)]
            if extracted_items:
                item['items'] = extracted_items
                item['templates'] = [i['_template'] for i in extracted_items
                                     if i.get('_template')]
                items.append(item)
        return items
