import json

from collections import deque, OrderedDict
from marshmallow.fields import Nested
from six import iteritems, iterkeys, itervalues

from slybot import __version__ as SLYBOT_VERSION
from slybot.fieldtypes import FieldTypeManager
from slybot.plugins.scrapely_annotations.migration import (port_sample,
                                                           load_annotations)
from slybot.starturls import StartUrlCollection

from slyd.orm.base import Model
from slyd.orm.decorators import pre_load, post_dump
from slyd.orm.exceptions import PathResolutionError
from slyd.orm.fields import (Boolean, Domain, Integer, List, Regexp, String, Url,
                             DependantField, BelongsTo, HasMany, StartUrl,
                             CASCADE, CLEAR, PROTECT)
from slyd.orm.utils import unwrap_envelopes, wrap_envelopes
from slyd.orm.validators import OneOf
from slyd.utils import short_guid

FIELD_TYPES = FieldTypeManager().available_type_names()


class Project(Model):
    # TODO: override storage for hosted version, return generated project.json
    id = String(primary_key=True)
    name = String()
    spiders = HasMany('Spider', related_name='project', on_delete=CLEAR,
                      ignore_in_file=True)
    schemas = HasMany('Schema', related_name='project', on_delete=CLEAR,
                      ignore_in_file=True)
    extractors = HasMany('Extractor', related_name='project', on_delete=CLEAR,
                         ignore_in_file=True)

    class Meta:
        path = u'project.json'


def CASCADE_AUTO_OR_CLEAR(collector, instance, field_name, related_instance):
    if instance.auto_created:
        CASCADE(collector, instance, field_name, related_instance)
    else:
        CLEAR(collector, instance, field_name, related_instance)


class Schema(Model):
    id = String(primary_key=True)
    name = String(required=True)
    auto_created = Boolean(default=False)
    project = BelongsTo(Project, related_name='schemas', on_delete=CASCADE,
                        ignore_in_file=True)
    fields = HasMany('Field', related_name='schema', on_delete=CLEAR)
    items = HasMany('Item', related_name='schema',
                    on_delete=CASCADE_AUTO_OR_CLEAR, ignore_in_file=True)

    class Meta:
        path = u'items.json'
        owner = 'project'

    @pre_load(pass_many=True)
    def unwrap_envelopes(self, data, many):
        return unwrap_envelopes(data, many, 'id', True)

    @pre_load
    def name_from_id(self, data):
        if 'name' not in data:
            data['name'] = data['id']
        return data

    @pre_load
    def add_fake_items(self, data):
        data['items'] = []
        return data

    @post_dump
    def remove_fake_items(self, data):
        data.pop('items', None)
        return data

    @post_dump
    def remove_auto_created_false(self, data):
        if 'auto_created' in data and not data['auto_created']:
            del data['auto_created']
        return data

    @post_dump(pass_many=True)
    def wrap_envelopes(self, data, many):
        return wrap_envelopes(data, many, 'id', True)


class Field(Model):
    id = String(primary_key=True)
    name = String(required=True)
    type = String(required=True, default='text', validate=OneOf(FIELD_TYPES))
    required = Boolean(default=False)
    vary = Boolean(default=False)
    auto_created = Boolean(default=False)
    schema = BelongsTo(Schema, related_name='fields', on_delete=CASCADE,
                       ignore_in_file=True)
    annotations = HasMany('Annotation', related_name='field',
                          on_delete=CASCADE_AUTO_OR_CLEAR, ignore_in_file=True)

    class Meta:
        path = u'items.json'
        owner = 'schema'

    def __repr__(self):
        return super(Field, self).__repr__('name', 'type')

    @pre_load(pass_many=True)
    def unwrap_envelopes(self, data, many):
        return unwrap_envelopes(data, many, 'id', False)

    @pre_load
    def name_from_id(self, data):
        if 'name' not in data:
            data['name'] = data['id']
        return data

    @pre_load
    def add_fake_annotations(self, data):
        data['annotations'] = []
        return data

    @post_dump
    def remove_fake_annotations(self, data):
        data.pop('annotations', None)
        return data

    @post_dump
    def remove_auto_created_false(self, data):
        if 'auto_created' in data and not data['auto_created']:
            del data['auto_created']
        return data

    @post_dump(pass_many=True)
    def wrap_envelopes(self, data, many):
        return wrap_envelopes(data, many, 'id', False)


