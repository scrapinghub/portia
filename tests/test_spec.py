import json
from tempfile import mkdtemp
from os.path import join, basename
from shutil import rmtree
from distutils.dir_util import copy_tree
from twisted.trial import unittest
from twisted.internet.defer import inlineCallbacks
from slyd.crawlerspec import create_crawler_spec_resource
from .utils import TestSite, test_spec_manager
from .settings import SPEC_DATA_DIR


class CrawlerSpecTest(unittest.TestCase):
    def setUp(self):
        sm = test_spec_manager()
        spec_resource = create_crawler_spec_resource(sm)
        self.temp_project_dir = mkdtemp(dir=SPEC_DATA_DIR,
            prefix='test-run-')
        self.project = basename(self.temp_project_dir)
        self.specsite = TestSite(spec_resource, project=self.project)
        test_project_dir = join(SPEC_DATA_DIR, 'test')
        copy_tree(test_project_dir, self.temp_project_dir)

    @inlineCallbacks
    def _get_check_resource(self, resource):
        result = yield self.specsite.get(resource)
        ffile = join(self.temp_project_dir, resource + ".json")
        fdata = json.load(open(ffile))
        rdata = json.loads(result.value())
        self.assertEqual(fdata, rdata)

    def test_get_resource(self):
        self._get_check_resource("project")
        self._get_check_resource("spiders/pinterest.com")

    @inlineCallbacks
    def test_updating(self):
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
        result = yield self.specsite.post('spiders/testpost', data=spider)
        self.assertEqual(result.responseCode, 200)
        result = yield self.specsite.get('spiders/testpost')
        self.assertEqual(json.loads(result.value()), json.loads(spider))

        # should fail - missing required fields
        result = yield self.specsite.post('spiders/testpost', data='{}')
        self.assertEqual(result.responseCode, 400)

    def tearDown(self):
        rmtree(self.temp_project_dir)
