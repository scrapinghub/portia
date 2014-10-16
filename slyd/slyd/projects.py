"""
Projects Resource

Manages listing/creation/deletion/renaming of slybot projects on
the local filesystem. Routes to the appropriate resource for fetching
pages and project spec manipulation.
"""

import json, re, shutil, errno, os
from os.path import join
from functools import wraps
from twisted.web.resource import NoResource
from twisted.internet.threads import deferToThread
from twisted.web.server import NOT_DONE_YET
from twisted.internet.defer import Deferred
from .resource import SlydJsonResource
from .repoman import Repoman
import dashclient


# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_PROJECT_RE = re.compile('[^A-Za-z0-9._]|^\.*$')


_SETTINGS_TEMPLATE = \
"""# Automatically created by: slyd
import os

SPIDER_MANAGER_CLASS = 'slybot.spidermanager.ZipfileSlybotSpiderManager'
EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
ITEM_PIPELINES = ['slybot.dupefilter.DupeFilterPipeline']
SPIDER_MIDDLEWARES = {'slybot.spiderlets.SpiderletsMiddleware': 999} # as close as possible to spider output
SLYDUPEFILTER_ENABLED = True

PROJECT_ZIPFILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

try:
    from local_slybot_settings import *
except ImportError:
    pass

"""

_SETUP_PY_TEMPLATE = \
"""# Automatically created by: slyd

from setuptools import setup, find_packages

setup(
    name         = '%s',
    version      = '1.0',
    packages     = find_packages(),
    package_data = {
        'spiders': ['*.json']
    },
    data_files = [('', ['project.json', 'items.json', 'extractors.json'])],
    entry_points = {'scrapy': ['settings = spiders.settings']},
    zip_safe = True
)
"""

_SCRAPY_TEMPLATE = \
"""# Automatically created by: slyd

[settings]
default = slybot.settings
"""


def create_projects_manager_resource(spec_manager):
    return ProjectsManagerResource(spec_manager)


def run_in_thread(func):
    '''A decorator to defer execution to a thread'''

    @wraps(func)
    def wrapper(*args, **kwargs):
        return deferToThread(func, *args, **kwargs)

    return wrapper


