import json
import re

from os.path import splitext, split, exists

from dulwich.errors import ObjectMissing

from slyd.projects import ProjectsManager
from slyd.errors import BadRequest

from storage.backends import ContentFile, GitStorage
from storage.repoman import Repoman

_SHA = re.compile('[a-f0-9]{7,40}')


def wrap_callback(connection, callback, manager, retries=0, **parsed):
    result = callback(**parsed)
    manager.commit_changes()
    return result


class GitProjectMixin(object):
    storage_class = GitStorage

    @classmethod
    def setup(cls, storage_backend, location):
        Repoman.setup(storage_backend)
        cls.base_dir = ''
        if exists(location):
            cls.base_dir = location

    def run(self, callback, **parsed):
        pool = getattr(Repoman, 'pool', None)
        if pool is None:
            return wrap_callback(None, callback, self, **parsed)
        return pool.runWithConnection(wrap_callback, callback, self, **parsed)

    def _project_name(self, name):
        if name is None:
            name = getattr(self, 'project_name')
        return name

    def _open_repo(self, name=None, read_only=False):
        if getattr(self, 'storage', None):
            return self.storage.repo
        branch, repo = self._get_branch_and_repo(None, read_only, name)
        self.storage = self.storage_class(repo, branch,
                                          commit=repo.last_commit,
                                          tree=repo.last_tree)
        return repo

    def _get_branch_and_repo(self, repo=None, read_only=False, name=None):
        if getattr(self, 'storage', None):
            return self.storage.branch, self.storage.repo
        if repo is None:
            repo = self._init_or_open_project(name)
        if repo.has_branch(self.user):
            return self.user, repo
        elif not read_only and self.user:
            repo.create_branch(self.user, repo.get_branch('master'))
            return self.user, repo
        else:
            return 'master', repo

    def _checkout_commit_or_head(self, name=None, commit_id=None,
                                 branch='master'):
        branch_name, repo = self._get_branch_and_repo(
            read_only=True, name=name)
        commit = None
        try:
            if commit_id:
                commit = repo._repo.get_object(commit_id)
            elif branch:
                branch_name = branch
                commit_id = repo.refs['refs/heads/%s' % branch_name]
                commit = repo._repo.get_object(commit_id)
        except (ValueError, ObjectMissing) as e:
            raise BadRequest(str(e))
        except KeyError as e:
            raise BadRequest('Could not find ref: %s' % e)
        self.storage = self.storage_class(repo, branch_name, commit=commit)

    def _get_branch(self, repo=None, read_only=False, name=None):
        return self._get_branch_and_repo(repo, read_only, name)[0]

    def _init_or_open_project(self, name):
        name = self._project_name(name)
        if not Repoman.repo_exists(name, self.connection):
            pm = getattr(self, 'pm', self)
            pm.create_project(name)
            if getattr(pm, 'storage', None):
                self.storage = pm.storage
                return self.storage.repo
        return Repoman.open_repo(self._project_name(name), self.connection,
                                 self.user)

    def list_spiders(self, name=None):
        self._open_repo(self._project_name(name), read_only=True)
        _, files = self.storage.listdir('spiders')
        return [splitext(split(f)[1])[0] for f in files
                if f.endswith(".json")]


class GitProjectsManager(GitProjectMixin, ProjectsManager):

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
        self.connection = None

    def all_projects(self):
        return [{'name': repo, 'id': repo}
                for repo in Repoman.list_repos(self.connection)]

    def create_project(self, name):
        self.validate_project_name(name)
        try:
            repo = Repoman.create_repo(name, self.connection, self.user)
        except NameError:
            raise BadRequest("Bad Request",
                             'A project already exists with the name "%s".'
                             % name)
        self.storage = self.storage_class(repo, 'master', tree=repo.last_tree,
                                          commit=repo.last_commit)
        super(GitProjectsManager, self).create_project(name)

    def project_filename(self, name):
        return name

    def remove_project(self, name):
        Repoman.delete_repo(name, self.connection)

    def publish_project(self, name, force):
        repoman = self._open_repo(name)
        if (repoman.publish_branch(self._get_branch(repoman),
                                   force=force) == True):
            repoman.delete_branch(self._get_branch(repoman))
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
        repoman.delete_branch(self._get_branch(repoman))

    def project_revisions(self, name):
        repoman = self._open_repo(name)
        return json.dumps({'revisions': repoman.get_published_revisions()})

    def conflicted_files(self, name):
        repoman = self._open_repo(name, read_only=True)
        branch = self._get_branch(repoman, read_only=True)
        conflicts = repoman.publish_branch(branch, dry_run=True)
        return json.dumps(conflicts if conflicts is not True else {})

    def changed_files(self, name):
        return json.dumps([
            fname or oldn for _, fname, oldn in self._changed_files(name)
        ])

    def _changed_files(self, name):
        repoman = self._open_repo(name, read_only=True)
        branch = self._get_branch(repoman, read_only=True)
        changes = repoman.get_branch_changed_entries(branch)
        return [
            (entry.type, entry.new.path, entry.old.path) for entry in changes
        ]

    def save_file(self, name, file_path, file_contents):
        self._open_repo(name)
        self.storage.save(file_path, ContentFile(
            json.dumps(file_contents, sort_keys=True, indent=4), file_path))

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

    def _get_project_name(self, _id):
        if 'project_data' in getattr(self.request, 'auth_info', {}):
            for project in self.request.auth_info['project_data']:
                if hasattr(project, 'get') and project.get('id') == _id:
                    return project.get('name') or _id
        return _id

    def _gen_etag(self, request_data):
        args = request_data.get('args')
        last_commit = self.storage._commit.id
        spiders = args[1] if len(args) > 1 and args[1] else []
        return (last_commit + '.' + '.'.join(spiders)).encode('utf-8')

    def _schedule_info(self, **kwargs):
        return {}
