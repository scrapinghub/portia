"""
Numeric data extraction
"""
from scrapely.extractors import contains_any_numbers, extract_number

class NumberTypeProcessor(object):
    """NumberTypeProcessor

    Extracts a number from text

    >>> from scrapely.extractors import htmlregion
    >>> n = NumberTypeProcessor()
    >>> n.extract(htmlregion(u"there are no numbers here"))
    >>> n.extract(htmlregion(u"foo 34"))
    u'foo 34'
    >>> n.adapt(u"foo 34", None)
    u'34'

    If more than one number is present, nothing is extracted
    >>> n.adapt(u"34 48", None) is None
    True
    """
    name = 'number'
    description = 'extracts a single number in the text passed'

    def extract(self, htmlregion):
        """Only matches and extracts strings with at least one number"""
        return contains_any_numbers(htmlregion.text_content)

    def adapt(self, text, htmlpage=None):
        return extract_number(text)
