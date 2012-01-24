"""
Text types
"""
from scrapely.extractors import text as extract_text, safehtml, htmlregion

def escape_html(text):
    """escape text for use in an html page"""
    # import here so jinja2 is only required when displaying html
    from jinja2.utils import escape
    return escape(text)

class _BaseTextProcessor(object):
    """basic text processor, defines identity functions, some of which 
    are overridden in subclasses
    """
    def extract(self, text):
        """Matches and extracts any string, as it is"""
        return text
    
    def adapt(self, text, htmlpage):
        return text
    
    def render(self, field_name, field_value, item):
        return escape_html(field_value)

class RawFieldTypeProcessor(_BaseTextProcessor):
    """Extracts the raw data, without processing. Data is escaped for presentation
    
    >>> r = RawFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p>')
    >>> r.extract(html)
    u'<p>test</p>'
    >>> r.adapt(html, None)
    u'<p>test</p>'
    >>> str(r.render(None, '<p>test</p>', {}))
    '&lt;p&gt;test&lt;/p&gt;'
    """
    name = 'raw html'
    description = 'raw html as it appears in the page'

class TextFieldTypeProcessor(_BaseTextProcessor):
    """Extracts strings, removing all HTML markup

    Extraction and rendering does nothing, but adapt converts html into text
    >>> p = TextFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p><!-- comment --><script> // script</script>!')
    >>> p.extract(html)
    u'<p>test</p><!-- comment --><script> // script</script>!'
    >>> p.adapt(html)
    u'test !'
    """
    name = 'text'
    description = 'extracts text from web pages, cleaning all markup'
    
    def adapt(self, text, htmlpage=None):
        """Remove html markup"""
        return extract_text(text)

class SafeHtmlFieldTypeProcessor(_BaseTextProcessor):
    """Extracts strings, with only a safe subset of HTML remaining

    Extraction and rendering does nothing, but adapt transforms the HTML
    >>> p = SafeHtmlFieldTypeProcessor()
    >>> html = htmlregion(u'<p>test</p> <blink>foo')
    >>> p.extract(html)
    u'<p>test</p> <blink>foo'
    >>> p.adapt(html)
    u'<p>test</p> foo'
    """
    name = 'safe html'
    description = 'removes all but a small subset of html tags'
    
    def adapt(self, text, htmlpage=None):
        """Remove html markup"""
        return safehtml(text)

    def render(self, field_name, field_value, item):
        return field_value
