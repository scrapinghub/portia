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
import errno

from functools import partial
from twisted.web.http import RESPONSES
from twisted.web.resource import Resource
from twisted.web.server import failure, NOT_DONE_YET
from scrapy.http import Request
from scrapy.item import DictItem
from scrapy import signals, log
from scrapy.crawler import CrawlerRunner
from scrapy.http import HtmlResponse, XmlResponse
from scrapy.exceptions import DontCloseSpider
from scrapy.utils.request import request_fingerprint
from scrapy.utils.serialize import ScrapyJSONEncoder
try:
    from scrapy.spider import Spider
except ImportError:
    # BaseSpider class was deprecated in Scrapy 0.21
    from scrapy.spider import BaseSpider as Spider
from slybot.spider import IblSpider
from .html import html4annotation, extract_html
from .resource import SlydJsonResource


def create_bot_resource(spec_manager):
    bot = Bot(spec_manager.settings, spec_manager)
    bot.putChild('fetch', Fetch(bot))
    return bot


class SlydSpider(Spider):
    name = 'slyd'


class Bot(Resource):
    spider = SlydSpider()

    def __init__(self, settings, spec_manager):
        # twisted base class is old-style so we cannot user super()
        Resource.__init__(self)
        self.spec_manager = spec_manager
        settings.set('PLUGINS', [p['bot'] for p in settings.get('PLUGINS')])
        self.runner = CrawlerRunner(settings)
        log.msg("bot initialized", level=log.DEBUG)

    def keep_spider_alive(self, spider):
        raise DontCloseSpider("keeping it open")

    def stop(self):
        """Stop the crawler"""
        self.runner.stop()
        log.msg("bot stopped", level=log.DEBUG)


class BotResource(SlydJsonResource):
    def __init__(self, bot):
        Resource.__init__(self)
        self.bot = bot


class Fetch(BotResource):
    isLeaf = True

    def render_POST(self, request):
        # TODO: validate input data, handle errors, etc.
        params = self.read_json(request)
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
        request.notifyFinish().addErrback(self._requestDisconnect)

        scrapy_request_kwargs.setdefault('headers', {})
        user_agent = request.requestHeaders.getRawHeaders('user-agent')
        if user_agent:
            scrapy_request_kwargs['headers'].setdefault('user-agent',
                                                        user_agent[0])
        scrapy_request = Request(**scrapy_request_kwargs)
        self.bot.runner.crawl(SlydSpider)
        crawler = list(self.bot.runner.crawlers)[0]
        crawler.signals.connect(self.bot.keep_spider_alive,
                                signals.spider_idle)
        crawler.engine.schedule(scrapy_request, crawler.spider)

        return NOT_DONE_YET

    def _requestDisconnect(self, result):
        self.bot.runner.stop()

    def _get_template_name(self, template_id, templates):
        for template in templates:
            if template['page_id'] == template_id:
                return template['name']

    def fetch_callback(self, response):
        request = response.meta['twisted_request']
        result_response = dict(status=response.status,
                               headers=response.headers.to_string())
        if response.status != 200:
            msg = "The request to the web-server was not successful. " \
                  "The server returned: %d %s" % (
                      response.status,
                      RESPONSES[response.status])
            finish_request(request, error=msg, response=result_response)
            return
        if not isinstance(response, (HtmlResponse, XmlResponse)):
            msg = "The request to the web-server was not successful. " \
                  "The web-server returned a non-html response: %s" % \
                  response.headers.get(
                      'content-type', 'no content type')
            finish_request(request, error=msg)
            return
        try:
            params = response.meta['slyd_request_params']
            baseurl = params.get('baseurl', response.url)
            original_html = extract_html(response)
            cleaned_html = html4annotation(original_html, baseurl)
            # we may want to include some headers
            fingerprint = request_fingerprint(response.request)
            result_response = dict(status=response.status,
                                   headers=response.headers.to_string())
            result = dict(page=cleaned_html, original=original_html,
                          fp=fingerprint, response=result_response)
            # HACKY: return the spider but also return the template specs.
            # We need them to map the template_id to the template name.
            spider, templates = self.create_spider(
                request.project, request.auth_info, params)
            if spider is not None:
                items = []
                links = []
                for value in spider.parse(response):
                    if isinstance(value, Request):
                        links.append(value.url)
                    elif isinstance(value, DictItem):
                        value['_template_name'] = self._get_template_name(
                            value['_template'], templates)
                        items.append(value._values)
                    else:
                        raise ValueError("Unexpected type %s from spider" %
                                         type(value))
                result['items'] = items
                result['links'] = links
            finish_request(request, **result)
        except Exception:
            request.processingFailed(failure.Failure())

    def create_spider(self, project, auth_info, params, **kwargs):
        spider = params.get('spider')
        if spider is None:
            return None, None
        pspec = self.bot.spec_manager.project_spec(project, auth_info)
        try:
            spider_spec = pspec.spider_with_templates(spider)
            items_spec = pspec.resource('items')
            extractors = pspec.resource('extractors')
            return (IblSpider(spider, spider_spec, items_spec, extractors,
                              self.bot.runner.settings, **kwargs),
                    spider_spec['templates'])
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                log.msg("skipping extraction, no spec: %s" % ex.filename)
                return None, None
            else:
                raise

    def fetch_errback(self, twisted_request, failure):
        msg = "The request to the web-server failed. " \
              "The crawler engine returned an error: %s" \
              % failure.getErrorMessage()
        log.err(failure)
        finish_request(twisted_request, error=msg)


def finish_request(trequest, **resp_obj):
    jdata = json.dumps(resp_obj, cls=ScrapyJSONEncoder, sort_keys=True)
    trequest.setResponseCode(200)
    trequest.setHeader('Content-Type', 'application/json')
    trequest.setHeader('Content-Length', len(jdata))
    trequest.write(jdata)
    trequest.finish()
