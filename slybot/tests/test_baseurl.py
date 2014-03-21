"""
Tests for apply_annotations
"""

from unittest import TestCase
from slybot.baseurl import insert_base_url, get_base_url
from scrapely.htmlpage import HtmlPage

class TestApplyAnnotations(TestCase):
    def test_insert_base_relative(self):
        """Replace relative base href"""
        html_in = '<html><head><base href="products/"><body></body></html>'
        html_target = '<html><head><base href="http://localhost:8000/products/" />\
<body></body></html>'
        html_out = insert_base_url(html_in, "http://localhost:8000/")
        self.assertEqual(html_out, html_target)

    def test_insert_base_noreplace(self):
        """base tag dont need to be replaced"""
        html_in = html_target = '<html><head><base href="http://localhost:8000/products/"><body></body></html>'
        html_out = insert_base_url(html_in, "http://localhost:8000/users/blog.html")
        self.assertEqual(html_out, html_target)
        
    def test_insert_base_addbase(self):
        """add base tag when not present"""
        html_in = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">\
<body></body></html>'
        html_target = '<html><head><base href="http://localhost:8000/" />\
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">\
<body></body></html>'
        html_out = insert_base_url(html_in, "http://localhost:8000/")
        self.assertEqual(html_out, html_target)

    def test_insert_base_commented(self):
        """Test weird case when base tag is commented in origin"""
        html_in = '<html><head><!-- <base href="http://example.com/"> --></head>\
<body>Body</body></html>'
        html_target = '<html><head><base href="http://example.com/" />\
<!-- <base href="http://example.com/"> --></head><body>Body</body></html>'
        html_out = insert_base_url(html_in, "http://example.com/")
        self.assertEqual(html_out, html_target)

    def test_insert_base_nohead(self):
        """Test base insert when no head element is present"""
        html_in = '<html><body>Body</body></html>'
        html_target = '<html>\n\
<head><base href="http://localhost:8000/" /></head>\n\
<body>Body</body></html>'
        html_out = insert_base_url(html_in, "http://localhost:8000/")
        self.assertEqual(html_out, html_target)

    def test_get_base_url(self):
        """Basic get_base_url test"""
        html = u'<html><head><base href="http://example.com/products/" />\
<body></body></html>'
        page = HtmlPage("http://example.com/products/p19.html", body=html)
        self.assertEqual(get_base_url(page), "http://example.com/products/")

    def test_get_base_url_nobase(self):
        """Base tag does not exists"""
        html = u'<html><head><body></body></html>'
        page = HtmlPage("http://example.com/products/p19.html", body=html)
        self.assertEqual(get_base_url(page), "http://example.com/products/p19.html")

    def test_get_base_url_empty_basehref(self):
        """Base tag exists but href is empty"""
        html = u'<html><head><base href="" />\
<body></body></html>'
        url = "http://example.com/products/p19.html"
        page = HtmlPage(url, body=html)
        self.assertEqual(get_base_url(page), url)


