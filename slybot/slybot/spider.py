from __future__ import absolute_import
import json
import re

from operator import itemgetter
from copy import deepcopy
import itertools
from six.moves.urllib_parse import urlparse

from w3lib.http import basic_auth_header

from scrapy.http import Request, HtmlResponse, FormRequest
import six
try:
    from scrapy.spiders import Spider
except ImportError:
    # BaseSpider class was deprecated in Scrapy 0.21
    from scrapy.spider import BaseSpider as Spider

from loginform import fill_login_form

from slybot.utils import (iter_unique_scheme_hostname, load_plugins,
                          load_plugin_names, IndexedDict)
from slybot.linkextractor import create_linkextractor_from_specs
from slybot.generic_form import GenericForm

STRING_KEYS = ['start_urls', 'exclude_patterns', 'follow_patterns',
               'allowed_domains', 'js_enabled', 'js_enable_patterns',
               'js_disable_patterns']


class IblSpider(Spider):

    def __init__(self, name, spec, item_schemas, all_extractors, settings=None,
                 **kw):
        super(IblSpider, self).__init__(name, **kw)
        spec = deepcopy(spec)
        for key, val in kw.items():
            if isinstance(val, six.string_types) and key in STRING_KEYS:
                val = val.splitlines()
            spec[key] = val

        self._item_template_pages = sorted(
            ((t['scrapes'], t) for t in spec['templates']
             if t.get('page_type', 'item') == 'item'), key=itemgetter(0))

        self._templates = [templ for _, templ in self._item_template_pages]

        self.plugins = IndexedDict()
        for plugin_class, plugin_name in zip(load_plugins(settings),
                                             load_plugin_names(settings)):
            instance = plugin_class()
            instance.setup_bot(settings, spec, item_schemas, all_extractors)
            self.plugins[plugin_name] = instance

        self.js_enabled = False
        self.SPLASH_HOST = None
        if settings.get('SPLASH_URL'):
            self.SPLASH_HOST = urlparse(settings.get('SPLASH_URL')).hostname
            self.js_enabled = spec.get('js_enabled', False)
        if self.js_enabled and (settings.get('SPLASH_PASS') is not None or
                                settings.get('SPLASH_USER') is not None):
            self.splash_auth = basic_auth_header(
                settings.get('SPLASH_USER', ''),
                settings.get('SPLASH_PASS', ''))
        self._filter_js_urls = self._build_js_url_filter(spec)
        self.login_requests = []
        self.form_requests = []
        self._start_requests = []
        self.generic_form = GenericForm(**kw)
        self._create_init_requests(spec.get("init_requests", []))
        self._process_start_urls(spec)
        self.allowed_domains = spec.get(
            'allowed_domains',
            self._get_allowed_domains(self._templates)
        )
        if not self.allowed_domains:
            self.allowed_domains = None

    def _process_start_urls(self, spec):
        self.start_urls = spec.get('start_urls')
        for url in self.start_urls:
            request = Request(url, callback=self.parse, dont_filter=True)
            self._add_splash_meta(request)
            self._start_requests.append(request)

    def _create_init_requests(self, spec):
        for rdata in spec:
            if rdata["type"] == "login":
                request = Request(url=rdata.pop("loginurl"), meta=rdata,
                                  callback=self.parse_login_page,
                                  dont_filter=True)
                self._add_splash_meta(request)
                self.login_requests.append(request)
            elif rdata["type"] == "form":
                self.form_requests.append(
                    self.get_generic_form_start_request(rdata)
                )
            elif rdata["type"] == "start":
                self._start_requests.append(
                    self._create_start_request_from_specs(rdata)
                )

    def parse_login_page(self, response):
        username = response.request.meta["username"]
        password = response.request.meta["password"]
        args, url, method = fill_login_form(response.url, response.body,
                                            username, password)
        return FormRequest(url, method=method, formdata=args,
                           callback=self.after_login, dont_filter=True)

    def after_login(self, response):
        for result in self.parse(response):
            yield result
        for req in self._start_requests:
            yield req

    def get_generic_form_start_request(self, form_descriptor):
        file_fields = list(self.generic_form.get_url_field(form_descriptor))
        if file_fields:
            (field_index, field_descriptor) = file_fields.pop(0)
            form_descriptor['field_index'] = field_index
            return FormRequest(self.generic_form.get_value(field_descriptor),
                               meta=form_descriptor,
                               callback=self.parse_field_url_page,
                               dont_filter=True)
        else:
            return Request(url=form_descriptor.pop("form_url"),
                           meta=form_descriptor, callback=self.parse_form_page,
                           dont_filter=True)

    def parse_field_url_page(self, response):
        form_descriptor = response.request.meta
        field_index = form_descriptor['field_index']
        field_descriptor = form_descriptor['fields'][field_index]
        self.generic_form.set_values_url_field(field_descriptor, response.body)
        yield self.get_generic_form_start_request(form_descriptor)

    def parse_form_page(self, response):
        fill_form = self.generic_form.fill_generic_form
        try:
            for (args, url, method) in fill_form(response.url, response.body,
                                                 response.request.meta):
                yield FormRequest(url, method=method, formdata=args,
                                  callback=self.after_form_page,
                                  dont_filter=True)
        except Exception as e:
            self.logger.warning(str(e))
        for req in self._start_requests:
            yield req

    def after_form_page(self, response):
        for result in self.parse(response):
            yield result

    def _get_allowed_domains(self, templates):
        urls = [x['url'] for x in templates]
        urls += [x.url for x in self._start_requests]
        return [x[1] for x in iter_unique_scheme_hostname(urls)]

    def start_requests(self):
        start_requests = []
        if self.login_requests:
            start_requests = self.login_requests
        elif self.form_requests:
            start_requests = self.form_requests
        else:
            start_requests = self._start_requests
        for req in start_requests:
            yield req

    def _create_start_request_from_specs(self, info):
        url = info["url"]
        lspecs = info.get("link_extractor")
        if lspecs:
            linkextractor = create_linkextractor_from_specs(lspecs)

            def _callback(spider, response):
                for link in linkextractor.links_to_follow(response):
                    request = Request(url=link.url, callback=spider.parse)
                    yield self._add_splash_meta(request)
            request = Request(url=url, callback=_callback)
            return self._add_splash_meta(request)
        request = Request(url=url, callback=self.parse)
        return self._add_splash_meta(request)

    def parse(self, response):
        """Main handler for all downloaded responses"""
        request = response.request
        if (request and request.method == 'POST' and
                urlparse(request.url).hostname == self.SPLASH_HOST):
            url = (json.loads(request.body).get('url'))
            if url:
                response._url = url
        content_type = response.headers.get('Content-Type', '')
        if isinstance(response, HtmlResponse):
            return self.handle_html(response)
        elif "application/rss+xml" in content_type:
            return self.handle_rss(response)
        else:
            self.logger.debug(
                "Ignoring page with content-type=%r: %s" % (content_type,
                                                            response.url)
            )
            return []

    def _plugin_hook(self, name, *args):
        results = []
        for plugin in self.plugins.values():
            if hasattr(plugin, name):
                results.append(getattr(plugin, name)(*args))
        return results

    def _handle(self, hook, response, *extrasrgs):
        generators = self._plugin_hook(hook, response, *extrasrgs)
        for item_or_request in itertools.chain(*generators):
            if isinstance(item_or_request, Request):
                self._plugin_hook('process_request', item_or_request, response)
            else:
                self._plugin_hook('process_item', item_or_request, response)
            if isinstance(item_or_request, Request):
                item_or_request = self._add_splash_meta(item_or_request)
            yield item_or_request

    def handle_rss(self, response):
        return self._handle('handle_rss', response, set([]))

    def handle_html(self, response):
        return self._handle('handle_html', response)

    def _build_js_url_filter(self, spec):
        if not self.js_enabled:
            return lambda x: None
        enable_patterns = spec.get('js_enable_patterns')
        disable_patterns = spec.get('js_disable_patterns')
        filterf = None
        enablef = None
        if enable_patterns:
            pattern = enable_patterns[0] if len(enable_patterns) == 1 else \
                "(?:%s)" % '|'.join(enable_patterns)
            enablef = re.compile(pattern).search
            filterf = enablef
        if disable_patterns:
            pattern = disable_patterns[0] if len(disable_patterns) == 1 else \
                "(?:%s)" % '|'.join(disable_patterns)
            disablef = re.compile(pattern).search
            if not enablef:
                filterf = lambda x: not disablef(x)
            else:
                filterf = lambda x: enablef(x) and not disablef(x)
        return filterf if filterf else lambda x: x

    def _add_splash_meta(self, request):
        if self.js_enabled and self._filter_js_urls(request.url):
            cleaned_url = urlparse(request.url)._replace(params='', query='',
                                                         fragment='').geturl()
            request.meta['splash'] = {
                'endpoint': 'render.html',
                'args': {
                    'wait': 5,
                    'images': 0,
                    'url': request.url,
                    'baseurl': cleaned_url
                }
            }
        return request
