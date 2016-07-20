"""
html page utils
"""
from __future__ import absolute_import

from scrapely.htmlpage import HtmlPage, HtmlTag, HtmlTagType


TAGID = u"data-tagid"
GENERATEDTAGID = u"data-genid"
OPEN_TAG = HtmlTagType.OPEN_TAG
CLOSE_TAG = HtmlTagType.CLOSE_TAG
UNPAIRED_TAG = HtmlTagType.UNPAIRED_TAG


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
        if mystr[i] == "\\" and i + 1 < l and mystr[i + 1] == "'":
            quote = "'"
            break
        elif mystr[i] == "\\" and i + 1 < l and mystr[i + 1] == '"':
            quote = '"'
            break
        elif mystr[i] == "'":
            quote = '"'
            break
        elif mystr[i] == '"':
            quote = "'"
            break
    return quote + mystr + quote


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
    for key, val in tag.attributes.items():
        aout = key
        if val is not None:
            aout += "=" + _quotify(val)
        attributes.append(aout)
    if attributes:
        out += " " + " ".join(attributes)

    if tag.tag_type == HtmlTagType.UNPAIRED_TAG:
        out += "/"
    return out + ">"


def _must_add_tagid(element):
    return (isinstance(element, HtmlTag) and
            element.tag_type != CLOSE_TAG and
            element.tag != 'ins')


def _modify_tagids(source, add=True):
    """Add or remove tags ids to/from HTML document"""
    output = []
    tagcount = 0
    if not isinstance(source, HtmlPage):
        source = HtmlPage(body=source)
    for element in source.parsed_body:
        if _must_add_tagid(element):
            if add:
                element.attributes[TAGID] = str(tagcount)
                tagcount += 1
            else:  # Remove previously added tagid
                element.attributes.pop(TAGID, None)
            output.append(serialize_tag(element))
        else:
            output.append(source.body[element.start:element.end])
    return ''.join(output)


def add_tagids(source):
    """
    Applies a unique attribute code number for each tag element in order to be
    identified later in the process of apply annotation"""
    return _modify_tagids(source)


def remove_tagids(source):
    """remove from the given page, all tagids previously added by add_tagids()
    """
    return _modify_tagids(source, False)
