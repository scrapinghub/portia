from scrapy.http import HtmlResponse

from slyd.html import descriptify
from slybot.baseurl import insert_base_url


def clean(html, url):
    return insert_base_url(descriptify(html, url), url)


def open_tab(func):
    def wrapper(data, socket):
        if socket.tab is None:
            socket.open_tab(data.get('_meta'))
            socket.open_spider(data.get('_meta'))
        return func(data, socket)
    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper


def page(url, html):
    return HtmlResponse(url, 200, {}, html, encoding='utf-8')
