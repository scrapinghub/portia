from __future__ import absolute_import
from .annotations import (list_annotations, get_annotation, create_annotation,
                          update_annotation, delete_annotation)
from .fields import (list_fields, get_field, create_field, update_field,
                     delete_field)
from .items import (list_items, get_item, create_item, update_item,
                    delete_item)
from .item_annotations import update_item_annotation
from .projects import (list_projects, get_project, create_project,
                       update_project, delete_project)
from .spiders import (list_spiders, get_spider, create_spider, update_spider,
                      delete_spider)
from .samples import (list_samples, get_sample, create_sample, update_sample,
                      delete_sample, get_sample_html)
from .schemas import (list_schemas, get_schema, create_schema, update_schema,
                      delete_schema)


class Route(object):
    __slots__ = ('path', 'get', 'post', 'patch', 'delete')

    def __init__(self, path, get=None, post=None, patch=None, delete=None):
        self.path = path
        self.get = get
        self.post = post
        self.patch = patch
        self.delete = delete

    @property
    def methods(self):
        return ('get', 'post', 'patch', 'delete')

    def __repr__(self):
        return 'Route(%s)' % str(self)

    def __str__(self):
        methods = '", "'.join(method.upper() for method in self.methods
                              if getattr(self, method) is not None)
        return 'path="%s", methods=["%s"]' % (self.path, methods or None)

annotations_list = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/'
    'annotations',
    get=list_annotations,
    post=create_annotation
)
annotation = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/'
    'annotations/{annotation_id}',
    get=get_annotation,
    patch=update_annotation,
    delete=delete_annotation
)
fields_list = Route(
    'projects/{project_id}/schemas/{schema_id}/fields',
    get=list_fields,
    post=create_field
)
field = Route(
    'projects/{project_id}/schemas/{schema_id}/fields/{field_id}',
    get=get_field,
    patch=update_field,
    delete=delete_field
)
items_list = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/items',
    get=list_items,
    post=create_item
)
item = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/items/'
    '{item_id}',
    get=get_item,
    patch=update_item,
    delete=delete_item
)
item_annotations = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/'
    'item_annotations/{annotation_id}',
    patch=update_item_annotation
)
projects_list = Route(
    'projects',
    get=list_projects,
    post=create_project
)
project = Route(
    'projects/{project_id}',
    get=get_project,
    patch=update_project,
    delete=delete_project
)
spiders_list = Route(
    'projects/{project_id}/spiders',
    get=list_spiders,
    post=create_spider
)
spider = Route(
    'projects/{project_id}/spiders/{spider_id}',
    get=get_spider,
    patch=update_spider,
    delete=delete_spider
)
samples_list = Route(
    'projects/{project_id}/spiders/{spider_id}/samples',
    get=list_samples,
    post=create_sample
)
sample = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}',
    get=get_sample,
    patch=update_sample,
    delete=delete_sample
)
sample_html = Route(
    'projects/{project_id}/spiders/{spider_id}/samples/{sample_id}/'
    'html',
    get=get_sample_html
)
schemas_list = Route(
    'projects/{project_id}/schemas',
    get=list_schemas,
    post=create_schema
)
schema = Route(
    'projects/{project_id}/schemas/{schema_id}',
    get=get_schema,
    patch=update_schema,
    delete=delete_schema
)
routes = [
    annotations_list,
    annotation,
    fields_list,
    field,
    items_list,
    item,
    item_annotations,
    projects_list,
    project,
    samples_list,
    sample,
    sample_html,
    schemas_list,
    schema,
    spiders_list,
    spider,
]
