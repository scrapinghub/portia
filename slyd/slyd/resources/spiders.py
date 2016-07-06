from .projects import ProjectDataMixin, ProjectDownloadMixin
from .route import (JsonApiRoute, ListModelMixin, RetrieveModelMixin,
                    CreateModelMixin, UpdateModelMixin, DestroyModelMixin)
from .serializers import SpiderSchema
from ..orm.models import Project


class SpiderRoute(ProjectDownloadMixin, JsonApiRoute, ProjectDataMixin,
                  ListModelMixin, RetrieveModelMixin, CreateModelMixin,
                  UpdateModelMixin, DestroyModelMixin):
    list_path = 'projects/{project_id}/spiders'
    detail_path = 'projects/{project_id}/spiders/{spider_id}'
    download_path = 'projects/{project_id}/download/{spider_id}'
    serializer_class = SpiderSchema

    def perform_destroy(self, instance):
        project = Project(self.storage, id=self.args.get('project_id'))
        project.schemas  # preload schemas and fields
        return super(SpiderRoute, self).perform_destroy(instance)

    def get_instance(self):
        return self.get_collection()[self.args.get('spider_id')]

    def get_collection(self):
        project = Project(
            self.storage, **self.projects[self.args.get('project_id')])
        return project.spiders
