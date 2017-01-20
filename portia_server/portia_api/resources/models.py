from itertools import chain

from marshmallow_jsonapi import Schema, fields
from marshmallow import pre_dump, post_load


class SlydSchema(Schema):
    _properties = ('project', 'spider', 'schema', 'item', 'sample', 'field')

    @staticmethod
    def empty_data():
        return {
            'meta': {}
        }

    def __init__(self, *args, **kwargs):
        self._skip_relationships = kwargs.pop('skip_relationships', False)
        if self._skip_relationships:
            relationships = ((f, '%s_id' % f) for f in self._properties)
            exclude = kwargs.get('exclude', [])
            excluded = tuple(chain(exclude, *zip(*relationships)))
            kwargs['exclude'] = excluded
        super(SlydSchema, self).__init__(*args, **kwargs)

    @property
    def project_id(self):
        return self.context.get('project_id')

    @property
    def spider_id(self):
        return self.context.get('spider_id')

    @property
    def sample_id(self):
        return self.context.get('sample_id')

    @property
    def schema_id(self):
        return self.context.get('schema_id')

    @property
    def item_id(self):
        return self.context.get('item_id')

    @property
    def field_id(self):
        return self.context.get('field_id')

    @pre_dump
    def _dump_relationship_properties(self, item):
        if getattr(self, '_skip_relationships', False):
            return item
        for attr in self._properties:
            _id = '_'.join((attr, 'id'))
            if _id not in item or item['id'] is None:
                item[_id] = getattr(self, _id)
            else:
                self.context[_id] = item[_id]
            if item.get(attr) is None and item[_id]:
                item[attr] = {'id': item[_id]}
        return item


class ProjectSchema(SlydSchema):
    id = fields.Str(load_from='name')
    name = fields.Str()
    spiders = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders',
        related_url_kwargs={'project_id': '<id>'}, type_='spiders',
        include_resource_linkage=True, many=True
    )
    schemas = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas',
        related_url_kwargs={'project_id': '<id>'}, type_='schemas',
        include_resource_linkage=True, many=True
    )
    extractors = fields.Relationship(
        related_url='/api/projects/{project_id}/extractors',
        related_url_kwargs={'project_id': '<id>'}, type_='extractors',
        include_resource_linkage=True, many=True
    )
    project = fields.Relationship(
        self_url='/api/projects/{project_id}',
        self_url_kwargs={'project_id': '<id>'}, type_='projects'
    )

    class Meta:
        type_ = 'projects'


class SchemaSchema(SlydSchema):
    id = fields.Str(dump_only=True)
    name = fields.Str()
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'},
        type_='projects',
        include_resource_linkage=True
    )
    fields = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}/fields',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<id>'},
        many=True, include_resource_linkage=True, type_='fields'
    )

    class Meta:
        type_ = 'schemas'


class FieldSchema(SlydSchema):
    id = fields.Str()
    name = fields.Str()
    type = fields.Str()
    vary = fields.Boolean(default=False)
    required = fields.Boolean(default=False)

    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'},
        type_='projects',
        include_resource_linkage=True
    )
    schema = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>'},
        type_='schema',
        include_resource_linkage=True
    )

    class Meta:
        type_ = 'fields'


class SpiderSchema(SlydSchema):
    id = fields.Str(dump_only=True, load_from='name')
    name = fields.Str()
    start_urls = fields.List(fields.Str(), default=[])
    links_to_follow = fields.Str(default='patterns')
    follow_patterns = fields.List(fields.Str(), default=[])
    exclude_patterns = fields.List(fields.Str(), default=[])
    js_enabled = fields.Boolean(default=False)
    js_enable_patterns = fields.List(fields.Str(), default=[])
    js_disable_patterns = fields.List(fields.Str(), default=[])
    respect_nofollow = fields.Boolean(default=True)
    allowed_domains = fields.List(fields.Str(), default=[])
    login_url = fields.Str()
    login_user = fields.Str()
    login_password = fields.Str()
    perform_login = fields.Boolean(default=False)
    samples = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>'},
        many=True, include_resource_linkage=True, type_='samples'
    )
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'},
        type_='projects',
        include_resource_linkage=True
    )

    @pre_dump
    def _dump_login_data(self, item):
        init_requests = item.pop('init_requests', None)
        if init_requests:
            login_request = init_requests[0]
            item['login_url'] = login_request['loginurl']
            item['login_user'] = login_request['username']
            item['login_password'] = login_request['password']
        return item

    @post_load
    def _load_login_data(self, item):
        fields = ('login_url', 'login_user', 'login_password')
        if all(field in item and item[field] for field in fields):
            item['init_requests'] = [{
                'type': 'login',
                'loginurl': item.pop('login_url'),
                'username': item.pop('login_user'),
                'password': item.pop('login_password')
            }]
        for field in fields:
            item.pop(field, None)
        return item

    class Meta:
        type_ = 'spiders'


