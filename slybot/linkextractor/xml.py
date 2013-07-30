"""
Link extraction for auto scraping
"""
from scrapy.link import Link
from scrapy.selector import XmlXPathSelector

from slybot.linkextractor.base import BaseLinkExtractor

class XmlLinkExtractor(BaseLinkExtractor):
    """Link extractor for XML sources"""
    def __init__(self, xpath, **kwargs):
        super(XmlLinkExtractor, self).__init__(**kwargs)
        self.xpath = xpath

    def _extract_links(self, response):
        xxs = XmlXPathSelector(response)
        for url in xxs.select(self.xpath).extract():
            yield Link(url.encode(response.encoding))

class RssLinkExtractor(XmlLinkExtractor):
    """Link extraction from RSS feeds"""
    def __init__(self, **kwargs):
        super(RssLinkExtractor, self).__init__("//item/link/text()", **kwargs)

