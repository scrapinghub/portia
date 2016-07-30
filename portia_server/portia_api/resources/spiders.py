from .projects import ProjectDataMixin, ProjectDownloadMixin
from .route import JsonApiModelRoute
from portia_orm.models import Project, Spider


class SpiderRoute(ProjectDownloadMixin, ProjectDataMixin, JsonApiModelRoute):
    lookup_url_kwarg = 'spider_id'
    lookup_value_regex = '[^/]+'
    default_model = Spider

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('spider_id')]

    def get_collection(self):
        project = Project(
            self.storage, **self.projects[self.kwargs.get('project_id')])
        return project.spiders
