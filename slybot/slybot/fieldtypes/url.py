from urlparse import urljoin
from scrapy.utils.url import safe_download_url
from scrapy.utils.markup import unquote_markup
from slybot.baseurl import get_base_url

class UrlFieldTypeProcessor(object):
    """Renders URLs as links"""

    name = 'url'
    description = 'URL'
    limit = 80

    def extract(self, text):
        return text

    def adapt(self, text, htmlpage):
        text = text.encode(htmlpage.encoding)
        joined = urljoin(get_base_url(htmlpage).encode(htmlpage.encoding), text)
        return safe_download_url(unquote_markup(joined, encoding=htmlpage.encoding))

