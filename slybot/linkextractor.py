"""
Link extraction for auto scraping
"""
import re, os, posixpath
from urlparse import urlparse
from scrapy.utils.markup import remove_entities
from scrapy.link import Link
from scrapy.linkextractor import IGNORED_EXTENSIONS
from scrapely.htmlpage import HtmlTag, HtmlTagType
from scrapy.utils.url import urljoin_rfc

_META_REFRESH_CONTENT_RE = re.compile("(?P<int>(\d*\.)?\d+)\s*;\s*url=(?P<url>.*)")
_ONCLICK_LINK_RE = re.compile("(?P<sep>('|\"))(?P<url>.+?)(?P=sep)")

_ignored_exts = set(['.' + e for e in IGNORED_EXTENSIONS])

# allowed protocols
ALLOWED_SCHEMES = set(['http', 'https', None, ''])

class LinkExtractor(object):
    """Link extraction for auto scraping

    Links (urls and the anchor text) are extracted from HtmlPage objects.

    Some safe normalization is done (always correct, does not make assumptions
    about how the site handles URLs). It allows some customization, which we
    expect to learn for specific websites from the crawl logs.
    """

    def __init__(self, max_url_len=2083, ignore_extensions=_ignored_exts, 
        allowed_schemes=ALLOWED_SCHEMES):
        """Creates a new LinkExtractor

        The defaults are a good guess for the first time crawl. After that, we
        expect that they can be learned.
        """
        self.max_url_len = max_url_len
        self.ignore_extensions = ignore_extensions
        self.allowed_schemes = allowed_schemes
    
    def normalize_link(self, link):
        """Normalize a link
        
        >>> le = LinkExtractor()
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

    def links_to_follow(self, htmlpage):
        """Extract links to follow from an html page

        This uses `iterlinks` to read the links in the page
        and then applies link normalization. 
        """
        for link in iterlinks(htmlpage):
            link = self.normalize_link(link)
            if link is not None:
                yield link
            
def iterlinks(htmlpage):
    """Iterate through the links in the HtmlPage passed

    For example:
    >>> from scrapely.htmlpage import HtmlPage
    >>> p = HtmlPage(body=u"Please visit <a href='http://scrapinghub.com/'>Scrapinghub</a>")
    >>> iterlinks(p).next()
    Link(url='http://scrapinghub.com/', text=u'Scrapinghub', fragment='', nofollow=False)
    >>> p = HtmlPage(body=u"Go <a href='home.html'>Home</a>")
    >>> iterlinks(p).next()
    Link(url='home.html', text=u'Home', fragment='', nofollow=False)
    
    When a url is specified, absolute urls are made:
    >>> p.url = 'http://scrapinghub.com/'
    >>> iterlinks(p).next()
    Link(url='http://scrapinghub.com/home.html', text=u'Home', fragment='', nofollow=False)

    Base href attributes in the page are respected
    >>> p.body = u"<html><head><base href='myproject/'/></head><body>see my <a href='index.html'>project</a></body>"
    >>> iterlinks(p).next()
    Link(url='http://scrapinghub.com/myproject/index.html', text=u'project', fragment='', nofollow=False)
    >>> p.body = u"<html><head><base href='http://scrape.io/myproject/'/></head><body>see my <a href='index.html'>project</a></body>"
    >>> iterlinks(p).next()
    Link(url='http://scrape.io/myproject/index.html', text=u'project', fragment='', nofollow=False)

    Frameset and iframe urls are extracted
    >>> p = HtmlPage(body=u"<html><frameset><frame src=frame1.html><frame src=frame2.html></frameset><iframe src='iframe.html'/></html>")
    >>> [l.url for l in iterlinks(p)]
    ['frame1.html', 'frame2.html', 'iframe.html']
    
    As are meta refresh tags:
    >>> p = HtmlPage(body=u"<html><head><meta http-equiv='refresh' content='5;url=http://example.com/' />")
    >>> iterlinks(p).next().url
    'http://example.com/'
    
    nofollow is set to True if the link has a rel='nofollow' attribute:
    >>> p = HtmlPage(body=u"<a href='somewhere.html' rel='nofollow'>somewhere</a>")
    >>> list(iterlinks(p))
    [Link(url='somewhere.html', text=u'somewhere', fragment='', nofollow=True)]
    
    It does not require well formed HTML and behaves similar to many browsers
    >>> p = HtmlPage(body=u"<a href='foo'>foo <a href=bar>bar</a><a href='baz'/>baz")
    >>> list(iterlinks(p))
    [Link(url='foo', text=u'foo ', fragment='', nofollow=False), Link(url='bar', text=u'bar', fragment='', nofollow=False), Link(url='baz', text=u'baz', fragment='', nofollow=False)]

    Leading and trailing whitespace should be removed, including in base href
    >>> p = HtmlPage(body=u"<head><base href=' foo/ '/></head><a href='bar '/>baz")
    >>> list(iterlinks(p))
    [Link(url='foo/bar', text=u'baz', fragment='', nofollow=False)]

    Test standard onclick links
    >>> p = HtmlPage(url="http://www.example.com", body=u"<html><td onclick=window.open('page.html?productid=23','win2') >")
    >>> list(iterlinks(p))
    [Link(url='http://www.example.com/page.html?productid=23', text=None, fragment='', nofollow=False)]

    >>> p = HtmlPage("http://www.example.com", body=u"<html><a href='#' onclick=window.open('page.html?productid=24','win2') >")
    >>> list(iterlinks(p))
    [Link(url='http://www.example.com/page.html?productid=24', text=None, fragment='', nofollow=False)]

    >>> p = HtmlPage(body=u"<html><div onclick=window.location.href='http://www.jungleberry.co.uk/Fair-Trade-Earrings/Aguas-Earrings.htm'>")
    >>> list(iterlinks(p))
    [Link(url='http://www.jungleberry.co.uk/Fair-Trade-Earrings/Aguas-Earrings.htm', text=None, fragment='', nofollow=False)]

    Onclick with no href
    >>> p = HtmlPage("http://www.example.com", body=u"<html><a onclick=window.open('page.html?productid=24','win2') >")
    >>> list(iterlinks(p))
    [Link(url='http://www.example.com/page.html?productid=24', text=None, fragment='', nofollow=False)]

    Dont generate link when target is an anchor
    >>> p = HtmlPage("http://www.example.com", body=u"<html><a href='#section1' >")
    >>> list(iterlinks(p))
    []
    """
    base_href = remove_entities(htmlpage.url, encoding=htmlpage.encoding)
    def mklink(url, anchortext=None, nofollow=False):
        url = url.strip()
        fullurl = urljoin_rfc(base_href, 
            remove_entities(url, encoding=htmlpage.encoding), htmlpage.encoding)
        return Link(fullurl, text=anchortext, nofollow=nofollow)

    # iter to quickly scan only tags
    tag_iter = (t for t in htmlpage.parsed_body if isinstance(t, HtmlTag))

    # parse body
    astart = ahref = None
    nofollow = False
    for nexttag in tag_iter:
        tagname = nexttag.tag
        attributes = nexttag.attributes
        if tagname == 'a' and (nexttag.tag_type == HtmlTagType.CLOSE_TAG or attributes.get('href') \
                    and not attributes.get('href', '').startswith('#')):
            if astart:
                yield mklink(ahref, htmlpage.body[astart:nexttag.start], nofollow)
                astart = ahref = None
                nofollow = False
            href = attributes.get('href')
            if href:
                ahref = href
                astart = nexttag.end
                nofollow = attributes.get('rel') == u'nofollow'
        elif tagname == 'head':
            # scan ahead until end of head section
            for nexttag in tag_iter:
                tagname = nexttag.tag
                if (tagname == 'head' and \
                        nexttag.tag_type == HtmlTagType.CLOSE_TAG) or \
                        tagname == 'body':
                    break
                if tagname == 'base':
                    href = nexttag.attributes.get('href')
                    if href:
                        joined_base = urljoin_rfc(htmlpage.url, href.strip(), 
                            htmlpage.encoding)
                        base_href = remove_entities(joined_base, 
                            encoding=htmlpage.encoding)
                elif tagname == 'meta':
                    attrs = nexttag.attributes
                    if attrs.get('http-equiv') == 'refresh':
                        m = _META_REFRESH_CONTENT_RE.search(attrs.get('content', ''))
                        if m:
                            target = m.group('url')
                            if target:
                                yield mklink(target)
        elif tagname == 'area':
            href = attributes.get('href')
            if href:
                nofollow = attributes.get('rel') == u'nofollow'
                yield mklink(href, attributes.get('alt', ''), nofollow)
        elif tagname in ('frame', 'iframe'):
            target = attributes.get('src')
            if target:
                yield mklink(target)
        elif 'onclick' in attributes:
            match = _ONCLICK_LINK_RE.search(attributes["onclick"] or "")
            if not match:
                continue
            target = match.group("url")
            nofollow = attributes.get('rel') == u'nofollow'
            yield mklink(target, nofollow=nofollow)

    if astart:
        yield mklink(ahref, htmlpage.body[astart:])
