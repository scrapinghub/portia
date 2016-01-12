import json
from os.path import join
from twisted.trial import unittest
from twisted.internet.defer import inlineCallbacks
from twisted.web.server import Site
from twisted.web.static import File
from twisted.internet import reactor
from slyd.bot import create_bot_resource
from .utils import TestSite, create_spec_manager
from .settings import RESOURCE_DIR


class BotTest(unittest.TestCase):
    def setUp(self):
        # configure bot resource
        sm = create_spec_manager()
        self.bot_resource = create_bot_resource(sm)
        self.botsite = TestSite(self.bot_resource)

        # configure fake website to crawl
        docroot = join(RESOURCE_DIR, 'docroot')
        factory = Site(File(docroot))
        self.listen_port = reactor.listenTCP(8997, factory)

    def _fetch(self, url, **params):
        req = dict(params)
        req.setdefault('request', {})['url'] = url
        request_json = json.dumps(req)
        return self.botsite.post('fetch', data=request_json)

    @inlineCallbacks
    def test_fetch(self):
        # test status code
        result = yield self._fetch("http://localhost:8997/notexists")
        self.assertEqual(result.responseCode, 200)
        status = json.loads(result.value())['response']['status']
        self.assertEqual(status, 404)

        # get an existing file
        test_url = "http://localhost:8997/test.html"
        result = yield self._fetch(test_url)
        self.assertEqual(result.responseCode, 200)
        value = json.loads(result.value())
        # expect 200 response and base href added
        self.assertEqual(value['response']['status'], 200)

        # parse fetched data
        test_url = "http://localhost:8997/pin1.html"
        result = yield self._fetch(test_url)
        self.assertEqual(result.responseCode, 200)

        result = yield self._fetch(test_url, spider='pinterest.com')
        self.assertEqual(result.responseCode, 200)
        value = json.loads(result.value())
        # check item
        item = value['items'][0]
        self.assertEqual(item['url'], test_url)
        self.assertEqual(item['name'][0], u'Luheca Designs')
        # check links
        self.assertIn('links', value)

    def tearDown(self):
        self.bot_resource.stop()
        self.listen_port.stopListening()
