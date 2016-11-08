"""
Text types
"""
import re
from scrapely.extractors import text as extract_text, safehtml
from w3lib.html import remove_tags
_REMOVE_TAGID = re.compile(' data-tagid="\d+"').sub


class _BaseTextProcessor(object):
    """basic text processor, defines identity functions, some of which
    are overridden in subclasses
    """
    def extract(self, text):
        """Matches and extracts any string, as it is"""
        return _REMOVE_TAGID('', text)

    def adapt(self, text, htmlpage=None):
        return text


class RawFieldTypeProcessor(_BaseTextProcessor):
    """Extracts the raw data, without processing. Data is escaped for presentation

    >>> from scrapely.extractors import htmlregion
    >>> r = RawFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p>')
    >>> r.extract(html)
    u'<p>test</p>'
    >>> r.adapt(html, None)
    u'<p>test</p>'
    """
    name = 'raw html'
    description = 'raw html as it appears in the page'


class TextFieldTypeProcessor(_BaseTextProcessor):
    """Extracts strings, removing all HTML markup

    >>> from scrapely.extractors import htmlregion
    >>> p = TextFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p><!-- comment --><script> // script</script>!')
    >>> extracted = p.extract(html)
    >>> extracted
    u'test !'
    >>> p.adapt(extracted, None)
    u'test !'
    >>> html = htmlregion(u'<p>&nbsp;\\n<p>')
    >>> p.extract(html)
    u''
    """
    name = 'text'
    description = 'extracts text from web pages, cleaning all markup'

    def extract(self, htmlregion):
        text = getattr(htmlregion, 'text_content', htmlregion)
        return remove_tags(extract_text(text)).strip()


class SafeHtmlFieldTypeProcessor(_BaseTextProcessor):
    """Extracts strings, with only a safe subset of HTML remaining

    Extraction checks for presence of text content, and adapt transforms the HTML
    >>> from scrapely.extractors import htmlregion
    >>> p = SafeHtmlFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p> <blink>foo')
    >>> p.extract(html)
    u'<p>test</p> <blink>foo'
    >>> p.adapt(html)
    u'<p>test</p> foo'
    >>> html = htmlregion(u'<p><a href="#">value</a><script>asdf</script>')
    >>> p.extract(html)
    u'<p><a href="#">value</a><script>asdf</script>'
    >>> p.adapt(html)
    u'<p>value</p>'

    html without text must not be extracted
    >>> html = htmlregion(u'<br/>')

    """
    name = 'safe html'
    description = 'removes all but a small subset of html tags'

    def extract(self, htmlregion):
        if extract_text(htmlregion.text_content):
            return htmlregion

    def adapt(self, text, htmlpage=None):
        """Remove html markup"""
        return safehtml(text)
