from __future__ import absolute_import
import errno
import json
import os
import re

from os.path import join
from twisted.internet.defer import Deferred
from twisted.web.resource import NoResource
from twisted.web.server import NOT_DONE_YET
from .errors import BaseError, BaseHTTPError, BadRequest
from .projecttemplates import templates
from .resource import SlydJsonObjectResource, SlydJsonErrorPage
from .utils.copy import FileSystemSpiderCopier
from .utils.download import ProjectArchiver, CodeProjectArchiver
from .utils.storage import ContentFile, FsStorage


# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_PROJECT_RE = re.compile('[^A-Za-z0-9._]|^\.*$')


def create_projects_manager_resource(spec_manager):
    return ProjectsManagerResource(spec_manager)


class ProjectsManagerResource(SlydJsonObjectResource):

    def __init__(self, spec_manager):
        SlydJsonObjectResource.__init__(self)
        self.spec_manager = spec_manager

    def getChildWithDefault(self, project_path_element, request):
        auth_info = request.auth_info
        if ('authorized_projects' not in auth_info or
                auth_info.get('staff', False) or
                project_path_element in auth_info['authorized_projects']):
            request.project = project_path_element
            try:
                next_path_element = request.postpath.pop(0)
            except IndexError:
                next_path_element = 'spec'
            if next_path_element not in self.children:
                raise NoResource("No such child resource.")
            request.prepath.append(project_path_element)
            return self.children[next_path_element]
        else:
            return SlydJsonErrorPage(
                403, "Forbidden", "You don't have access to this project.")

    def handle_project_command(self, projects_manager, command_spec):
        command = command_spec.get('cmd')
        dispatch_func = projects_manager.project_commands.get(command)
        if dispatch_func is None:
            self.bad_request(
                "Unrecognised command %s, available commands: %s." %
                (command, ', '.join(projects_manager.project_commands.keys())))
        args = command_spec.get('args', [])
        try:
            retval = dispatch_func(*args)
        except TypeError:
            self.bad_request("Incorrect arguments for command %s." % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                self.not_found()
            elif ex.errno == errno.EEXIST or ex.errno == errno.ENOTEMPTY:
                self.bad_request("A project with that name already exists.")
            raise
        except BaseError as ex:
            self.error(ex.status, ex.title, ex.body)
        else:
            return retval or ''
        return ''

    def render_GET(self, request):
        auth_info = request.auth_info
        project_manager = self.spec_manager.project_manager(auth_info)
        projects = project_manager.list_projects()
        for project in projects:
            project_spec = self.spec_manager.project_spec(project['id'], auth_info)
            project['spiders'] = list(project_spec.list_spiders())

        return {
            "projects": projects
        }


    def render_POST(self, request):

        def finish_request(val):
            if modifier:
                val = modifier(request, obj, val)
            val and request.write(val)
            request.finish()

        def request_failed(failure):
            request.setResponseCode(500)
            request.write(failure.getErrorMessage())
            request.finish()
            return failure

        project_manager = self.spec_manager.project_manager(request.auth_info)
        project_manager.request = request
        obj = self.read_json(request)
        try:
            retval = self.handle_project_command(project_manager, obj)
            modifier = project_manager.modify_request.get(obj.get('cmd'))
            if isinstance(retval, Deferred):
                retval.addCallbacks(finish_request, request_failed)
                return NOT_DONE_YET
            else:
                if modifier:
                    retval = modifier(request, obj, retval)
                return retval
        except BaseHTTPError as ex:
            self.error(ex.status, ex.title, ex.body)


def allowed_project_name(name):
    return not _INVALID_PROJECT_RE.search(name)


class ProjectsManager(object):

    @classmethod
    def setup(cls, location, **kwargs):
        cls.base_dir = location

    def __init__(self, auth_info):
        self.auth_info = auth_info
        self.user = auth_info['username']
        self.modify_request = {
            'download': self._render_file
        }
        self.project_commands = {
            'create': self.create_project,
            'mv': self.rename_project,
            'rm': self.remove_project,
            'copy': self.copy_data,
            'download': self.download_project
        }

    def run(self, callback, **kwargs):
        return callback(**kwargs)

    def all_projects(self):
        raise NotImplementedError

    def list_projects(self):
        if 'authorized_projects' in self.auth_info:
            return self.auth_info['authorized_projects']
        else:
            return list(self.all_projects())

    def create_project(self, name):
        self.validate_project_name(name)
        project_filename = self.project_filename(name)
        project_files = {
            'project.json': templates['PROJECT'],
            'scrapy.cfg': templates['SCRAPY'],
            'setup.py': templates['SETUP'] % str(name),
            'items.json': templates['ITEMS'],
            join('spiders', '__init__.py'): '',
            join('spiders', 'settings.py'): templates['SETTINGS'],
        }
        for filename, template in project_files.items():
            path = join(project_filename, filename)
            self.storage.save(path, ContentFile(template, path))

    def rename_project(self, from_name, to_name):
        self.validate_project_name(from_name)
        self.validate_project_name(to_name)
        self.storage.move(self.project_filename(from_name),
                          self.project_filename(to_name))

    def remove_project(self, name):
        self.storage.rmtree(self.project_filename(name))

    def edit_project(self, name, revision=None):
        # Do nothing here, but subclasses can use this method as a hook
        # e.g. to import projects from another source.
        return

    def validate_project_name(self, name):
        if not allowed_project_name(name):
            raise BadRequest('Bad Request', 'Invalid project name %s.' % name)

    def copy_data(self, source, destination, spiders, items):
        raise NotImplementedError

    def download_project(self, name, spiders=None, version=None, **kwargs):
        raise NotImplementedError

    def commit_changes(self):
        if getattr(self, 'storage', None):
            self.storage.commit()

    def _render_file(self, request, request_data, body):
        name = request_data.get('args')[0].encode('utf-8')
        request.setHeader('Content-Type', 'application/zip')
        request.setHeader('Content-Disposition', 'attachment; '
                          'filename="%s.zip"' % name)
        request.setHeader('Content-Length', len(body))
        return body

    def __repr__(self):
        return '%s(%s)' % (self.__class__.__name__, str(self))

    def __str__(self):
        return '%s' % self.user


class FileSystemProjectsManager(ProjectsManager):
    storage_class = FsStorage
    basedir = '.'

    def __init__(self, auth_info):
        super(FileSystemProjectsManager, self).__init__(auth_info)
        self.storage = self.storage_class(self.base_dir)
        self.projectsdir = self.base_dir

    def all_projects(self):
        try:
            dirs, _ = self.storage.listdir(self.projectsdir)
            return [{'id': project, 'name': project}for project in dirs]
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def project_filename(self, name):
        return join(self.projectsdir, name)

    def copy_data(self, source, destination, spiders, items):
        copier = FileSystemSpiderCopier(source, destination, self.projectsdir)
        return json.dumps(copier.copy(spiders, items))

    def download_project(self, name, spiders=None, version=None, fmt=None,
                         **kwargs):
        storage = self.storage_class(self.project_filename(name))
        if fmt == u'code':
            archiver = CodeProjectArchiver(storage, name=name)
        else:
            archiver = ProjectArchiver(storage, name=name)
        return archiver.archive(spiders).read()
