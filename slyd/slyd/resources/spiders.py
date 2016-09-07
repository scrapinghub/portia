from collections import OrderedDict
from .projects import ProjectDataMixin, ProjectDownloadMixin
from .response import JsonApiResource
from .route import JsonApiModelRoute
from ..orm.models import Project, Spider


class SpiderRoute(ProjectDownloadMixin, ProjectDataMixin, JsonApiModelRoute):
    list_path = 'projects/{project_id}/spiders'
    detail_path = 'projects/{project_id}/spiders/{spider_id}'
    download_path = 'projects/{project_id}/download/{spider_id}'
    schedule_path = 'projects/{project_id}/spiders/{spider_id}/schedule'
    default_model = Spider

    @classmethod
    def get_resources(cls):
        for resource in super(SpiderRoute, cls).get_resources():
            yield resource
        yield 'post', cls.schedule_path

    def get_handler(self):
        if self.route_path == self.schedule_path:
            return self.schedule
        return super(SpiderRoute, self).get_handler()

    def schedule(self):
        self.project_spec.schedule(self.args.get('spider_id'), self.query)
        response = self.retrieve()
        data = OrderedDict()
        data.update({
            'meta': {
                'scheduled': True
            }
        })
        data.update(response.data)
        return JsonApiResource(200, data)

    def get_instance(self):
        return self.get_collection()[self.args.get('spider_id')]

    def get_collection(self):
        project = Project(
            self.storage, **self.projects[self.args.get('project_id')])
        return project.spiders
