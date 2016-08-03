from .projects import BaseProjectModelRoute
from portia_orm.models import Extractor


class ExtractorRoute(BaseProjectModelRoute):
    lookup_url_kwarg = 'extractor_id'
    default_model = Extractor

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('extractor_id')]

    def get_collection(self):
        return self.project.extractors
