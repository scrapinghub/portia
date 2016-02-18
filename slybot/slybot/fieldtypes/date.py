from .text import TextFieldTypeProcessor
from dateparser.date import DateDataParser


class DateTimeFieldTypeProcessor(TextFieldTypeProcessor):
    """
    Extracts a date from text

    >>> from scrapely.extractors import htmlregion
    >>> d = DateTimeFieldTypeProcessor()
    >>> d.extract(htmlregion(u"  Jan 12, 2014 11:15AM  <br>"))
    u'Jan 12, 2014 11:15AM'
    >>> d.adapt(u"Jan 12, 2014 11:15AM", None).strftime('%Y-%m-%dT%H:%M:%S')
    '2014-01-12T11:15:00'
    >>> d.adapt(u'no date here', None)
    """

    name = 'date'
    description = 'Extracts date and time information from a string'

    def extract(self, htmlregion):
        return super(DateTimeFieldTypeProcessor, self).extract(htmlregion)

    def adapt(self, text, htmlpage=None):
        try:
            return DateDataParser().get_date_data(text)['date_obj']
        except ValueError:
            return
