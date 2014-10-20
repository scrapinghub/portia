from slyd.gitstorage.projects import GitProjectsManager, run_in_thread, Repoman
from .dashclient import import_project, export_project


class ProjectsManager(GitProjectsManager):

    def __init__(self, projectsdir, auth_info):
        GitProjectsManager.__init__(self, projectsdir, auth_info)
        self.project_commands['export'] = self.export_project

    @run_in_thread
    def edit_project(self, name, revision):
        if not Repoman.repo_exists(name):
            import_project(name, self.auth_info['service_token'])
        GitProjectsManager.edit_project(self, name, revision)

    @run_in_thread
    def export_project(self, name):
        export_project(name, self.auth_info['service_token'])
        return 'OK'
