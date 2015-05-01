"""
    Removes JavaScript from HTML

    This module removes all existing JavaScript in an HTML document.

"""
import re

from urlparse import urljoin

from scrapely.htmlpage import HtmlTag, HtmlTagType, parse_html
from slybot.utils import htmlpage_from_response
from slybot.baseurl import insert_base_url
from .utils import serialize_tag, add_tagids

### Known weaknesses
#     Doesn't deal with JS hidden in CSS
#     Doesn't deal with meta redirect javascript URIs

INTRINSIC_EVENT_ATTRIBUTES = ("onload", "onunload", "onclick", "ondblclick",
                              "onmousedown", "onmouseup", "onmouseover",
                              "onmousemove", "onmouseout", "onfocus",
                              "onblur", "onkeypress", "onkeydown",
                              "onkeyup", "onsubmit", "onreset", "onselect",
                              "onchange", "onerror", "onbeforeunload")

URI_ATTRIBUTES = ("action", "background", "cite", "classid", "codebase",
                  "data", "href", "longdesc", "profile", "src", "usemap")

AS_SCRIPT_REGION_BEGIN = "<!-- begin region added by slyd-->"
AS_SCRIPT_REGION_END = "<!-- end region added by slyd-->"

_AS_COMMENT_BEGIN = "<!-- begin_ascomment:"
_AS_COMMENT_END = ":end_ascomment -->"
_ENTITY_RE = re.compile("&#(\d+);")


def _deentitize_unicode(mystr):
    """replaces all entities in the form &#\d+; by its
    unicode equivalent.
    """
    return _ENTITY_RE.sub(lambda m: unichr(int(m.groups()[0])), mystr)


def html4annotation(htmlpage, baseurl=None):
    """Convert the given html document for the annotation UI

    This adds tags, removes scripts and optionally adds a base url
    """
    htmlpage = add_tagids(htmlpage)
    cleaned_html = descriptify(htmlpage)
    if baseurl:
        cleaned_html = insert_base_url(cleaned_html, baseurl)
    return cleaned_html


def extract_html(response):
    """Extracts an html page from the response.
    """
    return htmlpage_from_response(response).body


def descriptify(doc, base=None):
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
                    if key in INTRINSIC_EVENT_ATTRIBUTES:
                        element.attributes[key] = ""
                    # Rewrite javascript URIs
                    elif key in URI_ATTRIBUTES and val is not None:
                            if "javascript:" in _deentitize_unicode(val):
                                element.attributes[key] = "about:blank"
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