class Extractor(Model):
    id = String(primary_key=True)
    type = String(required=True, validate=OneOf(['type', 'regex']))
    value = DependantField(when='type', then={
        'type': String(required=True, validate=OneOf(FIELD_TYPES)),
        'regex': Regexp(required=True),
    })
    project = BelongsTo(Project, related_name='extractors', on_delete=CASCADE,
                        ignore_in_file=True)
    annotations = HasMany('Annotation', related_name='extractors',
                          on_delete=CLEAR, ignore_in_file=True)

    class Meta:
        path = u'extractors.json'
        owner = 'project'

    @pre_load(pass_many=True)
    def unwrap_envelopes(self, data, many):
        return unwrap_envelopes(data, many, 'id', False)

    @pre_load
    def to_type_and_value(self, data):
        type_extractor = data.pop('type_extractor', None)
        regular_expression = data.pop('regular_expression', None)
        if type_extractor:
            data['type'] = 'type'
            data['value'] = type_extractor
        elif regular_expression:
            data['type'] = 'regex'
            data['value'] = regular_expression
        return data

    @post_dump
    def from_type_and_value(self, data):
        # may be missing if serializing only id
        if 'type' in data and 'value' in data:
            type_ = data.pop('type')
            value = data.pop('value')
            if type_ == 'type':
                data['type_extractor'] = value
            else:  # type_ == 'regex'
                data['regular_expression'] = value
        return data

    @post_dump(pass_many=True)
    def wrap_envelopes(self, data, many):
        return wrap_envelopes(data, many, 'id', False)


class Spider(Model):
    # TODO: validate id against allowed file name
    id = String(primary_key=True)
    start_urls = List(Nested(StartUrl))
    links_to_follow = String(default='all', validate=OneOf(
        ['none', 'patterns', 'all', 'auto']))
    allowed_domains = List(Domain)
    respect_nofollow = Boolean(default=True)
    follow_patterns = List(Regexp)
    exclude_patterns = List(Regexp)
    js_enabled = Boolean(default=False)
    js_enable_patterns = List(Regexp)
    js_disable_patterns = List(Regexp)
    perform_login = Boolean(default=False)
    login_url = String(default='', allow_none=True)
    login_user = String(default='', allow_none=True)
    login_password = String(default='', allow_none=True)
    project = BelongsTo(Project, related_name='spiders', on_delete=CASCADE,
                        ignore_in_file=True)
    samples = HasMany('Sample', related_name='spider', on_delete=CLEAR,
                      only='id', load_from='template_names',
                      dump_to='template_names')

    class Meta:
        path = u'spiders/{self.id}.json'

    def __repr__(self):
        return super(Spider, self).__repr__('id')

    @classmethod
    def load(cls, storage, instance=None, project=None, **kwargs):
        if instance is None and project:
            # Load Spiders collection from file listing
            directories, files = storage.listdir('spiders')
            return cls.collection(
                cls(storage, snapshots=('committed',),
                    id=filename[:-len('.json')]).with_snapshots()
                for filename in files
                if filename.endswith('.json'))

        return super(Spider, cls).load(
            storage, instance, project=project, **kwargs)

    @pre_load
    def normalize_start_urls(self, data):
        if 'start_urls' in data or 'generated_urls' in data:
            start_urls = data.get('start_urls', []) + data.get('generated_urls', [])
            data['start_urls'] = StartUrlCollection(start_urls).normalize()
        return data

    @pre_load
    def get_init_requests(self, data):
        init_requests = data.pop('init_requests', [])
        if init_requests:
            login_request = init_requests[0]
            if isinstance(login_request, dict):
                data['login_url'] = login_request.get('loginurl', '')
                data['login_user'] = login_request.get('username', '')
                data['login_password'] = login_request.get('password', '')
        data['perform_login'] = self._is_perform_login(data)
        return data

    @post_dump
    def set_init_requests(self, data):
        if data.pop('perform_login', None) and self._is_perform_login(data):
            data['init_requests'] = [OrderedDict([
                ('type', 'login'),
                ('loginurl', data['login_url']),
                ('username', data['login_user']),
                ('password', data['login_password']),
            ])]
        data.pop('login_url', None)
        data.pop('login_user', None)
        data.pop('login_password', None)
        return OrderedDict(sorted(iteritems(data)))

    @staticmethod
    def _is_perform_login(data):
        return all(data.get(field)
                   for field in ('login_url', 'login_user', 'login_password'))


