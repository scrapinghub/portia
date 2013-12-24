#from twisted.trial import unittest
import unittest
from twisted.web.resource import NoResource
from twisted.internet.defer import inlineCallbacks
from scrapy.tests.mockserver import Status
from slyd.project import Project
from .utils import TestSite


class ProjectTest(unittest.TestCase):
    def setUp(self):
        project = Project()
        project.putChild('status', Status())
        self.psite = TestSite(project)

    @inlineCallbacks
    def test_childaccess(self):
        with self.assertRaises(NoResource):
            yield self.psite.get("noresource")
        with self.assertRaises(NoResource):
            yield self.psite.get("project/noresource")
        yield self.psite.get("project/status")
