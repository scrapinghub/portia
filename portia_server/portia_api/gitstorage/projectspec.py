from slyd.projectspec import ProjectSpec
from .projects import GitProjectMixin


class GitProjectSpec(GitProjectMixin, ProjectSpec):
    pass
