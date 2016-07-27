from unittest import TestCase

from slybot.starturls import FragmentGenerator, IdentityGenerator, StartUrlCollection, UrlGenerator


class StartUrlCollectionTest(TestCase):
    def setUp(self):
        self.generators = {
            'start_urls': IdentityGenerator(),
            'generated_urls': UrlGenerator(),
            'url': IdentityGenerator(),
            'generated': FragmentGenerator(),
        }

    def test_mixed_start_urls_generation(self):
        start_urls = [
            'http://google.com',
            {"type": "url", "url": "http://domain.com"},
            {
                'type': 'generated',
                'url': 'https://github.com/[0-2]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com/'},
                    {'type': 'range', 'value': '0-2'},
                ]
            }
        ]
        generated_start_urls = [
            'http://google.com',
            'http://domain.com',
            'https://github.com/0',
            'https://github.com/1',
            'https://github.com/2',
        ]

        generated = StartUrlCollection(start_urls, self.generators, 'start_urls')
        self.assertEqual(list(generated), generated_start_urls)

    def test_generated_type(self):
        generated_start_urls = [
            'https://github.com/scrapinghub',
            'https://github.com/scrapy',
            'https://github.com/scrapy-plugins',
        ]
        start_urls = [
            {
                "template": "https://github.com/{}",
                "paths": [{
                    "type": "options",
                    "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
                }],
                "params": [],
                "params_template": {}
            },
        ]
        generated = StartUrlCollection(start_urls, self.generators, 'generated_urls')

        self.assertEqual(list(generated), generated_start_urls)

    def test_unique_legacy_urls(self):
        start_urls = [
            'http://google.com',
            'http://github.com',
            'http://github.com',
            'http://scrapinghub.com',
            'http://scrapinghub.com',
        ]
        unique_urls = [
            'http://google.com',
            'http://github.com',
            'http://scrapinghub.com',
        ]

        self.assertEqual(StartUrlCollection(start_urls).uniq(), unique_urls)

    def test_unique_list_start_urls(self):
        start_urls = [
            {"type": "url", "url": "http://domain.com"},
            {
                'type': 'generated',
                'url': 'https://github.com/[...]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com/'},
                    {'type': 'list', 'value': 'scrapely portia'},
                ]
            },
            {
                'type': 'generated',
                'url': 'https://github.com/[...]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com/'},
                    {'type': 'list', 'value': 'scrapely scrapinghub portia'},
                ]
            },
        ]

        self.assertEqual(StartUrlCollection(start_urls).uniq(), start_urls)

    def test_allowed_domains_with_many_fragments(self):
        start_urls = [
            {
                'type': 'generated',
                'url': 'https://github.com/[...]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com'},
                    {'type': 'list', 'value': '/a /b /c'},
                    {'type': 'range', 'value': '1-10000000'},
                ]
            },
        ]
        allowed_domains = [
            'https://github.com/a',
            'https://github.com/b',
            'https://github.com/c',
        ]
        collection_domains = StartUrlCollection(start_urls, self.generators).allowed_domains
        self.assertEqual(set(collection_domains), set(allowed_domains))

    def test_allowed_domains_with_mixed_urls(self):
        start_urls = [
            {
                'type': 'generated',
                'url': 'https://scrapinghub.com/[...]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://scrapinghub.com/'},
                    {'type': 'range', 'value': '1-10000000'},
                ]
            },
            {
                'type': 'generated',
                'url': 'https://github[1-3].com/[...]',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github'},
                    {'type': 'range', 'value': '1-3'},
                    {'type': 'fixed', 'value': '.com/'},
                    {'type': 'range', 'value': '1-10000000'},
                ]
            },
            {"type": "url", "url": "http://domain.com"},
            'http://google.com',
        ]
        allowed_domains = [
            'https://scrapinghub.com/',
            'https://github1.com/',
            'https://github2.com/',
            'https://github3.com/',
            'http://domain.com',
            'http://google.com',
        ]
        collection_domains = StartUrlCollection(start_urls, self.generators).allowed_domains
        self.assertEqual(set(collection_domains), set(allowed_domains))

    def test_empty_allowed_domains(self):
        start_urls = [
            {
                'type': 'generated',
                'url': 'https://',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://'},
                ]
            },
        ]
        collection_domains = StartUrlCollection(start_urls, self.generators).allowed_domains
        self.assertEqual(collection_domains, [])

    def test_multiple_empty_allowed_domains(self):
        start_urls = [
            {
                'type': 'generated',
                'url': 'https://',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://'},
                    {'type': 'fixed', 'value': 'scrapy'},
                ]
            },
        ]
        collection_domains = StartUrlCollection(start_urls, self.generators).allowed_domains
        self.assertEqual(collection_domains, [])
