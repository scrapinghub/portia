from datetime import datetime

from dateparser.date import DateDataParser
from scrapy.utils.spider import arg_to_iter

from .text import TextFieldTypeProcessor


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
    DATETIME_FMT = "%Y-%m-%d %H:%M:%S"

    name = 'date'
    description = 'Extracts date and time information from a string'

    def extract(self, htmlregion):
        return super(DateTimeFieldTypeProcessor, self).extract(htmlregion)

    def adapt(self, text, htmlpage=None):
        try:
            return DateDataParser().get_date_data(text)['date_obj']
        except ValueError:
            return

    @classmethod
    def serializer(cls, output):
        return [
            o.strftime(cls.DATETIME_FMT) if isinstance(o, datetime) else str(o)
            for o in arg_to_iter(output)
        ]
