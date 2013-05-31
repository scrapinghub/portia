from unittest import TestCase
from scrapely.htmlpage import HtmlPage

from slybot.fieldtypes import UrlFieldTypeProcessor

class FieldTypesUrlEncoding(TestCase):
    def test_not_standard_chars_in_url(self):
        body = u'<html><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" /></html>'
        url = u'fotos/produtos/Mam\xe3e noel.jpg'
        htmlpage = HtmlPage(url=u"http://www.example.com/", body=body, encoding='cp1252')
        processor = UrlFieldTypeProcessor()
        self.assertEqual(processor.adapt(url, htmlpage), u'http://www.example.com/fotos/produtos/Mam%C3%A3e%20noel.jpg')

