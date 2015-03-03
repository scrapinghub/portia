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


def _process_extracted_data(extracted_data, item_descriptor, htmlpage):
    processed_data = []
    for exdict in extracted_data or ():
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
            [t['scrapes'], dict_to_page(t, 'annotated_body'),
             t.get('extractors', [])]
            for t in spec['templates'] if t.get('page_type', 'item') == 'item'
        ), key=lambda pair: pair[0])

        self.itemcls_info = {}
        self.html_link_extractor = HtmlLinkExtractor()
        self.rss_link_extractor = RssLinkExtractor()
        for itemclass_name, triplets in groupby(_item_template_pages,
                                                itemgetter(0)):
            page_extractors_pairs = map(itemgetter(1, 2), triplets)
            schema = items[itemclass_name]
            item_cls = SlybotItem.create_iblitem_class(schema)

            page_descriptor_pairs = []
            for page, template_extractors in page_extractors_pairs:
                item_descriptor = create_slybot_item_descriptor(schema)
                apply_extractors(item_descriptor, template_extractors,
                                 extractors)
                page_descriptor_pairs.append((page, item_descriptor))

            extractor = InstanceBasedLearningExtractor(page_descriptor_pairs)

            self.itemcls_info[itemclass_name] = {
                'class': item_cls,
                'descriptor': item_descriptor,
                'extractor': extractor,
            }

        # generate ibl extractor for links pages
        _links_pages = [dict_to_page(t, 'annotated_body')
                        for t in spec['templates']
                        if t.get('page_type') == 'links']
        _links_item_descriptor = create_slybot_item_descriptor({'fields': {}})
        self._links_ibl_extractor = InstanceBasedLearningExtractor(
            [(t, _links_item_descriptor) for t in _links_pages]) \
            if _links_pages else None

        self.build_url_filter(spec)

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

    def _do_extract_items_from(self, htmlpage, item_descriptor, extractor,
                               item_cls_name):
        extracted_data, template = extractor.extract(htmlpage)
        link_regions = []
        for ddict in extracted_data or []:
            link_regions.extend(ddict.pop("_links", []))
        processed_data = _process_extracted_data(extracted_data,
                                                 item_descriptor,
                                                 htmlpage)
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
