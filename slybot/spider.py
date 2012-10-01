import itertools
import operator
import re

from scrapy import log
from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse, FormRequest
from scrapely.htmlpage import HtmlPage, dict_to_page
from scrapely.extraction import InstanceBasedLearningExtractor

from slybot.item import get_iblitem_class, create_slybot_item_descriptor
from slybot.extractors import apply_extractors
from slybot.utils import iter_unique_scheme_hostname
from slybot.linkextractor import LinkExtractor

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
    return processed_data

class IblSpider(BaseSpider):

    def __init__(self, name, spec, item_schemas, all_extractors, **kw):
        super(IblSpider, self).__init__(name, **kw)
        default_item = spec['scrapes']
        self._default_schema = item_schemas[default_item]
        if not self._default_schema:
            self.log("Scraping unknown default item schema: %s" % default_item, \
                log.WARNING)
        
        self._item_template_pages = sorted((
            [t.get('scrapes', default_item), dict_to_page(t, 'annotated_body'), 
            t.get('extractors', [])] \
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ), key=lambda pair: pair[0])

        # generate ibl extractor for links pages
        _links_pages = [dict_to_page(t, 'annotated_body')
                for t in spec['templates'] if t.get('page_type') == 'links']
        _links_item_descriptor = create_slybot_item_descriptor({'id': "_links", 'properties': ()})
        self._links_ibl_extractor = InstanceBasedLearningExtractor([(t, _links_item_descriptor) for t in _links_pages]) \
                if _links_pages else None

        self._ipages = [page for _, page, _ in self._item_template_pages]
        self._fpages = [
            dict_to_page(t, 'annotated_body')
            for t in spec['templates'] if t.get('page_type', 'item') == 'form'
        ]
        
        self.start_urls = self.start_urls or spec.get('start_urls')
        if isinstance(self.start_urls, basestring):
            self.start_urls = self.start_urls.splitlines()

        self.link_extractor = LinkExtractor()
        self.allowed_domains = self._get_allowed_domains(self._ipages)
        
        self.build_url_filter(spec)

        default_item_cls = get_iblitem_class(self._default_schema)
        default_item_descriptor = create_slybot_item_descriptor(self._default_schema)

        self.itemcls_info = {}
        for itemclass_name, triplets in itertools.groupby(self._item_template_pages, operator.itemgetter(0)):
            page_extractors_pairs = map(operator.itemgetter(1, 2), triplets)
            schema = item_schemas[itemclass_name]
            item_cls = get_iblitem_class(schema) if schema else default_item_cls

            page_descriptor_pairs = []
            for page, extractors in page_extractors_pairs:
                item_descriptor = create_slybot_item_descriptor(schema) if schema else default_item_descriptor
                apply_extractors(item_descriptor, extractors, all_extractors)
                page_descriptor_pairs.append((page, item_descriptor))

            extractor = InstanceBasedLearningExtractor(page_descriptor_pairs)

            self.itemcls_info[itemclass_name] = {
                'class': item_cls,
                'descriptor': item_descriptor,
                'extractor': extractor,
            }

    def _get_allowed_domains(self, templates):
        urls = [x.url for x in templates]
        urls += self.start_urls
        return [x[1] for x in iter_unique_scheme_hostname(urls)]

    def _get_form_requests(self, templates):
        reqs = []
        # TODO: filter unique schema netlocs?
        for t in templates:
            # assume all templates are html and unicode
            response = HtmlResponse(t.url, encoding='utf-8',
                                    body=t.body, headers=t.headers)
            request = FormRequest.from_response(response,
                                                formname='SLYBOT-FORM',
                                                callback=self.parse,
                                                dont_filter=True)
            reqs.append(request)
        return reqs

    def _requests_to_follow(self, htmlpage):
        requests = []
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
                        requests.append(request)
        else:
            requests = self._request_to_follow_from_region(htmlpage)

        return requests
            
    def _request_to_follow_from_region(self, htmlregion):
        requests = []
        seen = set()

        for link in self.link_extractor.links_to_follow(htmlregion):
            url = link.url
            if self.url_filterf(link):
                # filter out duplicate urls, later we should handle link text
                if url in seen:
                    continue
                seen.add(url)
                request = Request(url)
                if link.text:
                    request.meta['link_text'] = link.text
                requests.append(request)
        return requests

    def start_requests(self):
        if self._fpages:
            return self._get_form_requests(self._fpages)
        return [Request(r, callback=self.parse, dont_filter=True) \
            for r in self.start_urls]

    def parse(self, response):
        """Main handler for all downloaded responses"""
        if isinstance(response, HtmlResponse):
            return self.handle_html(response)
        else:
            content_type = response.headers.get('Content-Type')
            self.log("Ignoring page with content-type=%r: %s" % (content_type, \
                response.url), level=log.DEBUG)

    def _process_link_regions(self, htmlpage, link_regions):
        """Process link regions if any, and generate requests"""
        requests_to_follow = []
        if link_regions:
            for link_region in link_regions:
                htmlregion = HtmlPage(htmlpage.url, htmlpage.headers, \
                        link_region, encoding=htmlpage.encoding)
                requests_to_follow.extend(self._requests_to_follow(htmlregion))
        else:
            requests_to_follow = self._requests_to_follow(htmlpage)
        return requests_to_follow

    def handle_html(self, response):
        htmlpage = HtmlPage(response.url, response.headers, \
                    response.body_as_unicode(), encoding=response.encoding)
        items, link_regions = self.extract_items(htmlpage)
        requests_to_follow = self._process_link_regions(htmlpage, link_regions)
        return requests_to_follow + items
        
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

