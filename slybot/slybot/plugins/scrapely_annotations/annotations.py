from __future__ import absolute_import

import itertools
import operator
import re

from collections import OrderedDict

from scrapy.http import Request

from scrapely.extraction import InstanceBasedLearningExtractor
from scrapely.htmlpage import HtmlPage, dict_to_page

from slybot.linkextractor import (HtmlLinkExtractor, SitemapLinkExtractor,
                                  PaginationExtractor)
from slybot.linkextractor import create_linkextractor_from_specs
from slybot.item import SlybotItem, create_slybot_item_descriptor
from slybot.extractors import apply_extractors, add_extractors_to_descriptors
from slybot.utils import htmlpage_from_response, include_exclude_filter
XML_APPLICATION_TYPE = re.compile('application/((?P<type>[a-z]+)\+)?xml').match

from .extraction import SlybotIBLExtractor


def get_best_descriptor(descriptors, extracted_data):
    if not extracted_data:
        return None
    best_score = -1
    best_descriptor = None
    extracted_attributes = set(extracted_data.keys())
    for descriptor in descriptors:
        score = len(set(descriptor.attribute_map.keys()) &
                    extracted_attributes)
        if score > best_score:
            best_descriptor = descriptor
            best_score = score
    return best_descriptor


class Annotations(object):
    """
    Base Class for adding plugins to Portia Web and Slybot.
    """

    def setup_bot(self, settings, spec, items, extractors):
        """
        Perform any initialization needed for crawling using this plugin
        """
        _item_template_pages = sorted((
            [dict_to_page(t, 'annotated_body'),
             t.get('extractors', []), t.get('version', '0.12.0')]
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ), key=lambda x: x[0])
        self.item_classes = {}
        if (settings.get('AUTO_PAGINATION') or
                spec.get('links_to_follow') == 'auto'):
            self.html_link_extractor = PaginationExtractor()
        else:
            self.html_link_extractor = HtmlLinkExtractor()
        for schema_name, schema in items.items():
            if schema_name not in self.item_classes:
                if not schema.get('name'):
                    schema['name'] = schema_name
                item_cls = SlybotItem.create_iblitem_class(schema)
                self.item_classes[schema_name] = item_cls

        # Create descriptors and apply additional extractors to fields
        self.descriptors = []
        template_descriptors_version = []
        for template, template_extractors, v in _item_template_pages:
            schema_to_descriptors = OrderedDict()
            for schema_name, schema in items.items():
                item_descriptor = create_slybot_item_descriptor(schema,
                                                                schema_name)
                apply_extractors(item_descriptor, template_extractors,
                                 extractors)
                schema_to_descriptors[schema_name] = item_descriptor
            template_descriptors = schema_to_descriptors.values() or [{}]
            self.descriptors += template_descriptors
            schema_to_descriptors['#default'] = template_descriptors[0]
            template_descriptors_version.append((template, schema_to_descriptors, v))
            add_extractors_to_descriptors(schema_to_descriptors, extractors)

        grouped = itertools.groupby(sorted(template_descriptors_version,
                                           key=operator.itemgetter(2)),
                                    lambda x: x[2] < '0.13.0')
        self.extractors = []
        for old_version, group in grouped:
            if old_version:
                self.extractors.append(
                    InstanceBasedLearningExtractor(
                        [(template, descriptors['#default'])
                         for template, descriptors, version in group]))
            else:
                self.extractors.append(SlybotIBLExtractor(list(group)))

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
        for extractor in self.extractors:
            items, links = self._do_extract_items_from(htmlpage, extractor)
            if items:
                return items, links
        return [], []

    def _do_extract_items_from(self, htmlpage, extractor):
        extracted_data, template = extractor.extract(htmlpage)
        link_regions = []
        for ddict in extracted_data or []:
            link_regions.extend(ddict.pop("_links", []))
        if template is not None and hasattr(template, 'descriptor'):
            descriptor = template.descriptor()
            unprocessed = False
        else:
            descriptor = get_best_descriptor(self.descriptors, extracted_data)
            unprocessed = True

        if hasattr(descriptor, 'name'):
            item_cls_name = descriptor.name
        elif hasattr(descriptor, 'get'):
            item_cls_name = descriptor.get('name',
                                           descriptor.get('display_name'))
        else:
            item_cls_name = ''
            if extracted_data is not None:
                import pdb; pdb.set_trace()
        item_cls = self.item_classes.get(item_cls_name)
        items = []
        for processed_attributes in extracted_data or []:
            if processed_attributes.get('_type') in self.item_classes:
                _type = processed_attributes['_type']
                item = self.item_classes[_type](processed_attributes)
                item['_type'] = item.display_name()
            elif unprocessed:
                item = self._process_attributes(processed_attributes,
                                                descriptor, htmlpage)
                if item_cls:
                    item = item_cls(item)
            elif item_cls:
                item = item_cls(processed_attributes)
            else:
                item = dict(processed_attributes)
            item['url'] = htmlpage.url
            item['_template'] = str(template.id)
            item.setdefault('_type', item_cls_name)
            if not isinstance(item, SlybotItem):
                default_meta = {'type': 'text', 'required': False,
                                'vary': False}
                item_cls = SlybotItem.create_iblitem_class(
                    {'fields': {k: default_meta for k in item}}
                )
                item = item_cls(**item)
            items.append(item)

        return items, link_regions

    def _process_attributes(self, item, descriptor, htmlpage):
        new_item = {}
        try:
            attr_map = descriptor.attribute_map
        except AttributeError:
            attr_map = {}
        page = getattr(htmlpage, 'htmlpage', htmlpage)
        for field, value in item.items():
            if field.startswith('_sticky'):
                continue
            if field == 'variants':
                value = [self._process_attributes(v, descriptor, page)
                         for v in value]
            elif field in attr_map:
                value = [attr_map[field].adapt(v, page) for v in value]
            new_item[field] = value
        return new_item

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
