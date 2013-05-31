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

    def render(self, field_name, field_value, item):
        if not field_value: # rolando quick fix for #2141
            return u''

        if len(field_value) > self.limit:
            segment = self.limit / 2 - 2
            short = "%s...%s" % (field_value[:segment], field_value[-segment:])
        else:
            short = field_value

        params = {
            'name': field_name,
            'value': field_value,
            'short': short,
        }
        return u'<a title="%(name)s: %(value)s" href="%(value)s">%(short)s</a>' % params
