"""
Link extraction for auto scraping
"""
import six
from scrapy.link import Link
from scrapy.selector import Selector

from slybot.linkextractor.base import BaseLinkExtractor
RSS_XPATH = "//item/link/text()"
SITEMAP_XPATH = "//urlset/url/loc/text()|//sitemapindex/sitemap/loc/text()"
ATOM_XPATH = "//link/@href"


class XmlLinkExtractor(BaseLinkExtractor):
    """Link extractor for XML sources"""
    def __init__(self, xpath=None, **kwargs):
        if not xpath:
            xpath = '|'.join((RSS_XPATH, SITEMAP_XPATH, ATOM_XPATH))
            self.remove_namespaces = True
        else:
            self.remove_namespaces = kwargs.pop('remove_namespaces', False)
        super(XmlLinkExtractor, self).__init__(**kwargs)
        self.xpath = xpath

    def _extract_links(self, response):
        body = response.body_as_unicode()
        _type = 'html'
        if body.lstrip().startswith('<?xml version='):
            _type = 'xml'
        xxs = Selector(text=body, type=_type)
        if self.remove_namespaces:
            xxs.remove_namespaces()
        for url in xxs.xpath(self.xpath).extract():
            if not isinstance(url, six.text_type):
                url = url.encode(response.encoding)
            yield Link(url)


class RssLinkExtractor(XmlLinkExtractor):
    """Link extraction from RSS feeds"""
    def __init__(self, **kwargs):
        super(RssLinkExtractor, self).__init__(RSS_XPATH, **kwargs)


class SitemapLinkExtractor(XmlLinkExtractor):
    """Link extraction for sitemap.xml feeds"""
    def __init__(self, **kwargs):
        kwargs['remove_namespaces'] = True
        super(SitemapLinkExtractor, self).__init__(SITEMAP_XPATH, **kwargs)


class AtomLinkExtractor(XmlLinkExtractor):
    def __init__(self, **kwargs):
        kwargs['remove_namespaces'] = True
        super(AtomLinkExtractor, self).__init__(ATOM_XPATH, **kwargs)
