import itertools
import operator
import re

from scrapy import log
from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse, FormRequest

from scrapely.htmlpage import HtmlPage, dict_to_page
from scrapely.extraction import InstanceBasedLearningExtractor

from loginform import fill_login_form

from slybot.item import SlybotItem, create_slybot_item_descriptor
from slybot.extractors import apply_extractors
from slybot.utils import iter_unique_scheme_hostname, htmlpage_from_response
from slybot.linkextractor import HtmlLinkExtractor, RssLinkExtractor, create_linkextractor_from_specs
from slybot.generic_form import GenericForm

def _process_extracted_data(extracted_data, item_descriptor, htmlpage):
    processed_data = []
    for exdict in extracted_data or ():
        processed_attributes = []
        for key, value in exdict.items():
            if key == "variants":
                processed_attributes.append(("variants", _process_extracted_data(value, item_descriptor, htmlpage)))
            elif not key.startswith("_sticky"):
                field_descriptor = item_descriptor.attribute_map.get(key)
                if field_descriptor:
                    value = [field_descriptor.adapt(x, htmlpage) for x in value]
                processed_attributes.append((key, value))
        processed_data.append(processed_attributes)
    return [dict(p) for p in processed_data]

class IblSpider(BaseSpider):

    def __init__(self, name, spec, item_schemas, all_extractors, **kw):
        super(IblSpider, self).__init__(name, **kw)

        self._item_template_pages = sorted((
            [t['scrapes'], dict_to_page(t, 'annotated_body'),
            t.get('extractors', [])] \
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ), key=lambda pair: pair[0])

        # generate ibl extractor for links pages
        _links_pages = [dict_to_page(t, 'annotated_body')
                for t in spec['templates'] if t.get('page_type') == 'links']
        _links_item_descriptor = create_slybot_item_descriptor({'fields': {}})
        self._links_ibl_extractor = InstanceBasedLearningExtractor([(t, _links_item_descriptor) for t in _links_pages]) \
                if _links_pages else None

        self._ipages = [page for _, page, _ in self._item_template_pages]

        self.html_link_extractor = HtmlLinkExtractor()
        self.rss_link_extractor = RssLinkExtractor()
        self.build_url_filter(spec)

        self.itemcls_info = {}
        for itemclass_name, triplets in itertools.groupby(self._item_template_pages, operator.itemgetter(0)):
            page_extractors_pairs = map(operator.itemgetter(1, 2), triplets)
            schema = item_schemas[itemclass_name]
            item_cls = SlybotItem.create_iblitem_class(schema)

            page_descriptor_pairs = []
            for page, template_extractors in page_extractors_pairs:
                item_descriptor = create_slybot_item_descriptor(schema)
                apply_extractors(item_descriptor, template_extractors, all_extractors)
                page_descriptor_pairs.append((page, item_descriptor))

            extractor = InstanceBasedLearningExtractor(page_descriptor_pairs)

            self.itemcls_info[itemclass_name] = {
                'class': item_cls,
                'descriptor': item_descriptor,
                'extractor': extractor,
            }

        self.login_requests = []
        self.form_requests = []
        self._start_requests = []
        self.generic_form = GenericForm(**kw)
        self._create_init_requests(spec.get("init_requests", []))
        self._process_start_urls(spec)
        self.allowed_domains = spec.get('allowed_domains',
                                        self._get_allowed_domains(self._ipages))
        if not self.allowed_domains:
            self.allowed_domains = None

    def _process_start_urls(self, spec):
        self.start_urls = self.start_urls or spec.get('start_urls')
        if isinstance(self.start_urls, basestring):
            self.start_urls = self.start_urls.splitlines()
        for url in self.start_urls:
            self._start_requests.append(Request(url, callback=self.parse, dont_filter=True))

    def _create_init_requests(self, spec):
        for rdata in spec:
            if rdata["type"] == "login":
                request = Request(url=rdata.pop("loginurl"), meta=rdata,
                                  callback=self.parse_login_page, dont_filter=True)
                self.login_requests.append(request)
            elif rdata["type"] == "form":
                self.form_requests.append(self.get_generic_form_start_request(rdata))
            elif rdata["type"] == "start":
                self._start_requests.append(self._create_start_request_from_specs(rdata))

    def parse_login_page(self, response):
        username = response.request.meta["username"]
        password = response.request.meta["password"]
        args, url, method = fill_login_form(response.url, response.body, username, password)
        return FormRequest(url, method=method, formdata=args, callback=self.after_login, dont_filter=True)

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
            return FormRequest(self.generic_form.get_value(field_descriptor), meta=form_descriptor,
                              callback=self.parse_field_url_page, dont_filter=True)
        else:
            return Request(url=form_descriptor.pop("form_url"), meta=form_descriptor,
                                  callback=self.parse_form_page, dont_filter=True)

    def parse_field_url_page(self, response):
        form_descriptor = response.request.meta
        field_index = form_descriptor['field_index']
        field_descriptor = form_descriptor['fields'][field_index]
        self.generic_form.set_values_url_field(field_descriptor, response.body)
        yield self.get_generic_form_start_request(form_descriptor)

    def parse_form_page(self, response):
        try:
            for (args, url, method) in self.generic_form.fill_generic_form(response.url,
                                                                           response.body,
                                                                           response.request.meta):
                yield FormRequest(url, method=method, formdata=args,
                                  callback=self.after_form_page, dont_filter=True)
        except Exception, e:
            self.log(str(e), log.WARNING)
        for req in self._start_requests:
            yield req

    def after_form_page(self, response):
        for result in self.parse(response):
            yield result

    def _get_allowed_domains(self, templates):
        urls = [x.url for x in templates]
        urls += [x.url for x in self._start_requests]
        return [x[1] for x in iter_unique_scheme_hostname(urls)]

    def _requests_to_follow(self, htmlpage):
        if self._links_ibl_extractor is not None:
            extracted = self._links_ibl_extractor.extract(htmlpage)[0]
            if extracted:
                extracted_regions = extracted[0].get('_links', [])
                seen = set()
                for region in extracted_regions:
                    htmlregion = HtmlPage(htmlpage.url, htmlpage.headers, region, encoding=htmlpage.encoding)
                    for request in self._request_to_follow_from_region(htmlregion):
                        if request.url in seen:
                            continue
                        seen.add(request.url)
                        yield request
        else:
            for request in self._request_to_follow_from_region(htmlpage):
                yield request

    def _request_to_follow_from_region(self, htmlregion):
        seen = set()
        for link in self.html_link_extractor.links_to_follow(htmlregion):
            request = self._filter_link(link, seen)
            if request is not None:
                yield request

    def _filter_link(self, link, seen):
        url = link.url
        if self.url_filterf(link):
            # filter out duplicate urls, later we should handle link text
            if url not in seen:
                seen.add(url)
                request = Request(url)
                if link.text:
                    request.meta['link_text'] = link.text
                return request

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
            self.log("Ignoring page with content-type=%r: %s" % (content_type, \
                response.url), level=log.DEBUG)
            return []

    def _process_link_regions(self, htmlpage, link_regions):
        """Process link regions if any, and generate requests"""
        if link_regions:
            for link_region in link_regions:
                htmlregion = HtmlPage(htmlpage.url, htmlpage.headers, \
                        link_region, encoding=htmlpage.encoding)
                for request in self._requests_to_follow(htmlregion):
                    yield request
        else:
            for request in self._requests_to_follow(htmlpage):
                yield request

    def handle_rss(self, response):
        seen = set()
        for link in self.rss_link_extractor.links_to_follow(response):
            request = self._filter_link(link, seen)
            if request:
                yield request

    def handle_html(self, response):
        htmlpage = htmlpage_from_response(response)
        items, link_regions = self.extract_items(htmlpage)
        for item in items:
            yield item
        for request in self._process_link_regions(htmlpage, link_regions):
            yield request

    def extract_items(self, htmlpage):
        """This method is also called from UI webservice to extract items"""
        items = []
        link_regions = []
        for item_cls_name, info in self.itemcls_info.iteritems():
            item_descriptor = info['descriptor']
            extractor = info['extractor']
            extracted, _link_regions = self._do_extract_items_from(
                    htmlpage,
                    item_descriptor,
                    extractor,
                    item_cls_name,
            )
            items.extend(extracted)
            link_regions.extend(_link_regions)
        return items, link_regions

    def _do_extract_items_from(self, htmlpage, item_descriptor, extractor, item_cls_name):
        extracted_data, template = extractor.extract(htmlpage)
        link_regions = []
        for ddict in extracted_data or []:
            link_regions.extend(ddict.pop("_links", []))
        processed_data = _process_extracted_data(extracted_data, item_descriptor, htmlpage)
        items = []
        item_cls = self.itemcls_info[item_cls_name]['class']
        for processed_attributes in processed_data:
            item = item_cls(processed_attributes)
            item['url'] = htmlpage.url
            item['_type'] = item_cls_name
            item['_template'] = str(template.id)
            items.append(item)

        return items, link_regions

    def build_url_filter(self, spec):
        """make a filter for links"""
        respect_nofollow = spec.get('respect_nofollow', True)
        patterns = spec.get('follow_patterns')
        if spec.get("links_to_follow") == "none":
            url_filterf = lambda x: False
        elif patterns:
            pattern = patterns[0] if len(patterns) == 1 else "(?:%s)" % '|'.join(patterns)
            follow_pattern = re.compile(pattern)
            if respect_nofollow:
                url_filterf = lambda x: follow_pattern.search(x.url) and not x.nofollow
            else:
                url_filterf = lambda x: follow_pattern.search(x.url)
        elif respect_nofollow:
            url_filterf = lambda x: not x.nofollow
        else:
            url_filterf = bool
        # apply exclude patterns
        exclude_patterns = spec.get('exclude_patterns')
        if exclude_patterns:
            pattern = exclude_patterns[0] if len(exclude_patterns) == 1 else "(?:%s)" % '|'.join(exclude_patterns)
            exclude_pattern = re.compile(pattern)
            self.url_filterf = lambda x: not exclude_pattern.search(x.url) and url_filterf(x)
        else:
            self.url_filterf = url_filterf

