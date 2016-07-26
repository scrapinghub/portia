from slyd.projectspec import ProjectSpec
from slyd.gitstorage.projects import GitProjectMixin


class GitProjectSpec(GitProjectMixin, ProjectSpec):
    pass
