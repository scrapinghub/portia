from __future__ import absolute_import
try:
    from cStringIO import StringIO # py2
except ImportError:
    from io import StringIO # py3
from scrapy.link import Link
from .base import BaseLinkExtractor
import csv
import six

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
        if six.PY2:
            for key, val in self.fmtparams.items():
                if isinstance(val, unicode):
                    self.fmtparams[key] = val.encode()
        super(CsvLinkExtractor, self).__init__(**kwargs)
        self.allowed_schemes = [x for x in self.allowed_schemes if x and isinstance(x, six.string_types)]
        self.column = column

    def _extract_links(self, response):
        buff = StringIO(response.body)
        reader = csv.reader(buff, **self.fmtparams)
        for row in reader:
            if len(row) > self.column:
                yield Link(row[self.column])

