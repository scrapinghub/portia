from __future__ import absolute_import

import re

from itertools import groupby
from operator import itemgetter

from scrapy.http import Request

from scrapely.extraction import InstanceBasedLearningExtractor
from scrapely.htmlpage import HtmlPage, dict_to_page

from slybot.linkextractor import HtmlLinkExtractor, RssLinkExtractor
from slybot.item import SlybotItem, create_slybot_item_descriptor
from slybot.extractors import apply_extractors
from slybot.utils import htmlpage_from_response

from .extraction import SlybotIBLExtractor


def _process_extracted_data(extracted_data, item_descriptor, htmlpage):
    processed_data = []
    for exdict in extracted_data or ():
        # For repeated items variants, sticky attributes and field adaption
        # has already been handled
        if '_type' in exdict:
            processed_data.append(exdict)
            continue
        processed_attributes = []
        for key, value in exdict.items():
            if key == "variants":
                processed_attributes.append(
                    ("variants", _process_extracted_data(value,
                                                         item_descriptor,
                                                         htmlpage))
                )
            elif not key.startswith("_sticky"):
                field_descriptor = item_descriptor.attribute_map.get(key)
                if field_descriptor:
                    value = [field_descriptor.adapt(x, htmlpage)
                             for x in value]
                processed_attributes.append((key, value))
        processed_data.append(processed_attributes)
    return [dict(p) for p in processed_data]


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
        self.rss_link_extractor = RssLinkExtractor()
        for schema_name, schema in items.items():
            if schema_name not in self.item_classes:
                item_cls = SlybotItem.create_iblitem_class(schema)
                self.item_classes[schema_name] = item_cls

        # Create descriptors and apply additional extractors to fields
        page_descriptor_pairs = []
        for default, template, template_extractors in _item_template_pages:
            descriptors = {}
            for schema_name, schema in items.items():
                item_descriptor = create_slybot_item_descriptor(schema,
                                                                schema_name)
                apply_extractors(item_descriptor, template_extractors,
                                 extractors)
                descriptors[schema_name] = item_descriptor
            descriptors['#default'] = descriptors[default]
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
        processed_data = _process_extracted_data(extracted_data, descriptor,
                                                 htmlpage)
        items = []
        item_cls_name = descriptor.name if descriptor is not None else ''
        item_cls = self.item_classes.get(item_cls_name)
        for processed_attributes in processed_data:
            if '_type' in processed_attributes:
                _type = processed_attributes['type']
                item = self.item_classes[_type](processed_attributes)
                item['_type'] = _type
            else:
                item = item_cls(processed_attributes)
                item['_type'] = item_cls_name
            item['url'] = htmlpage.url
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
            pattern = patterns[0] if len(patterns) == 1 \
                else "(?:%s)" % '|'.join(patterns)
            follow_pattern = re.compile(pattern)
            if respect_nofollow:
                url_filterf = lambda x: follow_pattern.search(x.url) \
                    and not x.nofollow
            else:
                url_filterf = lambda x: follow_pattern.search(x.url)
        elif respect_nofollow:
            url_filterf = lambda x: not x.nofollow
        else:
            url_filterf = bool
        # apply exclude patterns
        excludes = spec.get('exclude_patterns')
        if excludes:
            pattern = excludes[0] if len(excludes) == 1 \
                else "(?:%s)" % '|'.join(excludes)
            exclude_pattern = re.compile(pattern)
            self.url_filterf = lambda x: not exclude_pattern.search(x.url) \
                and url_filterf(x)
        else:
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

    def handle_rss(self, response, seen):
        for link in self.rss_link_extractor.links_to_follow(response):
            request = self._filter_link(link, seen)
            if request:
                yield request
