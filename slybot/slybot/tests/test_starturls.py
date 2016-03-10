from unittest import TestCase
from datetime import datetime
from scrapy.settings import Settings
from slybot.starturls import StartUrls, UrlGenerator

class StartUrlGenerators(TestCase):
    github_start_urls = [
        'https://github.com/scrapinghub',
        'https://github.com/scrapy',
        'https://github.com/scrapy-plugins'
    ]
    donedeal_start_urls = [
        'https://www.donedeal.ie/cars-for-sale/i/1',
        'https://www.donedeal.ie/cars-for-sale/i/2',
        'https://www.donedeal.ie/houses-for-sale/i/1',
        'https://www.donedeal.ie/houses-for-sale/i/2',
        'https://www.donedeal.ie/pets-for-sale/i/1',
        'https://www.donedeal.ie/pets-for-sale/i/2',
        'https://www.donedeal.ie/kitchens-for-sale/i/1',
        'https://www.donedeal.ie/kitchens-for-sale/i/2'
    ]

    def test_start_urls(self):
        self.assertEqual(self.github_start_urls,
                         StartUrls()(self.github_start_urls))

    def test_generate_start_urls_from_defaults(self):
        genny = UrlGenerator()
        spec = [{
            "template": "https://github.com/{}",
            "paths": [{
                "type": "default",
                "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual(["https://github.com/scrapinghub"],
                         list(genny(spec[0])))

    def test_generate_start_urls_from_options(self):
        genny = UrlGenerator()
        spec = [{
            "template": "https://github.com/{}",
            "paths": [{
                "type": "options",
                "values": ["scrapinghub", "scrapy", "scrapy-plugins"],
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual(self.github_start_urls, list(genny(spec[0])))

    def test_generate_start_urls_from_date(self):
        now = datetime.now()
        genny = UrlGenerator()
        spec = [{
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
        url = "http://www.commitstrip.com/en/{}/{:02}".format(now.year,
                                                              now.month)
        self.assertEqual([url], list(genny(spec[0])))

    def test_generate_start_urls_from_range(self):
        genny = UrlGenerator()
        spec = [{
            "template": "https://www.donedeal.ie/{}/{}/{}",
            "paths": [{
                "type": "default",
                "values": ["cars-for-sale"]
            }, {
                "type": "options",
                "values": ["i"],
            }, {
                "type": "range",
                "values": [100000010, 100000000, -1]
            }],
            "params": [],
            "params_template": {}
        }]
        urls = ["https://www.donedeal.ie/cars-for-sale/i/%s" % i
                for i in range(100000010, 100000000, -1)]
        self.assertEqual(urls, list(genny(spec[0])))

    def test_generate_start_urls_from_params_range(self):
        genny = UrlGenerator()
        spec = [{
            "template": "http://www.smbc-comics.com/{}",
            "paths": [{
                "type": "default",
                "values": ["index.php"]
            }],
            "params": [{
                "name": "p",
                "type": "range",
                "values": [20, 30, 5]
            }, {
                "name": "q",
                "type": "options",
                "values": ['comic']
            }],
            "params_template": {}
        }]
        urls = ["http://www.smbc-comics.com/index.php?p=%s&q=comic" % i
                for i in range(20, 30, 5)]
        self.assertEqual(urls, list(genny(spec[0])))

    def test_generate_start_urls_from_spider_arg(self):
        genny = UrlGenerator(spider_args={
            'categories': ['cars-for-sale', 'houses-for-sale'],
            'sections': ['pets-for-sale', 'kitchens-for-sale']
        })
        spec = [{
            "template": "https://www.donedeal.ie/{}/{}/{}",
            "paths": [{
                "type": "spider_args",
                "values": ["categories", "sections"]
            }, {
                "type": "options",
                "values": ["i"],
            }, {
                "type": "range",
                "values": [1, 3]
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual(self.donedeal_start_urls, list(genny(spec[0])))

    def test_generate_start_urls_from_setting(self):
        genny = UrlGenerator(Settings(values={
            'categories': 'cars-for-sale,houses-for-sale',
            'sections': ['pets-for-sale', 'kitchens-for-sale']
        }))
        spec = [{
            "template": "https://www.donedeal.ie/{}/{}/{}",
            "paths": [{
                "type": "settings",
                "values": ["categories", "sections"]
            }, {
                "type": "options",
                "values": ["i"],
            }, {
                "type": "range",
                "values": [1, 3]
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual(self.donedeal_start_urls, list(genny(spec[0])))

    def test_generate_start_urls_from_params(self):
        genny = UrlGenerator()
        spec = [{
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
        base = "https://encrypted.google.com/search?hl=en&q=%s&location=%s"
        n, t, d, c = "nosetests", "tox", "dublin", "cork"
        arg = [(n, d), (n, c), (t, d), (t, c)]
        self.assertEqual([base % (q, l) for q, l in arg], list(genny(spec[0])))

    def test_misconfigured_start_urls_spec_type(self):
        genny = UrlGenerator()
        spec = [{
            "template": "http://www.smbc-comics.com/{}",
            "paths": [{
                "type": "defaults",
                "values": ["index.php"]
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual([], list(genny(spec[0])))

    def test_missing_arg_for_start_urls_spec(self):
        genny = UrlGenerator(Settings(values={'home': 'home.php'}), {
            'index': 'index.php'
        })
        spec = [{
            "template": "http://www.smbc-comics.com/{}",
            "paths": [{
                "type": "spider_args",
                "values": ["home"]
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual([], list(genny(spec[0])))
        spec = [{
            "template": "http://www.smbc-comics.com/{}",
            "paths": [{
                "type": "settings",
                "values": ["index"]
            }],
            "params": [],
            "params_template": {}
        }]
        self.assertEqual([], list(genny(spec[0])))
