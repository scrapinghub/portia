import contextlib
import json
import sys

from os.path import splitext, split, join, sep

from twisted.enterprise.adbapi import ConnectionLost

from slyd.projects import ProjectsManager
from slyd.projecttemplates import templates
from slyd.errors import BadRequest
from .repoman import Repoman
from slyd.utils.copy import GitSpiderCopier
from slyd.utils.download import GitProjectArchiver

try:
    from MySQLdb import DataBaseError
    ERRORS = (DataBaseError, IOError)
except ImportError:
    ERRORS = IOError,
RETRIES = 3


def wrap_callback(connection, callback, manager, retries=0, **parsed):
    try:
        manager.connection = connection
        if hasattr(manager, 'pm'):
            manager.pm.connection = connection
        if connection is None:
            result = callback(manager, **parsed)
            if manager._changed_file_data:
                manager.commit_changes()
            return result
        for _ in range(RETRIES):
                with transaction(manager):
                    return callback(manager, **parsed)
    except ConnectionLost:  # ConnectionLost only triggerd by mysql backend
        if retries < RETRIES:
            return connection._pool._runWithConnection(
                wrap_callback, callback, manager, retries + 1, **parsed)
    exc_type, exc_value, exc_traceback = sys.exc_info()
    raise exc_type, exc_value, exc_traceback


@contextlib.contextmanager
def transaction(manager):
    try:
        yield
        if manager._changed_file_data:
            manager.commit_changes()
    except ERRORS:
        manager.connection.rollback()
    except Exception:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        manager.connection.rollback()
        raise exc_type, exc_value, exc_traceback


class GitProjectMixin(object):
    def run(self, callback, **parsed):
        pool = getattr(Repoman, 'pool', None)
        if pool is None:
            return wrap_callback(None, callback, self, **parsed)
        return pool.runWithConnection(wrap_callback, callback, self, **parsed)

    def _project_name(self, name):
        if name is None:
            name = getattr(self, 'project_name')
        return name

    def _open_repo(self, name=None):
        return Repoman.open_repo(self._project_name(name), self.connection,
                                 self.user)

    def _get_branch(self, repo=None, read_only=False, name=None):
        if repo is None:
            repo = self._open_repo(name)
        if repo.has_branch(self.user):
            return self.user
        elif not read_only:
            repo.create_branch(self.user, repo.get_branch('master'))
            return self.user
        else:
            return 'master'

    def list_spiders(self, name=None):
        repoman = self._open_repo(self._project_name(name))
        files = repoman.list_files_for_branch(self._get_branch(repoman,
                                                               read_only=True))
        return [splitext(split(f)[1])[0] for f in files
                if f.startswith("spiders") and f.count(sep) == 1
                and f.endswith(".json")]


