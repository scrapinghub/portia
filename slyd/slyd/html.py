"""
    Removes JavaScript from HTML

    This module removes all existing JavaScript in an HTML document.

"""
from __future__ import absolute_import
import re
import six

from urlparse import urljoin

from scrapely.htmlpage import HtmlTag, HtmlTagType, parse_html
from slybot.utils import htmlpage_from_response
from slybot.baseurl import insert_base_url
from .splash.css_utils import process_css, wrap_url
from .utils import serialize_tag, add_tagids

URI_ATTRIBUTES = ("action", "background", "cite", "classid", "codebase",
                  "data", "href", "longdesc", "profile", "src", "usemap")

_ALLOWED_CHARS_RE = re.compile('[^!-~]') # [!-~] = ascii printable characters
def _contains_js(url):
    return _ALLOWED_CHARS_RE.sub('', url).lower().startswith('javascript:')

try:
    from html import unescape
except ImportError:
    # https://html.spec.whatwg.org/multipage/syntax.html#character-references
    # http://stackoverflow.com/questions/18689230/why-do-html-entity-names-with-dec-255-not-require-semicolon
    _ENTITY_RE = re.compile("&#(\d+|x[a-f\d]+);?", re.I)
    def _replace_entity(match):
        entity = match.group(1)
        if entity[0].lower() == 'x':
            return six.unichr(int(entity[1:], 16))
        else:
            return six.unichr(int(entity, 10))

    def unscape(mystr):
        """replaces all numeric html entities by its unicode equivalent.
        """
        return _ENTITY_RE.sub(_replace_entity, mystr)

def html4annotation(htmlpage, baseurl=None, proxy_resources=None):
    """Convert the given html document for the annotation UI

    This adds tags, removes scripts and optionally adds a base url
    """
    htmlpage = add_tagids(htmlpage)
    cleaned_html = descriptify(htmlpage, baseurl, proxy=proxy_resources)
    if baseurl:
        cleaned_html = insert_base_url(cleaned_html, baseurl)
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
            if not inserted_comment and element.tag == "script" and element.tag_type == HtmlTagType.OPEN_TAG:
                newdoc.append('<script>')
                inserted_comment = True
            elif element.tag in ("script", "noscript") and element.tag_type == HtmlTagType.CLOSE_TAG:
                if inserted_comment:
                    inserted_comment = False
                newdoc.append('</%s>' % element.tag)
            elif element.tag == "noscript":
                newdoc.append('<noscript>')
                inserted_comment = True
            else:
                for key, val in element.attributes.copy().items():
                    # Empty intrinsic events
                    if key.startswith('on') or key == "http-equiv":
                        element.attributes[key] = ""
                    elif base and proxy and key == "style" and val is not None:
                        element.attributes[key] = process_css(val, -1, base)
                    # Rewrite javascript URIs
                    elif key in URI_ATTRIBUTES and val is not None:
                            if _contains_js(unscape(val)):
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
            if inserted_comment and text.strip() and not (text.startswith("<!--") and text.endswith("-->")):
                newdoc.append('<!-- Removed by portia -->')
            else:
                newdoc.append(text)

    return ''.join(newdoc)
