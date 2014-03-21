import csv
from cStringIO import StringIO

from scrapy.link import Link

from .base import BaseLinkExtractor

# see http://docs.python.org/2/library/csv.html#csv-fmt-params
_FORMAT_PARAMETERS = (
    ('delimiter', ','),
    ('quotechar', '"'),
    ('doublequote', True),
    ('escapechar', None),
    ('lineterminator', '\r\n'),
    ('skipinitialspace', False),
    ('strict', False),
)

class CsvLinkExtractor(BaseLinkExtractor):
    def __init__(self, column=0, **kwargs):
        self.fmtparams = dict((key, kwargs.pop(key, default)) for key, default in _FORMAT_PARAMETERS)
        for key, val in self.fmtparams.items():
            if isinstance(val, unicode):
                self.fmtparams[key] = val.encode()
        super(CsvLinkExtractor, self).__init__(**kwargs)
        self.allowed_schemes = filter(lambda x: x and isinstance(x, basestring), self.allowed_schemes)
        self.column = column

    def _extract_links(self, response):
        buff = StringIO(response.body)
        reader = csv.reader(buff, **self.fmtparams)
        for row in reader:
            if len(row) > self.column:
                yield Link(row[self.column])

