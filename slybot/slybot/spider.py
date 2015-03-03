from operator import itemgetter
from copy import deepcopy

from scrapy import log
from scrapy.http import Request, HtmlResponse, FormRequest
try:
    from scrapy.spider import Spider
except ImportError:
    # BaseSpider class was deprecated in Scrapy 0.21
    from scrapy.spider import BaseSpider as Spider

from loginform import fill_login_form

from slybot.utils import iter_unique_scheme_hostname, load_plugins
from slybot.linkextractor import create_linkextractor_from_specs
from slybot.generic_form import GenericForm

STRING_KEYS = ['start_urls', 'exclude_patterns', 'follow_patterns',
               'allowed_domains']


class IblSpider(Spider):

    def __init__(self, name, spec, item_schemas, all_extractors, settings=None,
                 **kw):
        super(IblSpider, self).__init__(name, **kw)
        spec = deepcopy(spec)
        for key, val in kw.items():
            if isinstance(val, basestring) and key in STRING_KEYS:
                val = val.splitlines()
            spec[key] = val

        self._item_template_pages = sorted(
            ((t['scrapes'], t) for t in spec['templates']
             if t.get('page_type', 'item') == 'item'), key=itemgetter(0))

        self._templates = [templ for _, templ in self._item_template_pages]

        self.plugins = []
        for plugin_class in load_plugins(settings):
            instance = plugin_class()
            instance.setup_bot(settings, spec, item_schemas, all_extractors)
            self.plugins.append(instance)

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
            self._start_requests.append(Request(url, callback=self.parse,
                                                dont_filter=True))

    def _create_init_requests(self, spec):
        for rdata in spec:
            if rdata["type"] == "login":
                request = Request(url=rdata.pop("loginurl"), meta=rdata,
                                  callback=self.parse_login_page,
                                  dont_filter=True)
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
        except Exception, e:
            self.log(str(e), log.WARNING)
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
                    yield Request(url=link.url, callback=spider.parse)
            return Request(url=url, callback=_callback)
        return Request(url=url, callback=self.parse)

    def parse(self, response):
        """Main handler for all downloaded responses"""
        content_type = response.headers.get('Content-Type', '')
        if isinstance(response, HtmlResponse):
            return self.handle_html(response)
        elif "application/rss+xml" in content_type:
            return self.handle_rss(response)
        else:
            self.log("Ignoring page with content-type=%r: %s" % (content_type,
                     response.url), level=log.DEBUG)
            return []

    def handle_rss(self, response):
        seen = set()
        for plugin in self.plugins:
            for item_or_request in plugin.handle_rss(response, seen):
                yield item_or_request

    def handle_html(self, response):
        for plugin in self.plugins:
            for item_or_request in plugin.handle_html(response):
                yield item_or_request
