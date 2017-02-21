import re
from six.moves.urllib.parse import urljoin
from scrapely.extractors import url as strip_url
from scrapy.utils.url import safe_download_url
from scrapy.utils.markup import unquote_markup
from slybot.baseurl import get_base_url
disallowed = re.compile('[\x00-\x1F\x7F]')


class UrlFieldTypeProcessor(object):
    """Renders URLs as links"""

    name = 'url'
    description = 'URL'
    limit = 80

    def extract(self, text):
        if text is not None:
            return strip_url(text)
        return ''

    def adapt(self, text, htmlpage=None):
        if htmlpage is None:
            return text
        if text is None:
            return
        encoding = getattr(htmlpage, 'encoding', 'utf-8')
        text = text.encode(encoding)
        unquoted = unquote_markup(text, encoding=encoding)
        cleaned = strip_url(disallowed.sub('', unquoted))
        base = get_base_url(htmlpage).encode(encoding)
        base_url = strip_url(unquote_markup(base, encoding=encoding))
        joined = urljoin(base_url, cleaned)
        return safe_download_url(joined)
