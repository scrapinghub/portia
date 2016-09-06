from .route import JsonApiModelRoute
from portia_orm.models import Project, Extractor


class ExtractorRoute(JsonApiModelRoute):
    list_path = 'projects/{project_id}/extractors'
    detail_path = 'projects/{project_id}/extractors/{extractor_id}'
    default_model = Extractor

    def get_instance(self):
        return self.get_collection()[self.args.get('extractor_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.args.get('project_id'))
        return project.extractors
