"""
    Removes JavaScript from HTML

    This module removes all existing JavaScript in an HTML document.

"""
import re
from scrapely.htmlpage import HtmlTag, HtmlTagType
from slybot.utils import htmlpage_from_response
from slybot.baseurl import insert_base_url

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


def html4annotation(response):
    """Convert the response body for the annotation UI

    This removes scripts and adds a base url
    """
    htmlpage = htmlpage_from_response(response)
    cleaned_html = descriptify(htmlpage)
    return insert_base_url(cleaned_html, response.url)


def descriptify(htmlpage):
    """Clean JavaScript in a html source string.
    """
    doc = htmlpage.body
    newdoc = []
    inserted_comment = False
    for element in htmlpage.parsed_body:
        if isinstance(element, HtmlTag):
            if not inserted_comment and element.tag == "script" and element.tag_type == HtmlTagType.OPEN_TAG:
                newdoc.append(_AS_COMMENT_BEGIN + doc[element.start:element.end] + _AS_COMMENT_END)
                inserted_comment = True
            elif element.tag == "script" and element.tag_type == HtmlTagType.CLOSE_TAG:
                if inserted_comment:
                    inserted_comment = False
                newdoc.append(_AS_COMMENT_BEGIN + doc[element.start:element.end] + _AS_COMMENT_END)
            elif element.tag == "noscript":
                newdoc.append(_AS_COMMENT_BEGIN + doc[element.start:element.end] + _AS_COMMENT_END)
            else:
                for key, val in element.attributes.copy().items():
                    # Empty intrinsic events
                    if key in INTRINSIC_EVENT_ATTRIBUTES:
                        element.attributes[key] = ""
                    # Rewrite javascript URIs
                    elif key in URI_ATTRIBUTES and val is not None and "javascript:" in _deentitize_unicode(val):
                        element.attributes[key] = "about:blank"
                    else:
                        continue
                newdoc.append(serialize_tag(element))
        else:
            text = doc[element.start:element.end]
            if inserted_comment and text.strip() and not (text.startswith("<!--") and text.endswith("-->")):
                newdoc.append(_AS_COMMENT_BEGIN + text + _AS_COMMENT_END)
            else:
                newdoc.append(text)

    return ''.join(newdoc)


def serialize_tag(tag):
    """
    Converts a tag into a string when a slice [tag.start:tag.end]
    over the source can't be used because tag has been modified
    """
    out = "<"
    if tag.tag_type == HtmlTagType.CLOSE_TAG:
        out += "/"
    out += tag.tag

    attributes = []
    for key, val in tag.attributes.iteritems():
        aout = key
        if val is not None:
            aout += "=" + _quotify(val)
        attributes.append(aout)
    if attributes:
        out += " " + " ".join(attributes)

    if tag.tag_type == HtmlTagType.UNPAIRED_TAG:
        out += "/"
    return out + ">"


def _quotify(mystr):
    """
    quotifies an html tag attribute value.
    Assumes then, that any ocurrence of ' or " in the
    string is escaped if original string was quoted
    with it.
    So this function does not altere the original string
    except for quotation at both ends, and is limited just
    to guess if string must be quoted with '"' or "'"
    """
    quote = '"'
    l = len(mystr)
    for i in range(l):
        if mystr[i] == "\\" and i + 1 < l and mystr[i+1] == "'":
            quote = "'"
            break
        elif mystr[i] == "\\" and i + 1 < l and mystr[i+1] == '"':
            quote = '"'
            break
        elif mystr[i] == "'":
            quote = '"'
            break
        elif mystr[i] == '"':
            quote = "'"
            break
    return quote + mystr + quote