class ProjectsManagerResource(SlydJsonResource):

    def __init__(self, spec_manager):
        SlydJsonResource.__init__(self)
        self.spec_manager = spec_manager

    def getChildWithDefault(self, project_path_element, request):
        request.project = project_path_element
        try:
            next_path_element = request.postpath.pop(0)
        except IndexError:
            next_path_element = None
        if next_path_element not in self.children:
            raise NoResource("No such child resource.")
        request.prepath.append(project_path_element)
        return self.children[next_path_element]

    def handle_project_command(self, projects_manager, command_spec):
        command = command_spec.get('cmd')
        dispatch_func = projects_manager.project_commands.get(command)
        if dispatch_func is None:
            self.bad_request(
                "unrecognised cmd arg %s, available commands: %s" %
                (command, ', '.join(projects_manager.project_commands.keys())))
        args = command_spec.get('args', [])        
        try:
            retval = dispatch_func(*args)
        except TypeError:
            self.bad_request("incorrect args for %s" % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                self.error(404, "Not Found", "No such resource")
            elif ex.errno == errno.EEXIST or ex.errno == errno.ENOTEMPTY:
                self.bad_request("A project with that name already exists")
            raise
        return retval or ''

    def render_GET(self, request):
        project_manager = self.spec_manager.project_manager(request)
        request.write(json.dumps(sorted(project_manager.list_projects())))
        return '\n'

    def render_POST(self, request):

        def finish_request(val):
            val and request.write(val)
            request.finish()
        
        project_manager = self.spec_manager.project_manager(request)
        obj = self.read_json(request)
        retval = self.handle_project_command(project_manager, obj)
        if isinstance(retval, Deferred):    
            retval.addCallbacks(finish_request, None)
            return NOT_DONE_YET
        else:
            return retval


def allowed_project_name(name):
    return not _INVALID_PROJECT_RE.search(name)


class ProjectsManager(object):

    def __init__(self, projectsdir, user, auth_projects, apikey):
        self.user = user
        self.auth_projects = auth_projects
        self.apikey = apikey
        self.projectsdir = projectsdir
        self.project_commands = {
            'create': self.create_project,
            'mv': self.rename_project,
            'rm': self.remove_project
        }

    def list_projects(self):
        try:
            for fname in os.listdir(self.projectsdir):
                if os.path.isdir(os.path.join(self.projectsdir, fname)):
                    yield fname
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def create_project(self, name):
        self.validate_project_name(name)
        project_filename = self.project_filename(name)
        os.makedirs(project_filename)
        with open(join(project_filename, 'project.json'), 'wb') as outf:
            outf.write('{}')

        with open(join(project_filename, 'scrapy.cfg'), 'w') as outf:
            outf.write(_SCRAPY_TEMPLATE)

        with open(join(project_filename, 'setup.py'), 'w') as outf:
            outf.write(_SETUP_PY_TEMPLATE % project_name)

        os.makedirs(join(project_filename, 'spiders'))

        with open(join(project_filename, 'spiders', '__init__.py'), 'w') as outf:
            outf.write('')

        with open(join(project_filename, 'spiders', 'settings.py'), 'w') as outf:
            outf.write(_SETTINGS_TEMPLATE)


    def rename_project(self, from_name, to_name):
        self.validate_project_name(from_name)
        self.validate_project_name(to_name)
        os.rename(self.project_filename(from_name),
            self.project_filename(to_name))

    def remove_project(self, name):
        shutil.rmtree(self.project_filename(name))

    def project_filename(self, name):
        return join(self.projectsdir, name)

    def validate_project_name(self, name):
        if not allowed_project_name(name):
            self.bad_request('invalid project name %s' % project)


class GitProjectsManager(ProjectsManager):

    def __init__(self, projectsdir, user, auth_projects, apikey):
        ProjectsManager.__init__(self, projectsdir, user, auth_projects, apikey)
        self.project_commands = {
            'create': self.create_project,
            'mv': self.rename_project,
            'rm': self.remove_project,
            'edit': self.edit_project,
            'publish': self.publish_project,
            'export': self.export_project,
            'discard': self.discard_changes,
            'revisions': self.project_revisions,
            'conflicts': self.conflicted_files,
            'changes': self.changed_files,
            'save': self.save_file,
    }

    def _open_repo(self, name):
        return Repoman.open_repo(name)

    def list_projects(self):
        #portia_projects = Repoman.list_repos()
        #dash_projects = map(str, dashclient.list_projects())
        #return sorted(set(portia_projects + dash_projects))
        return self.auth_projects

    def create_project(self, name):
        self.validate_project_name(name)
        Repoman.create_repo(name).save_file('project.json', '{}', 'master')

    def remove_project(self, name):
        Repoman.delete_repo(name)

    @run_in_thread
    def edit_project(self, name, revision):
        if Repoman.repo_exists(name):
            repoman = self._open_repo(name)
        else:
            repoman = dashclient.import_project(name, self.apikey)
        revision = repoman.get_branch(revision)
        if not repoman.has_branch(self.user):
            repoman.create_branch(self.user, revision)

    @run_in_thread
    def publish_project(self, name, force):
        repoman = self._open_repo(name)
        if repoman.publish_branch(self.user, force):
            repoman.delete_branch(self.user)
            return 'OK'
        else:
            return 'CONFLICT'

    @run_in_thread
    def export_project(self, name):
        dashclient.export_project(name, self.apikey)
        return 'OK'

    def discard_changes(self, name):
        self._open_repo(name).delete_branch(self.user)

    def project_revisions(self, name):
        repoman = self._open_repo(name)
        return json.dumps({ 'revisions': repoman.get_published_revisions() })

    @run_in_thread
    def conflicted_files(self, name):        
        repoman = self._open_repo(name)
        return json.dumps(repoman.get_branch_conflicted_files(self.user))

    @run_in_thread
    def changed_files(self, name):
        repoman = self._open_repo(name)
        return json.dumps(repoman.get_branch_changed_files(self.user))

    def save_file(self, name, file_path, file_contents):
        self._open_repo(name).save_file(file_path,
            json.dumps(file_contents, sort_keys=True, indent=4), self.user)