class OrderedAnnotationsMixin(object):
    @property
    def ordered_children(self):
        children = BaseAnnotation.collection()
        for annotation in self.annotations:
            children.append(annotation)
            if isinstance(annotation, Item):
                children.extend(annotation.ordered_children)
        return children

    @property
    def ordered_annotations(self):
        annotations = Annotation.collection()
        for annotation in self.annotations:
            if isinstance(annotation, Item):
                annotations.extend(annotation.ordered_annotations)
            else:
                annotations.append(annotation)
        return annotations

    @property
    def ordered_items(self):
        items = Item.collection()
        for annotation in self.annotations:
            if isinstance(annotation, Item):
                items.append(annotation)
                items.extend(annotation.ordered_items)
        return items


class Sample(Model, OrderedAnnotationsMixin):
    id = String(primary_key=True)
    name = String(required=True)
    url = Url(required=True)
    page_id = String(default='')
    page_type = String(default='item', validate=OneOf(['item']))
    original_body = String(default='')
    annotated_body = String(default='')
    spider = BelongsTo(Spider, related_name='samples', on_delete=CASCADE,
                       only='id')
    items = HasMany('Item', related_name='sample', on_delete=CLEAR)

    class Meta:
        path = u'spiders/{self.spider.id}/{self.id}.json'

    def __repr__(self):
        return super(Sample, self).__repr__('name', 'url')

    @property
    def annotations(self):
        return self.items

    @classmethod
    def load(cls, storage, instance=None, spider=None, **kwargs):
        if instance is None and spider:
            # Samples are stored in separate files, but they are listed in the
            # Spider file. If this gets called, it means that file didn't exist
            # so return an empty collection
            return cls.collection()

        return super(Sample, cls).load(
            storage, instance, spider=spider, **kwargs)

    @pre_load
    def chain_load(self, data):
        methods = (self.migrate_sample, self.get_items)
        for method in methods:
            data = method(self, data)
        return data

    @staticmethod
    def migrate_sample(self, data):
        if not data.get('name'):
            data['name'] = data.get('id', data.get('page_id', u'')[:20])
        if 'scrapes' not in data or data.get('version', '') > '0.13.0':
            return data
        annotations = (data.pop('plugins', {}).get('annotations-plugin', {})
                           .get('extracts', []))
        items = [a for a in annotations if a.get('item_container')]
        if items:
            return data
        schemas = json.load(self.context['storage'].open('items.json'))
        annotations = load_annotations(data.get('annotated_body', u''))
        data['plugins'] = annotations
        return port_sample(data, schemas)

    @staticmethod
    def get_items(self, data):
        annotations = (data.pop('plugins', {}).get('annotations-plugin', {})
                           .get('extracts', []))

        containers = OrderedDict()
        items = []
        for annotation in annotations:
            id_ = annotation['id']
            if annotation.get('item_container', False):
                containers[id_] = annotation
                annotation.update({
                    'repeated_selector': None,
                    'children': [],
                    'type': 'Item',
                })
                items.append(annotation)
            else:
                # split annotations with multiple keys in data
                for data_id, annotation_data in iteritems(
                        annotation.get('data', {})):
                    items.append(dict(annotation, **{
                        'data': {
                            data_id: annotation_data,
                        },
                        'type': 'Annotation',
                    }))

        for item in items:
            container_id = item.get('container_id')
            if item.pop('repeated', False):
                parent = containers.pop(container_id)
                container_id = item['container_id'] = parent['container_id']
                item['repeated_selector'] = item['selector']
                item['selector'] = parent['selector']
                item['siblings'] = parent['siblings'] or item['siblings']
                item['schema_id'] = parent['schema_id'] or item['schema_id']
                if container_id:
                    containers[container_id]['children'].remove(parent)
            if container_id:
                containers[container_id]['children'].append(item)

        data['items'] = [container
                         for container in itervalues(containers)
                         if container.get('container_id') is None]
        return data

    @post_dump
    def add_fields(self, data):
        items = data.pop('items', [])
        queue = deque(items)
        output_annotations = []
        while queue:
            annotation = queue.popleft()
            if annotation.get('item_container'):
                children = annotation.pop('children', [])
                repeated_selector = annotation.pop('repeated_selector', None)
                if repeated_selector:
                    parent_id = '{}#parent'.format(annotation['id'])
                    output_annotations.append(OrderedDict(annotation, **{
                        'id': parent_id,
                        'repeated': False,
                    }))
                    output_annotations.append(OrderedDict(annotation, **{
                        'container_id': parent_id,
                        'repeated': True,
                        'selector': repeated_selector,
                    }))
                else:
                    output_annotations.append(annotation)
                queue.extendleft(reversed(children))
            else:
                output_annotations.append(annotation)

        scrapes = None
        for annotation in output_annotations:
            scrapes = annotation.get('schema_id')
            if scrapes:
                break

        data.update({
            'extractors': data.get('extractors', {}),
            'plugins': {
                'annotations-plugin': {
                    'extracts': output_annotations,
                },
            },
            'scrapes': scrapes,
            'version': SLYBOT_VERSION,
        })

        return OrderedDict(sorted(iteritems(data)))


