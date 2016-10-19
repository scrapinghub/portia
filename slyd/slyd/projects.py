from __future__ import absolute_import
import errno
import re

from os.path import join
from portia_api.errors import BadRequest
from portia_api.utils.download import ProjectArchiver, CodeProjectArchiver

from storage.backends import ContentFile, FsStorage
from storage.projecttemplates import templates


# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_PROJECT_RE = re.compile('[^A-Za-z0-9._]|^\.*$')


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
        self.storage = self.storage_class('')
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

    def download_project(self, name, spiders=None, version=None, fmt=None,
                         **kwargs):
        storage = self.storage_class(self.project_filename(name))
        if fmt == u'code':
            archiver = CodeProjectArchiver(storage, name=name)
        else:
            archiver = ProjectArchiver(storage, name=name)
        return archiver.archive(spiders).read()
