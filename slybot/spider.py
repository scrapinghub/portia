import itertools
import operator
import re

from scrapy import log
from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse, FormRequest
from scrapely.htmlpage import HtmlPage, dict_to_page
from scrapely.extraction import InstanceBasedLearningExtractor

from slybot.item import get_iblitem_class, create_slybot_item_descriptor, \
    create_item_version, apply_extractors
from slybot.utils import iter_unique_scheme_netloc
from slybot.linkextractor import LinkExtractor

class SlybotSpider(BaseSpider):

    def __init__(self, name, spec, items, extractors, **kw):
        super(SlybotSpider, self).__init__(name, **kw)
        self.items = items
        self.extractors = extractors
        default_item = spec['scrapes']
        self._default_schema = self.items[default_item]
        if not self._default_schema:
            self.log("Scraping unknown default item schema: %s" % default_item, \
                log.WARNING)
        
        self._item_template_pages = sorted((
            [t.get('scrapes', default_item), dict_to_page(t, 'annotated_body'), 
            t.get('extractors', [])] \
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ), key=lambda pair: pair[0])
        self._ipages = [page for _, page, _ in self._item_template_pages]
        self._fpages = [
            dict_to_page(t, 'annotated_body')
            for t in spec['templates'] if t.get('page_type', 'item') == 'form'
        ]
        
        self._start_urls = spec.get('start_urls')

        self.link_extractor = LinkExtractor()
        self.allowed_domains = self._get_allowed_domains(self._ipages)
        
        # make a filter for links 
        respect_nofollow = spec.get('respect_nofollow', True)
        patterns = spec.get('follow_patterns')
        if patterns:
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

    def _get_allowed_domains(self, templates):
        urls = [x.url for x in templates]
        urls += self._start_urls
        return [x[1] for x in iter_unique_scheme_netloc(urls)]

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

    def _get_item_requests(self, templates):
        reqs = []
        urls = [x.url for x in templates]
        for scheme, netloc in iter_unique_scheme_netloc(urls):
            r = Request("%s://%s/" % (scheme, netloc), callback=self.parse, \
                dont_filter=True)
            reqs.append(r)
        return reqs
    
    def _requests_to_follow(self, htmlpage):
        requests = []
        seen = set()
        for link in self.link_extractor.links_to_follow(htmlpage):
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

    def _htmlpage_from_response(self, response):
        return HtmlPage(response.url, response.headers, response.body_as_unicode(), \
            encoding=response.encoding)

    def start_requests(self):
        if self._start_urls:
            return [Request(r, callback=self.parse, dont_filter=True) \
                for r in self._start_urls]
        if self._fpages:
            return self._get_form_requests(self._fpages)
        return self._get_item_requests(self._ipages)

    def parse(self, response):
        """Main handler for all downloaded responses"""
        if isinstance(response, HtmlResponse):
            return self.handle_html(response)
        else:
            content_type = response.headers.get('Content-Type')
            self.log("Ignoring page with content-type=%r: %s" % (content_type, \
                response.url), level=log.DEBUG)

    def handle_html(self, response):
        raise NotImplementedError

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

class IblSpider(SlybotSpider):

    def __init__(self, name, spec, items, extractors, **kw):
        super(IblSpider, self).__init__(name, spec, items, extractors, **kw)

        default_item_cls = get_iblitem_class(self._default_schema)
        default_item_descriptor = create_slybot_item_descriptor(self._default_schema)

        self.itemcls_info = {}
        for itemclass_name, triplets in itertools.groupby(self._item_template_pages, operator.itemgetter(0)):
            page_extractors_pairs = map(operator.itemgetter(1, 2), triplets)
            schema = self.items[itemclass_name]
            item_cls = get_iblitem_class(schema) if schema else default_item_cls

            page_descriptor_pairs = []
            for page, extractors in page_extractors_pairs:
                item_descriptor = create_slybot_item_descriptor(schema) if schema else default_item_descriptor
                apply_extractors(item_descriptor, extractors, self.extractors)
                page_descriptor_pairs.append((page, item_descriptor))

            extractor = InstanceBasedLearningExtractor(page_descriptor_pairs)

            self.itemcls_info[itemclass_name] = {
                'class': item_cls,
                'descriptor': item_descriptor,
                'extractor': extractor,
            }

        self._itemversion_cache = {}

    def handle_html(self, response):
        htmlpage = self._htmlpage_from_response(response)
        return self._requests_to_follow(htmlpage) + self.extract_items(htmlpage)[0]
        
    def extract_items(self, htmlpage):
        """This method is also called from UI webservice to extract items"""
        items = []
        template_ids = []
        for item_cls_name, info in self.itemcls_info.iteritems():
            item_cls = info['class']
            item_descriptor = info['descriptor']
            extractor = info['extractor']
            extracted, template_id = self._do_extract_items_from(
                    htmlpage,
                    item_cls,
                    item_descriptor,
                    extractor,
                    item_cls_name,
            )
            items.extend(extracted)
            if template_id:
                template_ids.append(template_id)
        return items, template_ids

    def _do_extract_items_from(self, htmlpage, item_cls, item_descriptor, extractor, item_cls_name):
        extracted_data, template = extractor.extract(htmlpage)
        processed_data = _process_extracted_data(extracted_data, item_descriptor, htmlpage)
        items = []
        for processed_attributes in processed_data:
            item = item_cls(processed_attributes)
            item['url'] = htmlpage.url
            item['_type'] = item_cls_name
            if self._check_not_dupe(item_cls, item):
                items.append(item)

        return items, template.id if template else None

    def _check_not_dupe(self, item_cls, item):
        """Checks whether a scrapy item is a dupe, based on version (not vary)
        fields of the item class"""
        if not item_cls.version_fields:
            return True
        
        version = create_item_version(item_cls, item)
        if version in self._itemversion_cache:
            old_url = self._itemversion_cache[version]
            self.log("Duplicate product scraped at <%s>, first one was scraped at <%s>" % (item["url"], old_url),
                    log.WARNING)
            return False
        self._itemversion_cache[version] = item["url"]
        return True
