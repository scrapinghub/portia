from unittest import TestCase
from scrapy.http import TextResponse, HtmlResponse
from slybot.utils import htmlpage_from_response
from slybot.linkextractor import (
        create_linkextractor_from_specs,

)

class Test_RegexLinkExtractor(TestCase):
    def test_default(self):
        specs = {"type": "regex", "value": ''}
        lextractor = create_linkextractor_from_specs(specs)
        text = "Hello http://www.example.com/path, more text https://aws.amazon.com/product?id=23#tre?"
        response = TextResponse(url='http://www.example.com/', body=text)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'https://aws.amazon.com/product?id=23')
        
    def test_custom(self):
        specs = {"type": "regex", "value": 'url: ((?:http|https)://www.example.com/[\w/]+)'}
        lextractor = create_linkextractor_from_specs(specs)
        text = "url: http://www.example.com/path, more text url: https://www.example.com/path2. And more text url: https://aws.amazon.com/product?id=23#tre"
        response = TextResponse(url='http://www.example.com/', body=text)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'https://www.example.com/path2')

    def test_custom_withargs(self):
        specs = {"type": "regex", "value": 'url: ((?:http|https)://www.example.com/[\w/]+)', 'allowed_schemes': ['http']}
        lextractor = create_linkextractor_from_specs(specs)
        text = "url: http://www.example.com/path, more text url: https://www.example.com/path2. And more text url: https://aws.amazon.com/product?id=23#tre"
        response = TextResponse(url='http://www.example.com/', body=text)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/path')

xmlfeed = """<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>RSS Title</title>
    <description>This is an example of an RSS feed</description>
    <link>http://www.someexamplerssdomain.com/main.html</link>
    <lastBuildDate>Mon, 06 Sep 2010 00:01:00 +0000 </lastBuildDate>
    <pubDate>Mon, 06 Sep 2009 16:20:00 +0000 </pubDate>
    <ttl>1800</ttl>

    <item>
        <title>Example entry</title>
        <description>Here is some text containing an interesting description.</description>
        <link>http://www.wikipedia.org/</link>
        <guid>unique string per item</guid>
        <pubDate>Mon, 06 Sep 2009 16:20:00 +0000 </pubDate>
    </item>
                            
</channel>
</rss>"""

sitemapfeed = """
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
	xmlns:image="http://www.sitemaps.org/schemas/sitemap-image/1.1"
        xmlns:video="http://www.sitemaps.org/schemas/sitemap-video/1.1">

<url><loc>http://www.accommodationforstudents.com/</loc><changefreq>daily</changefreq><priority>1.00</priority></url>
<url><loc>http://www.accommodationforstudents.com/London.asp</loc><changefreq>daily</changefreq><priority>1.00</priority></url>
<url><loc>http://www.accommodationforstudents.com/createaccounts.asp</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
</urlset>
"""

sitemapindex = """
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>http://www.example.com/sitemap1.xml.gz</loc>
        <lastmod>2004-10-01T18:23:17+00:00</lastmod>
    </sitemap>
</sitemapindex>
"""

atomfeed = """
<?xml version="1.0" encoding="utf-8"?>
 
<feed xmlns="http://www.w3.org/2005/Atom">
  
    <title>Example Feed</title>
    <subtitle>A subtitle.</subtitle>
    <link href="http://example.org/feed/" rel="self" />
    <link href="http://example.org/" />
    
    <entry>
        <title>Atom-Powered Robots Run Amok</title>
        <link href="http://example.org/2003/12/13/atom03" />
        <summary>Some text.</summary>
        <author>
            <name>John Doe</name>
            <email>johndoe@example.com</email>
        </author>
    </entry>
</feed>
"""

class Test_XmlLinkExtractors(TestCase):
    def setUp(self):
        self.response = TextResponse(url='http://www.example.com/', body=xmlfeed)
        self.sitemap = TextResponse(url='http://www.example.com/sitemap.xml', body=sitemapfeed)
        self.sitemapindex = TextResponse(url='http://www.example.com/sitemap.xml', body=sitemapindex)
        self.atom = TextResponse(url='http://www.example.com/atom', body=atomfeed)

    def test_rss(self):
        specs = {"type": "rss", "value": ""}
        lextractor = create_linkextractor_from_specs(specs)
        links = list(lextractor.links_to_follow(self.response))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.wikipedia.org/')

    def test_xml(self):
        specs = {"type": "xpath", "value": "//item/link/text()"}
        lextractor = create_linkextractor_from_specs(specs)
        links = list(lextractor.links_to_follow(self.response))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.wikipedia.org/')

    def test_sitemap(self):
        specs = {"type": "sitemap", "value": ""}
        lextractor = create_linkextractor_from_specs(specs)
        links = list(lextractor.links_to_follow(self.sitemap))
        self.assertEqual(len(links), 3)
        self.assertEqual(links[0].url, 'http://www.accommodationforstudents.com/')

        links = list(lextractor.links_to_follow(self.sitemapindex))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/sitemap1.xml.gz')

    def test_atom(self):
        specs = {"type": "atom", "value": ""}
        lextractor = create_linkextractor_from_specs(specs)
        links = list(lextractor.links_to_follow(self.atom))
        self.assertEqual(len(links), 3)
        self.assertEqual(links[0].url, 'http://example.org/feed/')

    def test_xml_remove_namespaces(self):
        specs = {"type": "xpath", "value": "//link/@href", "remove_namespaces": True}
        lextractor = create_linkextractor_from_specs(specs)
        links = list(lextractor.links_to_follow(self.atom))
        self.assertEqual(len(links), 3)
        self.assertEqual(links[0].url, 'http://example.org/feed/')

csvfeed = """
My feed

Product A,http://www.example.com/path,A
Product B,http://www.example.com/path2,B
"""

csvfeed2 = """
My feed

Product A|http://www.example.com/path|A
Product B|http://www.example.com/path2|B
"""

csvfeed3 = """
My feed

name,url,id
Product A,http://www.example.com/path,A
Product B,http://www.example.com/path2,B
"""

class Test_CsvLinkExtractor(TestCase):
    def test_simple(self):
        specs = {"type": "column", "value": 1}
        lextractor = create_linkextractor_from_specs(specs)
        response = TextResponse(url='http://www.example.com/', body=csvfeed)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

    def test_extra_params(self):
        specs = {"type": "column", "value": 1, "delimiter": "|"}
        lextractor = create_linkextractor_from_specs(specs)
        response = TextResponse(url='http://www.example.com/', body=csvfeed2)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

    def test_header(self):
        specs = {"type": "column", "value": 1}
        lextractor = create_linkextractor_from_specs(specs)
        response = TextResponse(url='http://www.example.com/', body=csvfeed3)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

html = """
<a href="http://www.example.com/path">Click here</a>
"""

class Test_HtmlLinkExtractor(TestCase):
    def test_simple(self):
        specs = {"type": "html", "value": None}
        lextractor = create_linkextractor_from_specs(specs)
        response = HtmlResponse(url='http://www.example.com/', body=html)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[0].text, 'Click here')


class Test_PaginationExtractor(TestCase):
    def test_simple(self):
        specs = {"type": "pagination", "value": None}
        lextractor = create_linkextractor_from_specs(specs)
        html_page = htmlpage_from_response(
            HtmlResponse(url='http://www.example.com/', body=html))
        html_page.headers['n_items'] = 1
        links = list(lextractor.links_to_follow(html_page))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[0].text, 'Click here')