class BaseAnnotation(Model):
    id = String(primary_key=True)
    parent = BelongsTo('Item', related_name='annotations', on_delete=CASCADE,
                       only='id')

    class Meta:
        polymorphic = True


class Item(BaseAnnotation, OrderedAnnotationsMixin):
    name = String(allow_none=True, load_from='field', dump_to='field')
    selector = String(allow_none=True, default=None)
    repeated_selector = String(allow_none=True, default=None)
    siblings = Integer(default=0)
    sample = BelongsTo(Sample, related_name='items', on_delete=CASCADE,
                       ignore_in_file=True)
    schema = BelongsTo(Schema, related_name='items', on_delete=PROTECT,
                       load_from='schema_id', dump_to='schema_id', only=('id',))
    annotations = HasMany(BaseAnnotation, related_name='parent',
                          polymorphic=True, on_delete=CLEAR,
                          load_from='children', dump_to='children')

    class Meta:
        path = u'spiders/{self.sample.spider.id}/{self.sample.id}.json'
        owner = 'sample'

    def __repr__(self):
        return super(Item, self).__repr__('name', 'selector',
                                          'repeated_selector')

    @property
    def owner_sample(self):
        if self.sample:
            return self.sample
        if self.parent:
            return self.parent.owner_sample
        return None

    @classmethod
    def storage_path(cls, data, snapshots=None):
        # in the nested item case try to get the path from parent
        try:
            return super(Item, cls).storage_path(data, snapshots)
        except PathResolutionError as e:
            if isinstance(data, cls):
                try:
                    parent = data.data_store.get('parent', snapshots=snapshots)
                except KeyError:
                    raise e
                return cls.storage_path(parent, snapshots)
            raise e

    def _get_parent_object(self, parent_snapshots):
        return self.with_snapshots(parent_snapshots).owner_sample

    @pre_load
    def wrap_schema_envelopes(self, data):
        if 'schema_id' in data:
            data['schema_id'] = {
                data['schema_id']: {}
            }
        return data

    @pre_load
    def remove_attributes(self, data):
        # remove the unused annotations attribute since it will conflict with
        # the annotations field which reads from/writes to the children
        # attribute
        data.pop('annotations', None)
        return data

    @pre_load
    def add_field(self, data):
        data.setdefault('field', None)
        return data

    @post_dump
    def add_attributes(self, data):
        if data.get('field') is None:
            data.pop('field', None)
        data.update({
            'annotations': {
                '#portia-content': '#dummy',
            },
            'container_id': data.pop('parent', None),
            'item_container': True,
            'repeated': bool(data.get('repeated_selector')),
            'required': [],
            'tagid': None,
            'text-content': '#portia-content'
        })
        return OrderedDict(sorted(iteritems(data)))

    @post_dump
    def remove_type(self, data):
        data.pop('type')
        return data

    @post_dump
    def unwrap_schema_envelopes(self, data):
        if 'schema_id' in data:
            data['schema_id'] = (data['schema_id'] and
                                 next(iterkeys(data['schema_id'])))
        return data


