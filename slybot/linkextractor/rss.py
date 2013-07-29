"""
Link extraction for auto scraping
"""
from scrapy.link import Link
from scrapy.selector import XmlXPathSelector

from slybot.linkextractor.base import BaseLinkExtractor

class RssLinkExtractor(BaseLinkExtractor):
    """Link extraction from RSS feeds"""

    def links_to_follow(self, response):
        xxs = XmlXPathSelector(response)
        for url in xxs.select("//item/link/text()").extract():
            yield self.normalize_link(Link(url.encode(response.encoding)))

