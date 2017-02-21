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

        generated = StartUrlCollection(start_urls, self.generators)
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
        generated = StartUrlCollection(start_urls, self.generators)

        self.assertEqual(list(generated), generated_start_urls)

    def test_malformed_generated_type(self):
        expected_format = [
            {'fragments': [{'type': 'fixed', 'value': 'https://github.com/'},
                           {'type': 'list',
                            'value': 'scrapinghub scrapy scrapy-plugins'}],
             'type': 'generated',
             'url': 'https://github.com/[...]/'}]
        start_urls = [
            {
                "template": "https://github.com/{}/{}/{}",
                "paths": [{
                    "type": "options",
                    "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
                }],
                "params": [],
                "params_template": {}
            },
        ]
        normalized = StartUrlCollection(start_urls, self.generators).normalize()

        self.assertEqual(normalized, expected_format)


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

    def test_normalize_string_url(self):
        legacy = ['https://github.com/scrapinghub']
        normalized = [{
            'url': 'https://github.com/scrapinghub',
            'type': 'url',
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(legacy[0], normalized[0]['url'])
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalize_start_url(self):
        start_urls = [{
            'url': 'https://github.com/scrapinghub',
            'type': 'fixed',
        }]
        collection = StartUrlCollection(start_urls, self.generators)

        self.assertEqual(list(collection.normalize()), start_urls)

    def test_normalize_generated_options(self):
        legacy = [{
            "template": "https://github.com/{}",
            "paths": [{
                "type": "options",
                "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
            }],
            "params": [],
            "params_template": {}
        }]
        normalized = [{
            'url': 'https://github.com/[...]',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'https://github.com/'},
                {
                    'type': 'list',
                    'value': 'scrapinghub scrapy scrapy-plugins',
                },
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalize_generated_default(self):
        legacy = [{
            "template": "https://github.com/{}/fixed",
            "paths": [{
                "type": "default",
                "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
            }],
            "params": [],
            "params_template": {}
        }]
        normalized = [{
            'url': 'https://github.com/scrapinghub/fixed',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'https://github.com/'},
                {
                    'type': 'fixed',
                    'value': 'scrapinghub',
                },
                {'type': 'fixed', 'value': '/fixed'},
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalize_generated_dates(self):
        legacy = [{
            "template": "http://www.commitstrip.com/{}/{}/{}",
            "paths": [{
                "type": "default",
                "values": ["en"]
            }, {
                "type": "date",
                "values": ["%Y"],
            }, {
                "type": "date",
                "values": ["%m"]
            }],
            "params": [],
            "params_template": {}
        }]
        normalized = [{
            'url': 'http://www.commitstrip.com/en/[...]/[...]',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'http://www.commitstrip.com/'},
                {'type': 'fixed', 'value': 'en'},
                {'type': 'fixed', 'value': '/'},
                {'type': 'date', 'value': '%Y'},
                {'type': 'fixed', 'value': '/'},
                {'type': 'date', 'value': '%m'},
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalized_generated_range(self):
        legacy = [{
            "template": "https://www.donedeal.ie/{}/{}/{}",
            "paths": [{
                "type": "default",
                "values": ["cars-for-sale"]
            }, {
                "type": "options",
                "values": ["i"],
            }, {
                "type": "range",
                "values": [10, 20]
            }],
            "params": [],
            "params_template": {}
        }]
        normalized = [{
            'url': 'https://www.donedeal.ie/cars-for-sale/[...]/10-19',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'https://www.donedeal.ie/'},
                {'type': 'fixed', 'value': 'cars-for-sale'},
                {'type': 'fixed', 'value': '/'},
                {'type': 'list', 'value': 'i'},
                {'type': 'fixed', 'value': '/'},
                {'type': 'range', 'value': '10-19'},
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalized_generated_params_range(self):
        legacy = [{
            "template": "http://www.smbc-comics.com/{}",
            "paths": [{
                "type": "default",
                "values": ["index.php"]
            }],
            "params": [{
                "name": "p",
                "type": "range",
                "values": [20, 31]
            }, {
                "name": "q",
                "type": "options",
                "values": ['comic']
            }],
            "params_template": {}
        }]
        normalized = [{
            'url': 'http://www.smbc-comics.com/index.php?p=20-30&q=[...]',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'http://www.smbc-comics.com/'},
                {'type': 'fixed', 'value': 'index.php'},
                {'type': 'fixed', 'value': '?p='},
                {'type': 'range', 'value': '20-30'},
                {'type': 'fixed', 'value': '&q='},
                {'type': 'list', 'value': 'comic'},
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalized_generated_template_params(self):
        legacy = [{
            "template": "https://encrypted.google.com/search",
            "paths": [],
            "params": [{
                "name": "q",
                "type": "options",
                "values": ["nosetests", "tox"]
            }, {
                "name": "location",
                "type": "options",
                "values": ["dublin", "cork"]
            }],
            "params_template": [
                ("hl", "en"),
                ("q", "python unittest")
            ]
        }]
        normalized = [{
            'url': 'https://encrypted.google.com/search?hl=en&q=[...]&location=[...]',
            'type': 'generated',
            'fragments': [
                {'type': 'fixed', 'value': 'https://encrypted.google.com/search'},
                {'type': 'fixed', 'value': '?hl='},
                {'type': 'fixed', 'value': 'en'},
                {'type': 'fixed', 'value': '&q='},
                {'type': 'list', 'value': 'nosetests tox'},
                {'type': 'fixed', 'value': '&location='},
                {'type': 'list', 'value': 'dublin cork'},
            ]
        }]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(generator_set(UrlGenerator, legacy[0]),
                         generator_set(FragmentGenerator, normalized[0]))
        self.assertEqual(list(collection.normalize()), normalized)

    def test_normalized_mixed(self):
        legacy = [
            {
                "template": "http://www.smbc-comics.com/{}",
                "paths": [{
                    "type": "default",
                    "values": ["index.php"]
                }],
                "params": [{
                    "name": "p",
                    "type": "range",
                    "values": [20, 31]
                }, {
                    "name": "q",
                    "type": "options",
                    "values": ['comic']
                }],
                "params_template": {}
            },
            'http://github.com/scrapinghub.com',
            {
                'url': 'https://github.com/[...]',
                'type': 'generated',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com/'},
                    {
                        'type': 'list',
                        'value': 'scrapinghub scrapy scrapy-plugins',
                    },
                ]
            }
        ]
        normalized = [
            {
                'url': 'http://www.smbc-comics.com/index.php?p=20-30&q=[...]',
                'type': 'generated',
                'fragments': [
                    {'type': 'fixed', 'value': 'http://www.smbc-comics.com/'},
                    {'type': 'fixed', 'value': 'index.php'},
                    {'type': 'fixed', 'value': '?p='},
                    {'type': 'range', 'value': '20-30'},
                    {'type': 'fixed', 'value': '&q='},
                    {'type': 'list', 'value': 'comic'},
                ]
            },
            {'url': 'http://github.com/scrapinghub.com', 'type': 'url'},
            {
                'url': 'https://github.com/[...]',
                'type': 'generated',
                'fragments': [
                    {'type': 'fixed', 'value': 'https://github.com/'},
                    {
                        'type': 'list',
                        'value': 'scrapinghub scrapy scrapy-plugins',
                    },
                ]
            },
        ]
        collection = StartUrlCollection(legacy, self.generators)

        self.assertEqual(list(collection.normalize()), normalized)

def generator_set(generator, start_urls):
    return set(list(generator()(start_urls)))
