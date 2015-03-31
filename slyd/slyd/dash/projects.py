import json

from slyd.gitstorage.repoman import Repoman
from slyd.gitstorage.projects import GitProjectsManager, run_in_thread
from .dashclient import (import_project, package_project, deploy_project,
                         set_dash_url, DeployError)


class ProjectsManager(GitProjectsManager):

    @classmethod
    def setup(cls, storage_backend, location, dash_url):
        GitProjectsManager.setup(storage_backend, location)
        set_dash_url(dash_url)

    def __init__(self, *args, **kwargs):
        GitProjectsManager.__init__(self, *args, **kwargs)
        self.project_commands['deploy'] = self.deploy_project
        self.project_commands['download'] = self.download_project
        self.modify_request['download'] = self._render_file

    def list_projects(self):
        if 'projects_data' in self.auth_info:
            return self.auth_info['projects_data']
        elif 'authorized_projects' in self.auth_info:
            return self.auth_info['authorized_projects']

    @run_in_thread
    def edit_project(self, name, revision):
        if not Repoman.repo_exists(name):
            repo = Repoman.create_repo(name, author=self.user)
            import_project(name, self.auth_info['service_token'], repo)
        return GitProjectsManager.edit_project(self, name, revision)

    @run_in_thread
    def publish_project(self, name, force):
        repoman = self._open_repo(name)
        if repoman.publish_branch(self._get_branch(repoman), force,
                                  dry_run=True):
            files = self._changed_files(name)
            if isinstance(files, str):
                files = json.loads(files)
            response = self._deploy_project(name, files, repoman,
                                            self._get_branch(repoman, name))
            return json.dumps(response)
        else:
            return json.dumps({'status': 'conflict'})

    @run_in_thread
    def deploy_project(self, name):
        return deploy_project(name, self.auth_info['service_token'])

    def _deploy_project(self, name, files, repoman=None, branch='master'):
        try:
            data = deploy_project(name, self.auth_info['service_token'],
                                  changed_files=files, repo=repoman,
                                  branch=branch)
            if repoman is not None and data['status'] != 'error':
                repoman.publish_branch(branch, force=True)
                if branch != 'master':
                    repoman.kill_branch(branch)
        except DeployError as e:
            data = e.data
        return data

    @run_in_thread
    def download_project(self, name, spiders=[]):
        if (self.auth_info.get('staff') or
                name in self.auth_info['authorized_projects']):
            return package_project(name, spiders).read()
        return json.dumps({'status': 404,
                           'error': 'Project "%s" not found' % name})

    def _render_file(self, request, request_data, body):
        if isinstance(body, basestring):
            error = json.loads(body)
            if error.get('status', 0) == 404:
                request.setResponseCode(404)
                request.setHeader('Content-Type', 'application/json')
        else:
            try:
                id = request_data.get('args')[0]
                name = self._get_project_name(id).encode('utf-8')
            except (TypeError, ValueError, IndexError):
                name = 'archive'
            request.setHeader('Content-Type', 'application/zip')
            request.setHeader('Content-Disposition', 'attachment; '
                              'filename="%s.zip"' % name)
        return request

    def _get_project_name(self, id):
        if not id:
            raise ValueError('Need id to find project Name')
        if id in self.auth_info['authorized_projects']:
            for project in self.auth_info['projects_data']:
                if project['id'] == id:
                    return project['name']
        else:
            return id
