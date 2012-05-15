"""
Images 
"""
from urlparse import urljoin
from scrapy.utils.url import safe_download_url
from scrapy.utils.markup import unquote_markup
from scrapely.extractors import extract_image_url
from slybot.baseurl import get_base_url

class ImagesFieldTypeProcessor(object):
    name = 'image'
    description = 'extracts image URLs and renders items as images'

    def extract(self, text):
        return extract_image_url(text)
        
    def adapt(self, text, htmlpage):
        text = text.encode(htmlpage.encoding)
        joined = urljoin(get_base_url(htmlpage), text)
        return safe_download_url(unquote_markup(joined))

    def render(self, field_name, field_value, item):
        return u'<img alt="%s" title="%s" src="%s"/>' % \
            (field_value, field_value, field_value)
