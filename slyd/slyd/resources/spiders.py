from .projects import ProjectDataMixin, ProjectDownloadMixin
from .route import JsonApiModelRoute
from ..orm.models import Project, Spider


class SpiderRoute(ProjectDownloadMixin, ProjectDataMixin, JsonApiModelRoute):
    list_path = 'projects/{project_id}/spiders'
    detail_path = 'projects/{project_id}/spiders/{spider_id}'
    download_path = 'projects/{project_id}/download/{spider_id}'
    default_model = Spider

    def get_instance(self):
        return self.get_collection()[self.args.get('spider_id')]

    def get_collection(self):
        project = Project(
            self.storage, **self.projects[self.args.get('project_id')])
        return project.spiders
