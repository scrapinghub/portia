from __future__ import absolute_import
import json
import unittest
from tempfile import mkdtemp
from os.path import join, exists
from shutil import rmtree
from twisted.internet.defer import inlineCallbacks
from twisted.web.resource import NoResource, Resource
from .utils import TestSite, create_projects_resource
from .settings import DATA_DIR

def getarg(request, name, default=None, type=str):
    if name in request.args:
        return type(request.args[name][0])
    else:
        return default

class Status(Resource):
    isLeaf = True
    def render_GET(self, request):
        n = getarg(request, "n", 200, type=int)
        request.setResponseCode(n)
        return ""

class ProjectsTest(unittest.TestCase):

    def setUp(self):
        self.temp_projects_dir = mkdtemp(dir=DATA_DIR,
                                         prefix='test-run-')
        root = Resource()
        projects = create_projects_resource(self.temp_projects_dir)
        root.putChild('projects', projects)
        projects.putChild('status', Status())
        self.projectssite = TestSite(root, None)

    def check_project_exists(self, project_name):
        self.assertTrue(exists(join(self.temp_projects_dir, project_name)))
        self.assertTrue(
            exists(join(self.temp_projects_dir, project_name, 'spiders')))

    def check_project_not_exists(self, project_name):
        self.assertFalse(exists(join(self.temp_projects_dir, project_name)))

    @inlineCallbacks
    def test_childaccess(self):
        with self.assertRaises(NoResource):
            yield self.projectssite.get("projects/noresource")
        with self.assertRaises(NoResource):
            yield self.projectssite.get("projects/project/noresource")
        yield self.projectssite.get("projects/project/status")

    @inlineCallbacks
    def post_command(self, cmd, *args, **kwargs):
        obj = {'cmd': cmd, 'args': args}
        result = yield self.projectssite.post('projects', data=json.dumps(obj))
        self.assertEqual(result.responseCode, kwargs.get('expect', 200))

    @inlineCallbacks
    def test_list_projects(self):
        result = yield self.projectssite.get('projects')
        self.assertEqual(json.loads(result.value()), {'projects': []})
        self.post_command('create', 'project1')
        self.post_command('create', 'project2')
        result = yield self.projectssite.get('projects')

        project_names = [p['name'] for p in json.loads(result.value())['projects']]
        self.assertEqual(set(project_names), set([u'project1', u'project2']))

    def test_commands(self):
        self.post_command('rm', 'doesnotexist', expect=404)
        self.post_command('create', 'project1')
        self.check_project_exists('project1')
        self.post_command('mv', 'project1', 'project2')
        self.check_project_exists('project2')
        self.post_command('rm', 'project2')
        self.check_project_not_exists('project2')
        # Don't allow overwrites when creating or renaming projects
        self.post_command('create', 'project1')
        self.post_command('create', 'project1', expect=400)
        self.post_command('create', 'project2')
        self.post_command('mv', 'project1', 'project2', expect=400)

    def tearDown(self):
        rmtree(self.temp_projects_dir)
