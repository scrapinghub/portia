import json
from tempfile import mkdtemp
from os.path import join, basename
from shutil import rmtree
from distutils.dir_util import copy_tree
from twisted.trial import unittest
from twisted.internet.defer import inlineCallbacks
from slyd.projectspec import create_project_resource
from slyd.projectspec import convert_template
from .utils import TestSite, test_spec_manager
from .settings import SPEC_DATA_DIR


class CrawlerSpecTest(unittest.TestCase):
    spider = """
        {
            "exclude_patterns": [],
            "follow_patterns": [
                ".+MobileHomePark.php?key=d+"
            ],
            "links_to_follow": "patterns",
            "respect_nofollow": true,
            "start_urls": [
                "http://www.mhvillage.com/"
            ],
            "templates": []
        }
    """

    def setUp(self):
        sm = test_spec_manager()
        spec_resource = create_project_resource(sm)
        self.temp_project_dir = mkdtemp(dir=SPEC_DATA_DIR,
                                        prefix='test-run-')
        self.project = basename(self.temp_project_dir)
        self.specsite = TestSite(spec_resource, project=self.project)
        test_project_dir = join(SPEC_DATA_DIR, 'test')
        copy_tree(test_project_dir, self.temp_project_dir)

    @inlineCallbacks
    def _get_check_resource(self, resource, converter=None):
        result = yield self.specsite.get(resource)
        ffile = join(self.temp_project_dir, resource + ".json")
        fdata = json.load(open(ffile))
        if converter:
            converter(fdata)
        rdata = json.loads(result.value())
        self.assertEqual(fdata, rdata)

    def test_get_resource(self):
        self._get_check_resource("project")
        self._get_check_resource("spiders/pinterest.com",
                                 convert_template)

    @inlineCallbacks
    def post_command(self, spider, cmd, *args, **kwargs):
        obj = {'cmd': cmd, 'args': args}
        result = yield self.specsite.post(spider, data=json.dumps(obj))
        self.assertEqual(result.responseCode, kwargs.get('expect', 200))

    @inlineCallbacks
    def test_updating(self):
        result = yield self.specsite.post('spiders/testpost', data=self.spider)
        self.assertEqual(result.responseCode, 200)
        result = yield self.specsite.get('spiders/testpost')
        self.assertEqual(json.loads(result.value()), json.loads(self.spider))

        # should fail - missing required fields
        result = yield self.specsite.post('spiders/testpost', data='{}')
        self.assertEqual(result.responseCode, 400)

    @inlineCallbacks
    def test_commands(self):
        self.post_command('spiders', 'unknown', expect=400)
        self.post_command('spiders', 'mv', expect=400)
        self.post_command('spiders', 'mv', '../notallowed', 'whatever',
                          expect=400)
        self.post_command('spiders', 'mv', 'notallowedexists', 'whatever',
                          expect=404)
        self.post_command('spiders', 'rm', 'notexists', expect=404)
        # TODO: mv to existing spider - 400
        yield self.specsite.post('spiders/c', data=self.spider)
        self._get_check_resource('spiders/c')
        self.post_command('spiders', 'mv', 'c', 'c2')
        result = yield self.specsite.get('spiders/c')
        self.assertEqual(result.value(), '{}\n')
        self._get_check_resource('spiders/c2')
        yield self.specsite.post('spiders/c3', data=self.spider)
        # overwrites
        self.post_command('spiders', 'mv', 'c2', 'c3')
        result = yield self.specsite.get('spiders/c2')
        self.assertEqual(result.value(), '{}\n')
        self.post_command('spiders', 'rm', 'c3')
        result = yield self.specsite.get('spiders/c3')
        self.assertEqual(result.value(), '{}\n')

    def tearDown(self):
        rmtree(self.temp_project_dir)
