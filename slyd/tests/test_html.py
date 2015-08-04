import unittest
from slyd.html import descriptify

JAVASCRIPT_URLS = (
    "javascript:alert();",
    "javascript:alert()",
    'JaVaScRiPt:alert();',
    '&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041',
    '&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29',
    "jav        ascript:alert();",
    "jav&#x09;ascript:alert();",
    "jav&#x0A;ascript:alert();",
    "jav&#x0D;ascript:alert();",
    'java\0script:alert()>";',
    " &#14;  javascript:alert();",
)

VALID_URLS = (
    ("http://javascript.com/alert", "http://javascript.com/alert"),
    ("//javascript/:test", "https://javascript/:test"),
    ('/javascript:info/info_about_javascript.html', "https://x.es/javascript:info/info_about_javascript.html"),
    ('?javascript:1', "https://x.es/home/about.html?javascript:1"),
    ('#javascript:1', "https://x.es/home/about.html?query=1#javascript:1"),
)

LINKS = [
    '<a href="%s">Click me :)</a>',
    '<a HREF="%s">Click me :)</a>',
    '<a HrEf="%s">Click me :)</a>',
    "<a href='%s'>Click me :)</a>",
    "<a HREF='%s'>Click me :)</a>",
    "<a HrEf='%s'>Click me :)</a>",
]

class HtmlTest(unittest.TestCase):
    def test_xss(self):
        base = "https://x.es/home/about.html?query=1"

        for link in LINKS:
            for url in JAVASCRIPT_URLS:
                self.assertNotRegexpMatches(descriptify(link % url), 'javascript|xss|alert')

            for relurl, absolute in VALID_URLS:
                self.assertEqual(descriptify(link % relurl, base=base), '<a href="%s">Click me :)</a>' % absolute)

    def test_html_sanitization(self):
        for markup in (
            '<script> alert(xss) </script>',
            '<script src="xss.js"/>',
            '<script><!-- alert(xss) --></script>',
            '<script><!--\n alert(xss)\n --></script>',
            '<script><![CDATA[ alert(xss) ]]></script>'):
            self.assertNotRegexpMatches(descriptify(markup), 'javascript|xss|alert')

