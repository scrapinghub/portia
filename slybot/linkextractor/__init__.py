"""
Link extraction for auto scraping
"""
from .base import BaseLinkExtractor, ALLOWED_SCHEMES
from .html import HtmlLinkExtractor
from .rss import RssLinkExtractor
