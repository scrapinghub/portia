from unittest import TestCase
from scrapely.htmlpage import HtmlPage

from slybot.fieldtypes import UrlFieldTypeProcessor, ImagesFieldTypeProcessor

class FieldTypesUrlEncoding(TestCase):
    def test_not_standard_chars_in_url(self):
        body = u'<html><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" /></html>'
        url = u'fotos/produtos/Mam\xe3e noel.jpg'
        htmlpage = HtmlPage(url=u"http://www.example.com/", body=body, encoding='cp1252')
        processor = UrlFieldTypeProcessor()
        self.assertEqual(processor.adapt(url, htmlpage), u'http://www.example.com/fotos/produtos/Mam%C3%A3e%20noel.jpg')

    def test_uri_stripped_of_whitespace_and_quote_characters_correctly(self):
        urls = [u' image.jpg ', u"    '/data.jpg'", u'\n\t"file.jpg"\n\t\t']
        results = ['http://www.example.com/images/image.jpg',
                   'http://www.example.com/data.jpg',
                   'http://www.example.com/images/file.jpg']
        htmlpage = HtmlPage(url=u"http://www.example.com/images/",
                            body=u'<html><body></body></html>',
                            encoding='utf-8')
        url_p = UrlFieldTypeProcessor()
        img_p = ImagesFieldTypeProcessor()
        for text, url in zip(urls, results):
            self.assertEqual(img_p.adapt(img_p.extract(text), htmlpage), url)
            self.assertEqual(url_p.adapt(url_p.extract(text), htmlpage), url)

    def test_uri_with_illegal_html_entities(self):
        urls = [u'&#9;&#10 image.jpg ', u"    '/&#11;&#0;data.jpg'",
                u'&#15;\n\t"&#14;file.jpg"\n\t\t']
        results = ['http://www.example.com/images/image.jpg',
                   'http://www.example.com/data.jpg',
                   'http://www.example.com/images/file.jpg']
        htmlpage = HtmlPage(url=u"http://www.example.com/images/",
                            body=u'<html><body></body></html>',
                            encoding='utf-8')
        url_p = UrlFieldTypeProcessor()
        img_p = ImagesFieldTypeProcessor()
        for text, url in zip(urls, results):
            self.assertEqual(img_p.adapt(img_p.extract(text), htmlpage), url)
            self.assertEqual(url_p.adapt(url_p.extract(text), htmlpage), url)

    def test_blank_image_url(self):
        assert ImagesFieldTypeProcessor().extract(' ') == ''
