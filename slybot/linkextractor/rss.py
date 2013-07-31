"""
Link extraction for auto scraping
"""
from scrapy.link import Link
from scrapy.selector import XmlXPathSelector

from slybot.linkextractor.base import BaseLinkExtractor

class RssLinkExtractor(BaseLinkExtractor):
    """Link extraction from RSS feeds"""

    def _extract_links(self, response):
        xxs = XmlXPathSelector(response)
        for url in xxs.select("//item/link/text()").extract():
            yield Link(url.encode(response.encoding))