class GitProjectsManager(GitProjectMixin, ProjectsManager):

    @classmethod
    def setup(cls, storage_backend, location):
        Repoman.setup(storage_backend, location)

    def __init__(self, *args, **kwargs):
        ProjectsManager.__init__(self, *args, **kwargs)
        self.project_commands = {
            'create': self.create_project,
            'mv': self.rename_project,
            'rm': self.remove_project,
            'edit': self.edit_project,
            'publish': self.publish_project,
            'discard': self.discard_changes,
            'revisions': self.project_revisions,
            'conflicts': self.conflicted_files,
            'changes': self.changed_files,
            'save': self.save_file,
            'copy': self.copy_data,
            'download': self.download_project,
            'has_tag': self.has_tag
        }
        self.modify_request = {
            'download': self._render_file
        }
        self._changed_file_data = {}

    def all_projects(self):
        return [{'name': repo, 'id': repo}
                for repo in Repoman.list_repos(self.connection)]

    def create_project(self, name):
        self.validate_project_name(name)
        project_files = {
            'project.json': templates['PROJECT'],
            'scrapy.cfg': templates['SCRAPY'],
            'setup.py': templates['SETUP'] % str(name),
            join('spiders', '__init__.py'): '',
            join('spiders', 'settings.py'): templates['SETTINGS'],
        }
        try:
            Repoman.create_repo(name, self.connection).save_files(
                project_files, 'master'
            )
        except NameError:
            raise BadRequest("Bad Request",
                             'A project already exists with the name "%s".'
                             % name)

    def remove_project(self, name):
        Repoman.delete_repo(name, self.connection)

    def edit_project(self, name, revision):
        # Do nothing here, but subclasses can use this method as a hook
        # e.g. to import projects from another source.
        return

    def publish_project(self, name, force):
        repoman = self._open_repo(name)
        if (repoman.publish_branch(self._get_branch(repoman),
                                   force=force) == True):
            repoman.kill_branch(self._get_branch(repoman))
            return {'status': 'ok'}
        else:
            return {'status': 'conflict'}

    def has_tag(self, name, tag_name):
        return json.dumps({'status': self._has_tag(name, tag_name)})

    def _has_tag(self, name, tag_name):
        repo = self._open_repo(name)
        if ('refs/tags/%s' % tag_name) in repo._repo.refs:
            return True
        return False

    def discard_changes(self, name):
        repoman = self._open_repo(name)
        repoman.kill_branch(self._get_branch(repoman))

    def project_revisions(self, name):
        repoman = self._open_repo(name)
        return json.dumps({'revisions': repoman.get_published_revisions()})

    def conflicted_files(self, name):
        repoman = self._open_repo(name)
        branch = self._get_branch(repoman, read_only=True)
        conflicts = repoman.publish_branch(branch, dry_run=True)
        return json.dumps(conflicts if conflicts is not True else {})

    def changed_files(self, name):
        return json.dumps([
            fname or oldn for _, fname, oldn in self._changed_files(name)
        ])

    def _changed_files(self, name):
        repoman = self._open_repo(name)
        branch = self._get_branch(repoman, read_only=True)
        changes = repoman.get_branch_changed_entries(branch)
        return [
            (entry.type, entry.new.path, entry.old.path) for entry in changes
        ]

    def save_file(self, name, file_path, file_contents):
        repoman = self._open_repo(name)
        repoman.save_file(file_path, json.dumps(
            file_contents,
            sort_keys=True, indent=4), self._get_branch(repoman))

    def copy_data(self, source, destination, spiders, items):
        source = self._open_repo(source)
        branch = self._get_branch(source)
        destination = self._open_repo(destination)
        copier = GitSpiderCopier(source, destination, branch)
        return json.dumps(copier.copy(spiders, items))

    def download_project(self, name, spiders=None, version=None):
        if version is None:
            version = (0, 9)
        else:
            version = tuple(version)
        if (self.auth_info.get('staff') or
                ('authorized_projects' in self.auth_info and
                 name in self.auth_info['authorized_projects'])):
            request = self.request
            etag_str = (request.getHeader('If-None-Match') or '').split(',')
            etags = [etag.strip() for etag in etag_str]
            if self._gen_etag({'args': [name, spiders]}) in etags:
                return ''
            branch = self._get_branch(name=name, read_only=True)
            return GitProjectArchiver(Repoman.open_repo(name, self.connection),
                                      version=version,
                                      branch=branch).archive(spiders).read()
        return json.dumps({'status': 404,
                           'error': 'Project "%s" not found' % name})

    def _render_file(self, request, request_data, body):
        if len(body) == 0:
            request.setHeader('ETag', self._gen_etag(request_data))
            request.setResponseCode(304)
            return ''
        try:
            error = json.loads(body)
            if error.get('status', 0) == 404:
                request.setResponseCode(404)
                request.setHeader('Content-Type', 'application/json')
        except (TypeError, ValueError):
            try:
                _id = request_data.get('args')[0]
                name = self._get_project_name(_id).encode('utf-8')
            except (TypeError, ValueError, IndexError):
                name = 'archive'
            request.setHeader('ETag', self._gen_etag(request_data))
            request.setHeader('Content-Type', 'application/zip')
            request.setHeader('Content-Disposition', 'attachment; '
                              'filename="%s.zip"' % name)
            request.setHeader('Content-Length', len(body))
        return body

    def _gen_etag(self, request_data):
        args = request_data.get('args')
        _id = args[0]
        last_commit = self._open_repo(_id).refs['refs/heads/master']
        spiders = args[1] if len(args) > 1 and args[1] else []
        return (last_commit + '.' + '.'.join(spiders)).encode('utf-8')

    def _schedule_info(self, **kwargs):
        return {}
