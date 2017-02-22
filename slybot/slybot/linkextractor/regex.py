from __future__ import absolute_import
import re
from scrapy.link import Link

from .base import BaseLinkExtractor
import six

# Based on http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
# leaves aside the fragment part, not needed for link extraction
URL_DEFAULT_REGEX = r'(?:[A-Za-z0-9.\-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.\-]+)(?:(?:\/[\+~%\/.\w\-_]*)?\??(?:[\-\+=&;%@.\w_]*)(?:#[.\!\/\w]*)?)?'

class RegexLinkExtractor(BaseLinkExtractor):
    def __init__(self, regex=None, **kwargs):
        super(RegexLinkExtractor, self).__init__(**kwargs)
        self.allowed_schemes = [x for x in self.allowed_schemes if x and isinstance(x, six.string_types)]
        regex = regex or '(?:%s)://%s' % ('|'.join(self.allowed_schemes), URL_DEFAULT_REGEX)
        self.regex = re.compile(regex)

    def _extract_links(self, response):
        """First extract regex groups(). If empty, extracts from regex group()"""
        for s in self.regex.finditer(response.text):
            if s.groups():
                for url in s.groups():
                    yield Link(url)
            else:
                yield Link(s.group())


