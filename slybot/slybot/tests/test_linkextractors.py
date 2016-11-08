import json

from os.path import dirname
from unittest import TestCase
from scrapy.http import Request
from scrapy.settings import Settings
from slybot.utils import htmlpage_from_response

from slybot.linkextractor import (
    create_linkextractor_from_specs, RssLinkExtractor, SitemapLinkExtractor,
)
from slybot.plugins.scrapely_annotations.builder import (
    Annotations, _clean_annotation_data
)
from slybot.utils import load_plugins
from slybot.spider import IblSpider
from .utils import UTF8HtmlResponse, UTF8TextResponse


class Test_RegexLinkExtractor(TestCase):
    def test_default(self):
        specs = {"type": "regex", "value": ''}
        lextractor = create_linkextractor_from_specs(specs)
        text = "Hello http://www.example.com/path, more text https://aws.amazon.com/product?id=23#tre?"
        response = UTF8TextResponse(url='http://www.example.com/', body=text)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'https://aws.amazon.com/product?id=23')

    def test_custom(self):
        specs = {"type": "regex", "value": 'url: ((?:http|https)://www.example.com/[\w/]+)'}
        lextractor = create_linkextractor_from_specs(specs)
        text = "url: http://www.example.com/path, more text url: https://www.example.com/path2. And more text url: https://aws.amazon.com/product?id=23#tre"
        response = UTF8TextResponse(url='http://www.example.com/', body=text)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'https://www.example.com/path2')

    def test_custom_withargs(self):
        specs = {"type": "regex", "value": 'url: ((?:http|https)://www.example.com/[\w/]+)', 'allowed_schemes': ['http']}
        lextractor = create_linkextractor_from_specs(specs)
        text = "url: http://www.example.com/path, more text url: https://www.example.com/path2. And more text url: https://aws.amazon.com/product?id=23#tre"
        response = UTF8TextResponse(url='http://www.example.com/', body=text)
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
        self.response = UTF8TextResponse(url='http://www.example.com/', body=xmlfeed)
        self.sitemap = UTF8TextResponse(url='http://www.example.com/sitemap.xml', body=sitemapfeed)
        self.sitemapindex = UTF8TextResponse(url='http://www.example.com/sitemap.xml', body=sitemapindex)
        self.atom = UTF8TextResponse(url='http://www.example.com/atom', body=atomfeed)

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
        response = UTF8TextResponse(url='http://www.example.com/', body=csvfeed)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

    def test_extra_params(self):
        specs = {"type": "column", "value": 1, "delimiter": "|"}
        lextractor = create_linkextractor_from_specs(specs)
        response = UTF8TextResponse(url='http://www.example.com/', body=csvfeed2)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

    def test_header(self):
        specs = {"type": "column", "value": 1}
        lextractor = create_linkextractor_from_specs(specs)
        response = UTF8TextResponse(url='http://www.example.com/', body=csvfeed3)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[1].url, 'http://www.example.com/path2')

html = """
<a href="http://www.example.com/path">Click here</a>
"""
_PATH = dirname(__file__)
with open('%s/data/templates/daft_list.json' % _PATH) as f:
    daft_sample = json.load(f)
    daft_body = Annotations(daft_sample).apply()
    daft_sample['annotated_body'] = daft_body


class Test_HtmlLinkExtractor(TestCase):
    def test_simple(self):
        specs = {"type": "html", "value": None}
        lextractor = create_linkextractor_from_specs(specs)
        response = UTF8HtmlResponse(url='http://www.example.com/', body=html)
        links = list(lextractor.links_to_follow(response))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[0].text, 'Click here')


class Test_PaginationExtractor(TestCase):
    def test_simple(self):
        specs = {"type": "pagination", "value": None}
        lextractor = create_linkextractor_from_specs(specs)
        html_page = htmlpage_from_response(
            UTF8HtmlResponse(url='http://www.example.com/', body=html))
        html_page.headers['n_items'] = 1
        links = list(lextractor.links_to_follow(html_page))
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].url, 'http://www.example.com/path')
        self.assertEqual(links[0].text, 'Click here')

    def test_start_urls(self):
        specs = {"type": "pagination",
                 "value": None,
                 "start_urls": ['http://www.spam.com/?p=1',
                                'http://www.eggs.com/?page=0']
        }
        lextractor = create_linkextractor_from_specs(specs)
        html = """
        <a href="http://www.spam.com/?p=100">Click here 1</a>
        <a href="http://www.spam.com/?p=200">Click here 2</a>
        <a href="http://www.spam.com/?p=300">Click here 3</a>
        """
        html_page = htmlpage_from_response(
            UTF8HtmlResponse(url='http://www.example.com/', body=html))
        links = list(lextractor.links_to_follow(html_page))
        links = sorted(links, key=lambda link: link.url)
        self.assertEqual(len(links), 3)
        self.assertEqual(links[0].url, "http://www.spam.com/?p=100")
        self.assertEqual(links[1].url, "http://www.spam.com/?p=200")
        self.assertEqual(links[2].url, "http://www.spam.com/?p=300")
        self.assertEqual(links[0].text, 'Click here 1')
        self.assertEqual(links[1].text, 'Click here 2')
        self.assertEqual(links[2].text, 'Click here 3')

    def test_trained(self):
        base = 'http://www.daft.ie/ireland/houses-for-sale/?offset={}'.format
        daft_url = base(10)
        spec = {
            'start_urls': [daft_url],
            'links_to_follow': 'auto',
            'respect_nofollow': False,
            'follow_patterns': [],
            'exclude_patterns': [],
            'init_requests': [],
            'templates': [daft_sample]
        }
        settings = Settings()
        settings.set('LOADED_PLUGINS', load_plugins(settings))
        spider = IblSpider('hn', spec, {}, {}, settings=settings)
        request = Request(daft_url)
        response = UTF8HtmlResponse(url=daft_url, body=daft_body,
                                    request=request)
        data = {r.url for r in spider.handle_html(response)
                if isinstance(r, Request)}
        self.assertEqual({base(i) for i in (90, 80, 70)}, data)