class SampleSchema(SlydSchema):
    id = fields.Str(dump_only=True)
    name = fields.Str()
    url = fields.Str(required=True)
    page_id = fields.Str()
    page_type = fields.Str(default='item')
    scrapes = fields.Str()
    extractors = fields.Dict(default={})
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'},
        type_='projects', include_resource_linkage=True
    )
    spider = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders/{spider_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>'},
        type_='spiders', include_resource_linkage=True
    )
    original_body = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/original_body',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<id>'},
        type_='html', include_resource_linkage=False
    )
    rendered_body = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/rendered_body',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<id>'},
        type_='html', include_resource_linkage=False
    )
    items = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/items',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<id>'},
        type_='items', many=True, include_resource_linkage=True
    )

    def dump(self, obj, many=None, update_fields=True, **kwargs):
        many = self.many if many is None else bool(many)
        if many:
            for o in obj:
                o.setdefault('items', [])
        else:
            obj.setdefault('items', [])
        return super(SampleSchema, self).dump(obj, many, update_fields,
                                              **kwargs)

    class Meta:
        type_ = 'samples'


class BaseAnnotationSchema(SlydSchema):
    id = fields.Str()
    attribute = fields.Str(required=True)
    accept_selectors = fields.List(fields.Str(), default=[])
    reject_selectors = fields.List(fields.Str(), default=[])
    tagid = fields.Integer(required=True)
    text_content = fields.Str()
    selector = fields.Str()

    sample = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders/{spider_id}/samples/'
                    '{sample_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id>'},
        type_='samples',
        include_resource_linkage=True
    )
    parent = fields.Relationship(
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id>',
                            'item_id': '<parent_id>'},
        type_='items', include_resource_linkage=True
    )

    @property
    def parent_id(self):
        return self.context.get('container_id', self.item_id)

    @pre_dump
    def _dump_parent_id(self, item):
        parent_id = None
        if 'parent' in item:
            parent_id = item['parent']['id']
        if not parent_id:
            parent_id = item.get('container_id', self.parent_id) or ''
        if (item['id'].split('#')[0] == parent_id or
                parent_id.split('#')[0] == item['id']):
            item.pop('parent', None)
            item.pop('parent_id', None)
            return
        if parent_id:
            item['parent'] = {'id': parent_id}
        if parent_id and item.get('parent_id') is None:
            item['parent_id'] = parent_id


class AnnotationSchema(BaseAnnotationSchema):
    required = fields.Boolean(default=False)
    ignore = fields.Boolean(default=False)
    ignore_beneath = fields.Boolean(default=False)
    variant = fields.Integer(default=False)
    slice = fields.List(fields.Integer())
    pre_text = fields.Str()
    post_text = fields.Str()
    selection_mode = fields.Str()

    field = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}/fields/'
                    '{field_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>',
                            'field_id': '<field.id>'},
        type_='fields', include_resource_linkage=True
    )
    extractors = fields.Relationship(
        related_url='/api/projects/{project_id}/extractors',
        related_url_kwargs={'project_id': '<project_id>'},
        many=True, include_resource_linkage=True, type_='extractors'
    )

    class Meta:
        type_ = 'annotations'


class ItemAnnotationSchema(BaseAnnotationSchema):
    item_container = fields.Boolean(default=True)
    container_id = fields.Str()
    repeated = fields.Boolean()
    repeated_container_id = fields.Str(dump_only=True)
    repeated_accept_selectors = fields.Str(dump_only=True)
    siblings = fields.Integer()
    parent_field = fields.Str()
    schema = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>'},
        type_='schemas', include_resource_linkage=True
    )

    class Meta:
        type_ = 'item_annotations'


class ExtractorSchema(SlydSchema):
    id = fields.Str()
    type = fields.Str()
    value = fields.Str()
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'},
        type_='projects',
        include_resource_linkage=True
    )

    @pre_dump
    def _dump_extractor_attributes(self, item):
        if 'type' not in item:
            item['type'] = 'type' if 'type_extractor' in item else 'regex'
        if 'value' not in item:
            item['value'] = item['type_extractor'] if item['type'] == 'type' \
                else item['regular_expression']
        return item

    class Meta:
        type_ = 'extractors'


class HtmlSchema(SlydSchema):
    id = fields.Str()
    html = fields.Str()

    class Meta:
        type_ = 'html'


class RenderedBody(SlydSchema):
    id = fields.Str()
    html = fields.Str()

    class Meta:
        type_ = 'rendered-bodys'


class OriginalBody(SlydSchema):
    id = fields.Str()
    html = fields.Str()

    class Meta:
        type_ = 'original-bodys'


class ItemSchema(SlydSchema):
    """Instance of a schema. Meta item built from sample."""
    id = fields.Str()
    sample = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id>'},
        include_resource_linkage=True, type_='samples'
    )
    schema = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>'},
        type_='schemas', include_resource_linkage=True
    )
    annotations = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/items/{item_id}/annotations',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id>',
                            'item_id': '<id>'},
        many=True, include_resource_linkage=True, type_='annotations'
    )
    item_annotation = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/items/{item_id}/item_annotation',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id>',
                            'item_id': '<id>'},
        include_resource_linkage=True, type_='item_annotations'
    )
    parent = fields.Relationship(type_='items', include_resource_linkage=True)

    @pre_dump
    def _dump_parent_id(self, item):
        parent_id = item.get('container_id') or ''
        if parent_id:
            item['parent'] = {'id': parent_id}
        if parent_id and item.get('parent_id') is None:
            item['parent_id'] = parent_id

    class Meta:
        type_ = 'items'
