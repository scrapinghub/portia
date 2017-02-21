from slyd.projectspec import ProjectSpec
from slyd.gitstorage.projects import GitProjectMixin


class GitProjectSpec(GitProjectMixin, ProjectSpec):
    def _schedule_data(self, spider, args):
        branch = args.pop('branch', [None])[0]
        commit = args.pop('commit_id', [None])[0]
        project = self.project_name
        arg = {}
        if commit:
            arg['commit'] = commit
        elif branch:
            arg['branch'] = branch
        if not arg and self.storage.repo.has_branch(self.user):
            arg['branch'] = self.user
        self._checkout_commit_or_head(project, **arg)
        commit_id = self.storage._commit.id
        return {
            'project': self.project_name,
            'version': commit_id,
            'spider': spider
        }
