"""
html page utils
"""
from scrapely.htmlpage import HtmlTagType


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
