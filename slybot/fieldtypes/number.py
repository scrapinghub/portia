"""
Numeric data extraction
"""

from scrapely import extractors

class NumberTypeProcessor(object):
    """NumberTypeProcessor

    Extracts a number from text

    >>> n = NumberTypeProcessor()
    >>> n.extract(u"there are no numbers here")
    >>> n.extract(u"foo 34")
    u'foo 34'
    >>> n.adapt(u"foo 34", None)
    u'34'

    If more than one number is present, nothing is extracted
    >>> n.adapt(u"34 48", None) is None
    True
    """
    name = 'number'
    description = 'extracts a single number in the text passed'
    
    def extract(self, text):
        """Only matches and extracts strings with at least one number"""
        return extractors.contains_any_numbers(text)
        
    def adapt(self, text, htmlpage):
        return extractors.extract_number(text)

    def render(self, field_name, field_value, item):
        return field_value