class Annotation(BaseAnnotation):
    attribute = String(default='content')
    required = Boolean(default=False)
    selection_mode = String(default='auto', validate=OneOf(
        ['auto', 'css', 'xpath']))
    selector = String(allow_none=True, default=None)
    xpath = String(allow_none=True, default=None)
    accept_selectors = List(String)
    reject_selectors = List(String)
    pre_text = String(allow_none=True, default=None)
    post_text = String(allow_none=True, default=None)
    field = BelongsTo(Field, related_name='annotations', on_delete=PROTECT,
                      only=('id',))
    extractors = HasMany(Extractor, related_name='annotations',
                         on_delete=PROTECT, only=('id',))

    class Meta:
        path = (u'spiders/{self.parent.sample.spider.id}'
                u'/{self.parent.sample.id}.json')
        owner = 'parent'

    def __repr__(self):
        return super(Annotation, self).__repr__('attribute', 'selector')

    @property
    def owner_sample(self):
        return self.parent.owner_sample

    @classmethod
    def storage_path(cls, data, snapshots=None):
        # in the nested item case try to get the path from parent
        try:
            return super(Annotation, cls).storage_path(data, snapshots)
        except PathResolutionError as e:
            if isinstance(data, cls):
                try:
                    parent = data.data_store.get('parent', snapshots=snapshots)
                except KeyError:
                    raise e
                return Item.storage_path(parent, snapshots)
            raise e

    @classmethod
    def generate_pk(cls, storage):
        data_stores = cls.shared_data_store.get(storage, {})
        pk = '{}|{}'.format(short_guid(), short_guid())
        while (cls, pk) in data_stores:
            pk = '{}|{}'.format(short_guid(), short_guid())
        return pk

    @pre_load
    def get_annotation_data(self, data):
        # there should only be one key in data['data'], annotations with
        # multiple data keys are split in the Sample's pre_load
        data_id, annotation_data = next(iteritems(data['data']))

        field = annotation_data['field'] or None
        if field:
            field = {
                field: {
                    'id': field
                }
            }
        extractors = OrderedDict([
            (extractor, {
                'id': extractor
            }) for extractor in annotation_data['extractors'] or []])

        return {
            'id': '{}|{}'.format(data['id'], data_id),
            'container_id': data['container_id'],
            'attribute': annotation_data['attribute'] or 'content',
            'required': annotation_data['required'] or False,
            'selection_mode': data.get('selection_mode') or 'auto',
            'selector': data['selector'] or None,
            'xpath': data.get('xpath') or None,
            'accept_selectors': data['accept_selectors'] or [],
            'reject_selectors': data['reject_selectors'] or [],
            'pre_text': data.get('pre_text') or None,
            'post_text': data.get('post_text') or None,
            'field': field,
            'extractors': extractors,
        }

    @post_dump
    def set_annotation_data(self, data):
        annotation_id, data_id = data['id'].split('|')
        return OrderedDict([
            ('accept_selectors', data['accept_selectors']),
            ('container_id', data['parent']),
            ('data', {
                data_id: OrderedDict([
                    ('attribute', data['attribute']),
                    ('extractors', list(iterkeys(data['extractors'])) or {}),
                    ('field', data['field'] and next(iterkeys(data['field']))),
                    ('required', data['required']),
                ]),
            }),
            ('id', annotation_id),
            ('post_text', data['post_text']),
            ('pre_text', data['pre_text']),
            ('reject_selectors', data['reject_selectors']),
            ('required', []),
            ('selection_mode', data['selection_mode']),
            ('selector', data['selector']),
            ('tagid', None),
            ('xpath', data['xpath']),
        ])
