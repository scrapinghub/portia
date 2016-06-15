import re
import urllib
import six
import six.moves.html_entities as htmlentitydefs
from six.moves.urllib_parse import urlparse, urljoin

CSS_IMPORT = re.compile(r'''@import\s*["']([^"']+)["']''')
CSS_URL = re.compile(r'''\burl\(("[^"]+"|'[^']+'|[^"')][^)]+)\)''')
BAD_CSS = re.compile(r'''(-moz-binding|expression\s*\(|javascript\s*:)''', re.I)

# https://html.spec.whatwg.org/multipage/syntax.html#character-references
# http://stackoverflow.com/questions/18689230/why-do-html-entity-names-with-dec-255-not-require-semicolon
_ENTITY_RE = re.compile("&#?\w+;", re.I)
def _replace_entity(match):
    entity = match.group(0)
    if entity[:2] == "&#":
        # character reference
        if entity[:3] == "&#x":
            return six.unichr(int(entity[3:-1], 16))
        else:
            return six.unichr(int(entity[2:-1]))
    else:
        # named entity
        try:
            return six.unichr(htmlentitydefs.name2codepoint[entity[1:-1]])
        except KeyError:
            pass
        return entity # leave as is

def unescape(mystr):
    """replaces all numeric html entities by its unicode equivalent.
    """
    return _ENTITY_RE.sub(_replace_entity, mystr)

def wrap_url(url, tabid, base=None):
    url = url.strip()
    referer = None
    if base:
        referer = urlparse(base.strip()).netloc
        try:
            url = urljoin(base, url).encode('utf-8')
        except UnicodeEncodeError:
            return 'data:text/plain,invalid_url'
    parsed = urlparse(url)
    referer = referer or parsed.netloc

    if parsed.scheme == 'data':
        return url  # TODO: process CSS inside data: urls
    if parsed.scheme not in ('http', 'https', 'ftp'):
        return 'data:text/plain,invalid_scheme'
    
    return "/proxy?" + urllib.urlencode({
        "url": unescape(url),
        "referer": referer,
        "tabid": tabid
    })


def process_css(css_source, tabid, base_uri):
    """
    Wraps urls in css source.

    >>> url = 'http://scrapinghub.com/style.css'
    >>> process_css('@import "{}"'.format(url), 0, url) # doctest: +ELLIPSIS
    '@import "/proxy?..."'
    """
    def _absolutize_css_import(match):
        return '@import "{}"'.format(wrap_url(match.group(1), tabid,
                                              base_uri).replace('"', '%22'))

    def _absolutize_css_url(match):
        url = match.group(1).strip("\"'")
        return 'url("{}")'.format(wrap_url(url, tabid,
                                           base_uri).replace('"', '%22'))

    css_source = CSS_IMPORT.sub(_absolutize_css_import, css_source)
    css_source = CSS_URL.sub(_absolutize_css_url, css_source)
    css_source = BAD_CSS.sub('portia-blocked', css_source)
    return css_source
