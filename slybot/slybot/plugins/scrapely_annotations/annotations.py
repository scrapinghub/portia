from __future__ import absolute_import

import re

from collections import OrderedDict

from scrapy.http import Request

from scrapely.extraction import InstanceBasedLearningExtractor
from scrapely.htmlpage import HtmlPage, dict_to_page

from slybot.linkextractor import (HtmlLinkExtractor, SitemapLinkExtractor,
                                  PaginationExtractor)
from slybot.linkextractor import create_linkextractor_from_specs
from slybot.item import SlybotItem, create_slybot_item_descriptor
from slybot.extractors import apply_extractors
from slybot.utils import htmlpage_from_response, include_exclude_filter
XML_APPLICATION_TYPE = re.compile('application/((?P<type>[a-z]+)\+)?xml').match

from .extraction import SlybotIBLExtractor


class Annotations(object):
    """
    Base Class for adding plugins to Portia Web and Slybot.
    """

    def setup_bot(self, settings, spec, items, extractors):
        """
        Perform any initialization needed for crawling using this plugin
        """
        _item_template_pages = sorted((
            [t.get('scrapes'), dict_to_page(t, 'annotated_body'),
             t.get('extractors', [])]
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ))
        self.item_classes = {}
        self.html_link_extractor = HtmlLinkExtractor()
        for schema_name, schema in items.items():
            if schema_name not in self.item_classes:
                if not schema.get('name'):
                    schema['name'] = schema_name
                item_cls = SlybotItem.create_iblitem_class(schema)
                self.item_classes[schema_name] = item_cls

        # Create descriptors and apply additional extractors to fields
        page_descriptor_pairs = []
        for default, template, template_extractors in _item_template_pages:
            descriptors = OrderedDict()
            for schema_name, schema in items.items():
                item_descriptor = create_slybot_item_descriptor(schema,
                                                                schema_name)
                apply_extractors(item_descriptor, template_extractors,
                                 extractors)
                descriptors[schema_name] = item_descriptor
            descriptor = descriptors.values() or [{}]
            descriptors['#default'] = descriptors.get(default, descriptor[0])
            page_descriptor_pairs.append((template, descriptors))

        self.extractors = SlybotIBLExtractor(page_descriptor_pairs)

        # generate ibl extractor for links pages
        _links_pages = [dict_to_page(t, 'annotated_body')
                        for t in spec['templates']
                        if t.get('page_type') == 'links']
        _links_item_descriptor = create_slybot_item_descriptor({'fields': {}})
        self._links_ibl_extractor = InstanceBasedLearningExtractor(
            [(t, _links_item_descriptor) for t in _links_pages]) \
            if _links_pages else None

        self.build_url_filter(spec)

    def handle_html(self, response, seen=None):
        htmlpage = htmlpage_from_response(response)
        items, link_regions = self.extract_items(htmlpage)
        htmlpage.headers['n_items'] = len(items)
        try:
            response.meta['n_items'] = len(items)
        except AttributeError:
            pass # response not tied to any request
        for item in items:
            yield item
        for request in self._process_link_regions(htmlpage, link_regions):
            yield request

    def extract_items(self, htmlpage):
        """This method is also called from UI webservice to extract items"""
        return self._do_extract_items_from(htmlpage, self.extractors)

    def _do_extract_items_from(self, htmlpage, extractor):
        extracted_data, template = extractor.extract(htmlpage)
        link_regions = []
        for ddict in extracted_data or []:
            link_regions.extend(ddict.pop("_links", []))
        descriptor = template.descriptor() if template is not None else None
        items = []
        item_cls_name = descriptor.name if descriptor is not None else ''
        item_cls = self.item_classes.get(item_cls_name)
        for processed_attributes in extracted_data or []:
            if processed_attributes.get('_type') in self.item_classes:
                _type = processed_attributes['_type']
                item = self.item_classes[_type](processed_attributes)
                item['_type'] = item.display_name()
            elif item_cls:
                item = item_cls(processed_attributes)
                item['_type'] = item_cls_name
            else:
                item = dict(processed_attributes)
            item['url'] = htmlpage.url
            item['_template'] = str(template.id)
            items.append(item)

        return items, link_regions

    def build_url_filter(self, spec):
        """make a filter for links"""
        respect_nofollow = spec.get('respect_nofollow', True)

        if spec.get("links_to_follow") == "none":
            url_filterf = lambda x: False
        elif spec.get("links_to_follow") == "all":
            if respect_nofollow:
                url_filterf = lambda x: x.nofollow
            else:
                url_filterf = lambda x: True
        else: # patterns
            patterns = spec.get('follow_patterns')
            excludes = spec.get('exclude_patterns')
            pattern_fn = include_exclude_filter(patterns, excludes)

            if respect_nofollow:
                url_filterf = lambda x: not x.nofollow and pattern_fn(x.url)
            else:
                url_filterf = lambda x: pattern_fn(x.url)

        self.url_filterf = url_filterf


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

    def _process_link_regions(self, htmlpage, link_regions):
        """Process link regions if any, and generate requests"""
        if link_regions:
            for link_region in link_regions:
                htmlregion = HtmlPage(htmlpage.url, htmlpage.headers,
                                      link_region, encoding=htmlpage.encoding)
                for request in self._requests_to_follow(htmlregion):
                    yield request
        else:
            for request in self._requests_to_follow(htmlpage):
                yield request

    def _requests_to_follow(self, htmlpage):
        if self._links_ibl_extractor is not None:
            extracted = self._links_ibl_extractor.extract(htmlpage)[0]
            if extracted:
                extracted_regions = extracted[0].get('_links', [])
                seen = set()
                for region in extracted_regions:
                    htmlregion = HtmlPage(htmlpage.url, htmlpage.headers,
                                          region, encoding=htmlpage.encoding)
                    for request in self._request_to_follow_from_region(
                            htmlregion):
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

    def handle_xml(self, response, seen):
        _type = XML_APPLICATION_TYPE(response.headers.get('Content-Type', ''))
        _type = _type.groupdict()['type'] if _type else 'xml'
        try:
            link_extractor = create_linkextractor_from_specs({
                'type': _type, 'value': ''
            })
        except ValueError:
            link_extractor = SitemapLinkExtractor()
        for link in link_extractor.links_to_follow(response):
            request = self._filter_link(link, seen)
            if request:
                yield request
