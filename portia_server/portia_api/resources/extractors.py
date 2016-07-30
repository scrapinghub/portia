from .route import JsonApiModelRoute
from portia_orm.models import Project, Extractor


class ExtractorRoute(JsonApiModelRoute):
    lookup_url_kwarg = 'extractor_id'
    default_model = Extractor

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('extractor_id')]

    def get_collection(self):
        project = Project(self.storage, id=self.kwargs.get('project_id'))
        return project.extractors
