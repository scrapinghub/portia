import re
import urllib
from scrapy.utils.url import urljoin_rfc
from six.moves.urllib_parse import urlparse
from slybot.utils import decode, encode


CSS_IMPORT = re.compile(ur'''@import\s*["']([^"']+)["']''')
CSS_URL = re.compile(ur'''\burl\(("[^"]+"|'[^']+'|[^"')][^)]+)\)''')
BAD_CSS = re.compile(ur'(-moz-binding|expression\s*\(|javascript\s*:)', re.I)


def wrap_url(url, tabid, base=None):
    url = url.strip()
    referer = None
    if base:
        referer = urlparse(base.strip()).netloc
        url = urljoin_rfc(base, url)
    parsed = urlparse(url)
    referer = referer or parsed.netloc

    if parsed.scheme == 'data':
        return url  # TODO: process CSS inside data: urls
    if parsed.scheme not in ('http', 'https', 'ftp'):
        return 'data:text/plain,invalid_scheme'

    return "/proxy?" + urllib.urlencode({
        "url": url,
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
    css_source = encode(css_source)
    css_source = CSS_IMPORT.sub(_absolutize_css_import, css_source)
    css_source = CSS_URL.sub(_absolutize_css_url, css_source)
    css_source = BAD_CSS.sub('portia-blocked', css_source)
    return encode(css_source)
