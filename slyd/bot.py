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
import json, errno
from functools import partial
from twisted.web.resource import Resource
from twisted.web.server import NOT_DONE_YET
from scrapy.http import Request
from scrapy.spider import BaseSpider
from scrapy.item import DictItem
from scrapy import signals, log
from scrapy.crawler import Crawler
from scrapy.http import HtmlResponse
from scrapy.exceptions import DontCloseSpider
from scrapy.utils.request import request_fingerprint
from slybot.spider import IblSpider
from .html import html4annotation


def create_bot_resource(spec_manager):
    bot = Bot(spec_manager.settings, spec_manager)
    bot.putChild('fetch', Fetch(bot))
    return bot


class Bot(Resource):
    spider = BaseSpider('slyd')

    def __init__(self, settings, spec_manager):
        # twisted base class is old-style so we cannot user super()
        Resource.__init__(self)
        self.spec_manager = spec_manager
        # initialize scrapy crawler
        crawler = Crawler(settings)
        crawler.configure()
        crawler.signals.connect(self.keep_spider_alive, signals.spider_idle)
        crawler.crawl(self.spider)
        crawler.start()

        self.crawler = crawler
        log.msg("bot initialized", level=log.DEBUG)

    def keep_spider_alive(self, spider):
        raise DontCloseSpider("keeping it open")

    def stop(self):
        """Stop the crawler"""
        self.crawler.stop()
        log.msg("bot stopped", level=log.DEBUG)


class BotResource(Resource):
    def __init__(self, bot):
        Resource.__init__(self)
        self.bot = bot


class Fetch(BotResource):
    isLeaf = True

    def render_POST(self, request):
        #TODO: validate input data, handle errors, etc.
        params = read_json(request)
        scrapy_request_kwargs = params['request']
        scrapy_request_kwargs.update(
            callback=self.fetch_callback,
            errback=partial(self.fetch_errback, request),
            dont_filter=True,  # TODO: disable duplicate middleware
            meta=dict(
                handle_httpstatus_all=True,
                twisted_request=request,
                slyd_request_params=params
            )
        )
        request = Request(**scrapy_request_kwargs)
        self.bot.crawler.engine.schedule(request, self.bot.spider)
        return NOT_DONE_YET

    def fetch_callback(self, response):
        request = response.meta['twisted_request']
        result_response = dict(status=response.status,
                headers=response.headers.to_string())
        if response.status != 200:
            finish_request(request, response=result_response)
            return
        if not isinstance(response, HtmlResponse):
            msg = "Non-html response: %s" % response.headers.get(
                'content-type', 'no content type')
            finish_request(request, error=msg)
        try:
            params = response.meta['slyd_request_params']
            cleaned_html = html4annotation(response)
            # we may want to include some headers
            fingerprint = request_fingerprint(response.request)
            result_response = dict(status=response.status,
                headers=response.headers.to_string())
            result = dict(page=cleaned_html, fp=fingerprint,
                response=result_response)
            spider = self.create_spider(request.project, params)
            if spider is not None:
                items = []
                links = []
                for value in spider.parse(response):
                    if isinstance(value, Request):
                        links.append(value.url)
                    elif isinstance(value, DictItem):
                        items.append(value._values)
                    else:
                        raise ValueError("Unexpected type %s from spider"
                            % type(value))
                result['items'] = items
                # TODO: add not followed links
                result['links'] = dict(followed=links, notfollowed=[])
            finish_request(request, **result)
        except Exception as ex:
            log.err()
            finish_request(request, response=result_response,
                error="unexpected internal error: %s" % ex)

    def create_spider(self, project, params, **kwargs):
        spider = params.get('spider')
        if spider is None:
            return
        pspec = self.bot.spec_manager.project_spec(project)
        try:
            spider_spec = pspec.resource('spiders', spider)
            items_spec = pspec.resource('items')
            extractors = pspec.resource('extractors')
            return IblSpider(spider, spider_spec, items_spec, extractors,
                **kwargs)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                log.msg("skipping extraction, no spec: %s" % ex.filename)
            else:
                raise

    def fetch_errback(self, twisted_request, failure):
        msg = "unexpected error response: %s" % failure
        log.msg(msg, level=log.ERROR)
        finish_request(twisted_request, error=msg)


def read_json(request):
    data = request.content.getvalue()
    return json.loads(data)


def finish_request(trequest, **resp_obj):
    jdata = json.dumps(resp_obj)
    trequest.setResponseCode(200)
    trequest.setHeader('Content-Type', 'application/json')
    trequest.setHeader('Content-Length', len(jdata))
    trequest.write(jdata)
    trequest.finish()
