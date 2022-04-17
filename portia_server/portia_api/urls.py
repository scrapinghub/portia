from django.conf.urls import url, include

from .routers import Router, NestedRouter
from .resources.annotations import AnnotationRoute
from .resources.extractors import ExtractorRoute
from .resources.fields import FieldRoute
from .resources.items import ItemRoute
from .resources.projects import ProjectRoute
from .resources.samples import SampleRoute
from .resources.schemas import SchemaRoute
from .resources.spiders import SpiderRoute

router = Router()
router.register(r'projects', ProjectRoute, basename='projects')

project_router = NestedRouter(router, r'projects')
project_router.register(r'schemas', SchemaRoute, basename='schemas')
project_router.register(r'spiders', SpiderRoute, basename='spiders')
project_router.register(r'extractors', ExtractorRoute, basename='extractors')

schema_router = NestedRouter(project_router, r'schemas')
schema_router.register(r'fields', FieldRoute, basename='fields')

spider_router = NestedRouter(project_router, r'spiders')
spider_router.register(r'samples', SampleRoute, basename='samples')

sample_router = NestedRouter(spider_router, r'samples')
sample_router.register(r'items', ItemRoute, basename='items')
sample_router.register(r'annotations', AnnotationRoute, basename='annotations')

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^', include(project_router.urls)),
    url(r'^', include(schema_router.urls)),
    url(r'^', include(spider_router.urls)),
    url(r'^', include(sample_router.urls)),
]
