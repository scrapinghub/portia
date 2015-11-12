from marshmallow_jsonapi import Schema, fields
from marshmallow import pre_dump


class SlydSchema(Schema):
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

    @pre_dump
    def _dump_relationship_properties(self, item):
        if '_skip_relationships' in item and item['_skip_relationships']:
            del item['_skip_relationships']
            return item
        for attr in ['project', 'spider', 'sample', 'schema']:
            id = '_'.join((attr, 'id'))
            if id not in item:
                item[id] = getattr(self, id)
            if item.get(attr) is None:
                item[attr] = {'id': getattr(self, id)}
        return item


class ProjectSchema(SlydSchema):
    id = fields.Str(load_from='name')
    name = fields.Str()
    spiders = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders',
        related_url_kwargs={'project_id': '<id>'}, type_='spiders'
    )
    schemas = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas',
        related_url_kwargs={'project_id': '<id>'}, type_='schemas'
    )
    extractors = fields.Relationship(
        related_url='/api/projects/{project_id}/extractors',
        related_url_kwargs={'project_id': '<id>'}, type_='extractors'
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
        related_url_kwargs={'project_id': '<project_id>'}, type_='projects',
        include_data=True
    )
    fields = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}/fields',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<id>'},
        many=True, include_data=True, type_='fields'
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
        include_data=True
    )
    schema = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>'},
        type_='schema',
        include_data=True
    )

    class Meta:
        type_ = 'fields'


class SpiderSchema(SlydSchema):
    id = fields.Str(dump_only=True, load_from='name')
    name = fields.Str(load_from='id')
    start_urls = fields.List(fields.Str(), default=[])
    links_to_follow = fields.Str(default='patterns')
    follow_patterns = fields.List(fields.Str(), default=[])
    exclude_patterns = fields.List(fields.Str(), default=[])
    js_enabled = fields.Boolean(default=False)
    js_enable_patterns = fields.List(fields.Str(), default=[])
    js_disable_patterns = fields.List(fields.Str(), default=[])
    respect_nofollow = fields.Boolean(default=True)
    allowed_domains = fields.List(fields.Str(), default=[])
    init_requests = fields.List(fields.Dict(), default=[])
    template_names = fields.List(fields.Str(), default=[])
    samples = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>'},
        many=True, include_data=True, type_='samples'
    )
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'}, type_='projects',
        include_data=True
    )

    class Meta:
        type_ = 'spiders'


class SampleSchema(SlydSchema):
    id = fields.Str(dump_only=True)
    name = fields.Str()
    url = fields.Str(required=True)
    page_id = fields.Str()
    page_type = fields.Str(default='item')
    scrapes = fields.Str()
    extractors = fields.List(fields.Str(), default=[])
    original_body = fields.Str(default='')
    annotated_body = fields.Str(default='')
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'}, type_='projects',
        include_data=True
    )
    spider = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders/{spider_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>'},
        type_='spiders',
        include_data=True
    )
    html = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/html',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<id>'},
        many=True
    )
    annotations = fields.Relationship(
        related_url='/api/projects/{project_id}/spider/{spider_id}/samples/'
                    '{sample_id}/annotations',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<id>'},
        many=True, include_data=True, type_='annotations'
    )

    class Meta:
        type_ = 'samples'


class AnnotationSchema(SlydSchema):
    id = fields.Str()
    attribute = fields.Str(required=True)
    accept_selectors = fields.List(fields.Str(), default=[])
    reject_selectors = fields.List(fields.Str(), default=[])
    required = fields.Boolean(default=False)
    tagid = fields.Integer(required=True)
    ignore = fields.Boolean(default=False)
    ignore_beneath = fields.Boolean(default=False)
    variant = fields.Integer(default=False)
    text_content = fields.Str()
    slice = fields.List(fields.Integer())
    item_container = fields.Boolean()
    container_id = fields.Str()

    field = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}/fields/'
                    '{field_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>',
                            'field_id': '<field_id>'},
        type_='fields'
    )
    schema = fields.Relationship(
        related_url='/api/projects/{project_id}/schemas/{schema_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'schema_id': '<schema_id>'},
        type_='schema'
    )
    project = fields.Relationship(
        related_url='/api/projects/{project_id}',
        related_url_kwargs={'project_id': '<project_id>'}, type_='projects',
        include_data=True
    )
    spider = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders/{spider_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>'},
        type_='spiders',
        include_data=True
    )
    sample = fields.Relationship(
        related_url='/api/projects/{project_id}/spiders/{spider_id}/samples/'
                    '{sample_id}',
        related_url_kwargs={'project_id': '<project_id>',
                            'spider_id': '<spider_id>',
                            'sample_id': '<sample_id'},
        type_='samples',
        include_data=True
    )

    class Meta:
        type_ = 'annotations'


class ExtractorSchema(SlydSchema):
    id = fields.Str()
    type = fields.Str()
    value = fields.Str()

    class Meta:
        type_ = 'extractors'


class HtmlSchema(SlydSchema):
    id = fields.Str()
    html = fields.Str()

    class Meta:
        type_ = 'html'
