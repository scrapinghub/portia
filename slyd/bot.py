"""
Bot resource

Defines bot/fetch endpoint, e.g.:
    curl -d '{"request": {"url": "http://scrapinghub.com/"}}' http://localhost:9001/bot/fetch

The "request" is an object whose fields match the parameters of a Scrapy
request:
    http://doc.scrapy.org/en/latest/topics/request-response.html#scrapy.http.Request

Returns a json object. If there is an "error" field, that holds the request
error to display. Otherwise you will find the following fields:
    * page -- the retrieved page - will be annotated in future

"""

import json
from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET
from scrapy.http import Request
from scrapy.spider import BaseSpider
from scrapy import signals, log
from scrapy.crawler import Crawler
from scrapy.http import HtmlResponse
from scrapy.settings import Settings
from scrapy.exceptions import DontCloseSpider


def create_bot_resource():
    bot = Bot()
    bot.putChild('fetch', Fetch(bot))
    return bot


class Bot(Resource):
    spider = BaseSpider('slyd')

    def __init__(self):
        # twisted base class is old-style so we cannot user super()
        Resource.__init__(self)
        # initialize scrapy
        log.start()
        crawler = Crawler(Settings())
        crawler.configure()
        crawler.signals.connect(self.keep_spider_alive, signals.spider_idle)
        crawler.crawl(self.spider)
        crawler.start()
        self.crawler = crawler
        log.msg("bot initialized")

    def keep_spider_alive(self, spider):
        raise DontCloseSpider("keeping it open")


class BotResource(Resource):
    def __init__(self, bot):
        Resource.__init__(self)
        self.bot = bot


class Fetch(BotResource):

    def render_POST(self, request):
        #TODO: validate input data, handle errors, etc.
        params = read_json(request)
        scrapy_request_kwargs = params['request']
        scrapy_request_kwargs.update(
            callback=self.fetch_callback,
            errback=self.fetch_errback,
            dont_filter=True,  # TODO: disable duplicate middleware
            meta=dict(
                handle_httpstatus_all=True,
                twisted_request=request
            )
        )
        request = Request(**scrapy_request_kwargs)
        self.bot.crawler.engine.schedule(request, self.bot.spider)
        return NOT_DONE_YET

    def fetch_callback(self, response):
        if response.status != 200:
            write_json(response, error="Received http %s" % response.status)
        if not isinstance(response, HtmlResponse):
            msg = "Non-html response: %s" % response.headers.get(
                'content-type', 'no content type')
            write_json(response, error=msg)
        body = response.body_as_unicode()
        write_json(response, page=body)

    def fetch_errback(self, failure):
        msg = "unexpected error response: %s" % failure
        log.msg(msg, level=log.ERROR)
        write_json(error=msg)


def read_json(request):
    data = request.content.getvalue()
    return json.loads(data)


def write_json(response, **resp_obj):
    request = response.meta['twisted_request']
    jdata = json.dumps(resp_obj)
    request.setHeader('Content-Type', 'application/json')
    request.setHeader('Content-Length', len(jdata))
    request.write(jdata)
    request.finish()
