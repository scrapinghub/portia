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
router.register(r'projects', ProjectRoute, base_name='projects')

project_router = NestedRouter(router, r'projects')
project_router.register(r'schemas', SchemaRoute, base_name='schemas')
project_router.register(r'spiders', SpiderRoute, base_name='spiders')
project_router.register(r'extractors', ExtractorRoute, base_name='extractors')

schema_router = NestedRouter(project_router, r'schemas')
schema_router.register(r'fields', FieldRoute, base_name='fields')

spider_router = NestedRouter(project_router, r'spiders')
spider_router.register(r'samples', SampleRoute, base_name='samples')

sample_router = NestedRouter(spider_router, r'samples')
sample_router.register(r'items', ItemRoute, base_name='items')
sample_router.register(r'annotations', AnnotationRoute, base_name='annotations')

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^', include(project_router.urls)),
    url(r'^', include(schema_router.urls)),
    url(r'^', include(spider_router.urls)),
    url(r'^', include(sample_router.urls)),
]
