import csv
print csv
from cStringIO import StringIO

from scrapy.link import Link

from .base import BaseLinkExtractor

_FORMAT_PARAMETERS = (
    ('delimiter', ','),
    ('quotechar', '"'),
)

class CsvLinkExtractor(BaseLinkExtractor):
    def __init__(self, column=0, **kwargs):
        self.fmtparams = dict((key, kwargs.pop(key, default)) for key, default in _FORMAT_PARAMETERS)
        super(CsvLinkExtractor, self).__init__(**kwargs)
        self.allowed_schemes = filter(lambda x: x and isinstance(x, basestring), self.allowed_schemes)
        self.column = column

    def _extract_links(self, response):
        """First extract regex groups(). If empty, extracts from regex group()"""
        buff = StringIO(response.body)
        reader = csv.reader(buff, **self.fmtparams)
        for row in reader:
            if len(row) > self.column:
                yield Link(row[self.column])

