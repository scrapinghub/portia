"""
html page utils
"""
import re

from six.moves.urllib.parse import urljoin

from scrapely.htmlpage import parse_html, HtmlTagType

ABSURLRE = re.compile("^https?\:\/\/")
DOCTYPERE = re.compile("<!DOCTYPE.*?>", re.S | re.I)


def _is_abs_url(url):
    return bool(ABSURLRE.match(url))


def insert_base_url(html, base):
    """
    Inserts the given base url if does not exist in html source,
    or replace the existing if needed
    """
    baseurl = baseelement = headelement = htmlelement = None
    for element in parse_html(html):
        if getattr(element, "tag", None) == "base":
            baseurl = element.attributes.get("href", None)
            baseelement = element
        elif getattr(element, "tag", None) == "head" and \
                element.tag_type == HtmlTagType.OPEN_TAG:
            headelement = element
        elif getattr(element, "tag", None) == "html" and \
                element.tag_type == HtmlTagType.OPEN_TAG:
            htmlelement = element

    if baseurl:
        if not _is_abs_url(baseurl):
            absurl = urljoin(base, baseurl)
            # replace original base tag
            basetag = '<base href="%s" />' % absurl
            html = html[:baseelement.start] + basetag + html[baseelement.end:]

    else:
        # Generate new base element and include
        basetag = '<base href="%s" />' % base
        if headelement:
            insertpos = headelement.end
        else:
            if htmlelement:
                basetag = "\n<head>%s</head>\n" % basetag
                insertpos = htmlelement.end
            else:
                doctype_match = DOCTYPERE.search(html)
                if doctype_match:
                    insertpos = doctype_match.end()
                else:
                    insertpos = 0
        html = html[:insertpos] + basetag + html[insertpos:]

    return html


def get_base_url(htmlpage):
    """Return the base url of the given HtmlPage"""
    for element in htmlpage.parsed_body:
        if getattr(element, "tag", None) == "base":
            return element.attributes.get("href") or htmlpage.url
    return htmlpage.url
