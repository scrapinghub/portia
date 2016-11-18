from __future__ import absolute_import

import itertools
import operator
import re

from collections import OrderedDict

from scrapy.http import Request
from scrapy.utils.misc import arg_to_iter

from scrapely.extraction import InstanceBasedLearningExtractor
from scrapely.htmlpage import HtmlPage, dict_to_page

from slybot.linkextractor import create_linkextractor_from_specs
from slybot.linkextractor.html import HtmlLinkExtractor
from slybot.linkextractor.xml import SitemapLinkExtractor
from slybot.linkextractor.pagination import PaginationExtractor
from slybot.item import SlybotItem, create_slybot_item_descriptor
from slybot.extractors import apply_extractors, add_extractors_to_descriptors
from slybot.utils import (htmlpage_from_response, include_exclude_filter,
                          _build_sample)
from .extraction import SlybotIBLExtractor
XML_APPLICATION_TYPE = re.compile('application/((?P<type>[a-z]+)\+)?xml').match
_CLUSTER_NA = 'not available'
_CLUSTER_OUTLIER = 'outlier'


class Annotations(object):
    """
    Base Class for adding plugins to Portia Web and Slybot.
    """

    def setup_bot(self, settings, spider, spec, items, extractors, logger):
        """
        Perform any initialization needed for crawling using this plugin
        """
        self.logger = logger
        self.spider = spider
        templates = map(self._get_annotated_template, spec['templates'])

        _item_template_pages = sorted((
            [t.get('scrapes'), dict_to_page(t, 'annotated_body'),
             t.get('extractors', []), t.get('version', '0.12.0')]
            for t in templates if t.get('page_type', 'item') == 'item'
        ), key=lambda x: x[0])
        self.item_classes = {}
        self.template_scrapes = {template.get('page_id'): template['scrapes']
                                 for template in templates}
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
        page_descriptor_pairs = []
        self.schema_descriptors = {}
        for default, template, template_extractors, v in _item_template_pages:
            descriptors = OrderedDict()
            for schema_name, schema in items.items():
                item_descriptor = create_slybot_item_descriptor(schema,
                                                                schema_name)
                apply_extractors(item_descriptor, template_extractors,
                                 extractors)
                descriptors[schema_name] = item_descriptor
            descriptor = descriptors.values() or [{}]
            descriptors['#default'] = descriptors.get(default, descriptor[0])
            self.schema_descriptors[template.page_id] = descriptors['#default']
            page_descriptor_pairs.append((template, descriptors, v))
            add_extractors_to_descriptors(descriptors, extractors)

        grouped = itertools.groupby(sorted(page_descriptor_pairs,
                                           key=operator.itemgetter(2)),
                                    lambda x: x[2] < '0.13.0')
        self.extractors = []
        for version, group in grouped:
            if version:
                self.extractors.append(
                    InstanceBasedLearningExtractor(
                        [(page, scrapes['#default'])
                         for page, scrapes, version in group]))
            else:
                self.extractors.append(SlybotIBLExtractor(list(group)))

        # generate ibl extractor for links pages
        _links_pages = [dict_to_page(t, 'annotated_body')
                        for t in templates if t.get('page_type') == 'links']
        _links_item_descriptor = create_slybot_item_descriptor({'fields': {}})
        self._links_ibl_extractor = InstanceBasedLearningExtractor(
            [(t, _links_item_descriptor) for t in _links_pages]) \
            if _links_pages else None

        self.build_url_filter(spec)
        # Clustering
        self.template_names = [t.get('page_id') for t in spec['templates']]
        if settings.get('PAGE_CLUSTERING'):
            try:
                import page_clustering
                self.clustering = page_clustering.kmeans_from_samples(spec['templates'])
                self.logger.info("Clustering activated")
            except ImportError:
                self.clustering = None
                self.logger.warning(
                    "Clustering could not be used because it is not installed")
        else:
            self.clustering = None

    def _get_annotated_template(self, template):
        if (template.get('version', '0.12.0') >= '0.13.0' and
                not template.get('annotated')):
            using_js = self.spider._filter_js_urls(template['url'])
            template['body'] = 'rendered_body' if using_js else 'original_body'
            _build_sample(template)
        return template

    def handle_html(self, response, seen=None):
        htmlpage = htmlpage_from_response(response, _add_tagids=True)
        items, link_regions = self.extract_items(htmlpage, response)
        htmlpage.headers['n_items'] = len(items)
        try:
            response.meta['n_items'] = len(items)
        except AttributeError:
            pass  # response not tied to any request
        for item in items:
            yield item
        for request in self._process_link_regions(htmlpage, link_regions):
            yield request

    def extract_items(self, htmlpage, response=None):
        """This method is also called from UI webservice to extract items"""
        for extractor in self.extractors:
            items, links = self._do_extract_items_from(htmlpage, extractor,
                                                       response)
            if items:
                return items, links
        return [], []

    def _do_extract_items_from(self, htmlpage, extractor, response=None):
        # Try to predict template to use
        template_cluster, pref_template_id = self._cluster_page(htmlpage)
        extracted, template = extractor.extract(htmlpage, pref_template_id)
        extracted = extracted or []
        link_regions = []
        for ddict in extracted:
            link_regions.extend(arg_to_iter(ddict.pop("_links", [])))
        descriptor = None
        unprocessed = False
        if template is not None and hasattr(template, 'descriptor'):
            descriptor = template.descriptor()
            if hasattr(descriptor, 'name'):
                item_cls_name = descriptor.name
            elif hasattr(descriptor, 'get'):
                item_cls_name = descriptor.get('name',
                                               descriptor.get('display_name'))
            else:
                item_cls_name = ''
        else:
            unprocessed = True
            try:
                descriptor = self.schema_descriptors[template.id]
                item_cls_name = self.template_scrapes[template.id]
            except AttributeError:
                descriptor = sorted(self.schema_descriptors.items())[0][1]
                item_cls_name = sorted(self.template_scrapes.items())[0][1]
        item_cls = self.item_classes.get(item_cls_name)
        items = []
        for processed_attributes in extracted:
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
            item[u'url'] = htmlpage.url
            item[u'_template'] = str(template.id)
            item.setdefault('_type', item_cls_name)
            if not isinstance(item, SlybotItem):
                default_meta = {'type': 'text', 'required': False,
                                'vary': False}
                item_cls = SlybotItem.create_iblitem_class(
                    {'fields': {k: default_meta for k in item}}
                )
                item = item_cls(**item)
            if self.clustering:
                item['_template_cluster'] = template_cluster
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

    def _cluster_page(self, htmlpage):
        template_cluster, preferred = _CLUSTER_NA, None
        if self.clustering:
            self.clustering.add_page(htmlpage)
            if self.clustering.is_fit:
                clt = self.clustering.classify(htmlpage)
                if clt != -1:
                    template_cluster = preferred = self.template_names[clt]
                else:
                    template_cluster = _CLUSTER_OUTLIER
        return template_cluster, preferred


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
