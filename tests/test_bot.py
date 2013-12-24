import json
from os.path import join
from twisted.trial import unittest
from twisted.internet.defer import inlineCallbacks
from twisted.web.server import Site
from twisted.web.static import File
from twisted.internet import reactor
from slyd.bot import create_bot_resource
from .utils import TestSite, test_spec_manager
from .settings import RESOURCE_DIR


class BotTest(unittest.TestCase):
    def setUp(self):
        # configure bot resource
        sm = test_spec_manager()
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
        result = yield self._fetch("http://localhost:8997/test.html")
        self.assertEqual(result.responseCode, 200)
        value = json.loads(result.value())
        self.assertEqual(value['response']['status'], 200)
        self.assertIn('page', value)


    def tearDown(self):
        self.bot_resource.stop()
        self.listen_port.stopListening()
