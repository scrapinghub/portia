"""
    Removes JavaScript from HTML

    This module removes all existing JavaScript in an HTML document.

"""
from __future__ import absolute_import
import re

from six.moves.urllib_parse import urljoin

from scrapely.htmlpage import HtmlTag, HtmlTagType, parse_html
from slybot.utils import htmlpage_from_response
from .splash.css_utils import process_css, wrap_url, unescape
from .utils import serialize_tag, add_tagids

URI_ATTRIBUTES = ("action", "background", "cite", "classid", "codebase",
                  "data", "href", "longdesc", "profile", "src", "usemap")

BLOCKED_TAGNAMES = ('script', 'noscript', 'object', 'embed')

_ALLOWED_CHARS_RE = re.compile('[^!-~]') # [!-~] = ascii printable characters
def _contains_js(url):
    return _ALLOWED_CHARS_RE.sub('', url).lower().startswith('javascript:')


def html4annotation(htmlpage, baseurl=None, proxy_resources=None):
    """Convert the given html document for the annotation UI

    This adds tags, removes scripts and optionally adds a base url
    """
    htmlpage = add_tagids(htmlpage)
    cleaned_html = descriptify(htmlpage, baseurl, proxy=proxy_resources)
    return cleaned_html


def extract_html(response):
    """Extracts an html page from the response.
    """
    return htmlpage_from_response(response).body


def descriptify(doc, base=None, proxy=None):
    """Clean JavaScript in a html source string.
    """
    parsed = parse_html(doc)
    newdoc = []
    inserted_comment = False
    for element in parsed:
        if isinstance(element, HtmlTag):
            if element.tag in BLOCKED_TAGNAMES:
                # Asumes there are no void elements in BLOCKED_TAGNAMES
                # http://www.w3.org/TR/html5/syntax.html#void-elements
                if not inserted_comment and element.tag_type in (HtmlTagType.OPEN_TAG, HtmlTagType.UNPAIRED_TAG):
                    newdoc.append('<%s>' % element.tag)
                    inserted_comment = True
                elif element.tag_type == HtmlTagType.CLOSE_TAG:
                    newdoc.append('</%s>' % element.tag)
                    inserted_comment = False
            elif element.tag == 'base':
                element.attributes = {}
                newdoc.append(serialize_tag(element))
            else:
                for key, val in element.attributes.copy().items():
                    # Empty intrinsic events
                    if key.startswith('on') or key == "http-equiv":
                        element.attributes[key] = ""
                    elif base and proxy and key == "style" and val is not None:
                        element.attributes[key] = process_css(val, -1, base)
                    elif element.tag in ('frame', 'iframe') and key == 'src':
                        element.attributes[key] = '/static/frames-not-supported.html'
                    # Rewrite javascript URIs
                    elif key in URI_ATTRIBUTES and val is not None:
                            if _contains_js(unescape(val)):
                                element.attributes[key] = "#"
                            elif base and proxy and not (element.tag == "a" and key == 'href'):
                                element.attributes[key] = wrap_url(val, -1,
                                                                   base)
                                element.attributes['_portia_%s' % key] = val
                            elif base:
                                element.attributes[key] = urljoin(base, val)
                newdoc.append(serialize_tag(element))
        else:
            text = doc[element.start:element.end]
            if inserted_comment and text.strip():
                newdoc.append('<!-- Removed by portia -->')
            else:
                newdoc.append(text)

    return ''.join(newdoc)
