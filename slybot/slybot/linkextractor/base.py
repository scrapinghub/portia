"""
Link extraction for auto scraping
"""
import re
import os
import posixpath
from six.moves.urllib.parse import urlparse
from scrapy.linkextractors import IGNORED_EXTENSIONS

_ONCLICK_LINK_RE = re.compile("(?P<sep>('|\"))(?P<url>.+?)(?P=sep)")

_ignored_exts = frozenset(['.' + e for e in IGNORED_EXTENSIONS])

# allowed protocols
ALLOWED_SCHEMES = frozenset(['http', 'https', None, ''])


class BaseLinkExtractor(object):

    def __init__(self, max_url_len=2083, ignore_extensions=_ignored_exts,
                 allowed_schemes=ALLOWED_SCHEMES):
        """Creates a new LinkExtractor

        The defaults are a good guess for the first time crawl. After that, we
        expect that they can be learned.
        """
        self.max_url_len = max_url_len
        self.ignore_extensions = ignore_extensions
        self.allowed_schemes = allowed_schemes

    def _extract_links(self, source):
        raise NotImplementedError

    def links_to_follow(self, source):
        """Returns normalized extracted links"""
        for link in self._extract_links(source):
            link = self.normalize_link(link)
            if link is not None:
                yield link

    def normalize_link(self, link):
        """Normalize a link

        >>> from scrapy.link import Link
        >>> le = BaseLinkExtractor()
        >>> l = Link('http://scrapinghub.com/some/path/../dir')
        >>> le.normalize_link(l).url
        'http://scrapinghub.com/some/dir'
        >>> l = Link('http://scrapinghub.com/some//./path/')
        >>> le.normalize_link(l).url
        'http://scrapinghub.com/some/path/'

        Files with disallowed extentions or protocols are not returned
        >>> le.normalize_link(Link('myimage.jpg')) is None
        True
        >>> le.normalize_link(Link('file:///tmp/mydoc.htm')) is None
        True
        >>> le.normalize_link(Link('http://scrapinghub.com')).url
        'http://scrapinghub.com/'

        Fragments are removed
        >>> le.normalize_link(Link('http://example.com/#something')).url
        'http://example.com/'
        >>> le.normalize_link(Link('http://example.com/#something')).fragment
        'something'
        >>> le.normalize_link(Link('http://scrapinghub.com#some fragment')).url
        'http://scrapinghub.com/'

        Ajax crawling
        >>> le.normalize_link(Link('http://example.com/#!something')).url
        'http://example.com/?_escaped_fragment_=something'
        >>> le.normalize_link(Link('http://example.com/page.html?arg=1#!something')).url
        'http://example.com/page.html?arg=1&_escaped_fragment_=something'
        """
        if len(link.url) > self.max_url_len:
            return
        parsed = urlparse(link.url)
        extention = os.path.splitext(parsed.path)[1].lower()
        if parsed.scheme not in self.allowed_schemes or \
                extention in self.ignore_extensions:
            return
        # path normalization
        path = parsed.path or '/'
        path = path if path[0] != '.' else '/' + path
        path = posixpath.normpath(path)
        if parsed.path.endswith('/') and not path.endswith('/'):
            path += '/'
        if parsed.fragment.startswith('!'):
            query = '_escaped_fragment_=%s' % parsed.fragment[1:]
            query = parsed.query + '&' + query if parsed.query else query
            parsed = parsed._replace(query=query)
        link.fragment = parsed.fragment
        if path != parsed.path or parsed.fragment:
            link.url = parsed._replace(path=path, fragment='').geturl()
        return link
