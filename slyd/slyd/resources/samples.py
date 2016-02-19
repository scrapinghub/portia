from itertools import chain

from scrapy.http.request import Request
from scrapy.utils.request import request_fingerprint

from slybot.validation.schema import get_schema_validator

from .models import (SampleSchema, HtmlSchema, ItemSchema, AnnotationSchema,
                     ItemAnnotationSchema)
from .annotations import _group_annotations
from .utils import _load_sample, _create_schema, _get_formatted_schema
from ..errors import BadRequest
from ..utils.projects import ctx, gen_id


def list_samples(manager, spider_id, attributes=None):
    samples = []
    spider = manager.resource('spiders', spider_id)
    _samples = spider.get('template_names', [])
    for name in _samples:
        sample = _load_sample(manager, spider_id, name)
        samples.append(sample)
    context = ctx(manager, spider_id=spider_id)
    return SampleSchema(many=True, context=context).dump(samples).data


def get_sample(manager, spider_id, sample_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    return _process_sample(sample, manager, spider_id)


def create_sample(manager, spider_id, attributes):
    attributes = _check_sample_attributes(attributes, True)
    schema, schema_id = _create_schema(manager,
                                       {'name': attributes.get('name')})
    attributes['scrapes'] = schema_id
    get_schema_validator('template').validate(attributes)
    spider = manager.resource('spiders', spider_id)
    sample_id = gen_id(disallow=spider['template_names'])
    manager.savejson(attributes, ['spiders', spider_id, sample_id])
    attributes = _load_sample(manager, spider_id, sample_id)
    manager.savejson(attributes, ['spiders', spider_id, sample_id])
    spider['template_names'].append(sample_id)
    manager.savejson(spider, ['spiders', spider_id])
    attributes['id'] = sample_id
    context = ctx(manager, spider_id=spider_id)
    sample = SampleSchema(context=context).dump(attributes).data
    schema = _get_formatted_schema(manager, schema_id, schema, True)
    sample['included'] = [schema['data']]
    return sample


def update_sample(manager, spider_id, sample_id, attributes):
    attributes = _check_sample_attributes(attributes)
    sample = _load_sample(manager, spider_id, sample_id)
    sample.update(attributes)
    get_schema_validator('template').validate(sample)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    return _process_sample(sample, manager, spider_id)


def delete_sample(manager, spider_id, sample_id, attributes=None):
    manager.remove_template(spider_id, sample_id)


def get_sample_html(manager, spider_id, sample_id):
    sample = manager.resource('spiders', spider_id, sample_id)
    return HtmlSchema().dump({'id': sample.get('fp'),
                              'html': sample.get('original_body', '')})


def _check_sample_attributes(attributes, include_defaults=False):
    attributes = SampleSchema().load(attributes).data
    if 'url' not in attributes:
        raise BadRequest('Can\'t create a sample without a "url"')
    if 'page_id' not in attributes:
        request = Request(attributes['url'])
        attributes['page_id'] = request_fingerprint(request)
    if 'scrapes' not in attributes:
        attributes['scrapes'] = 'default'  # TODO: add default schema
    if include_defaults:
        dumper = SampleSchema(skip_relationships=True,
                              exclude=('html', 'items'))
        attributes = dumper.dump(attributes).data['data']['attributes']
    return attributes


def _process_sample(sample, manager, spider_id):
    _ctx = lambda x=None, y=None: ctx(manager, spider_id=spider_id,
                                      sample_id=sample['id'], schema_id=x,
                                      item_id=y)
    items, annotations, item_annotations = _process_annotations(sample)
    sample['items'] = items
    # Remove any html pages from sample
    for key in sample.keys():
        if '_body' in key:
            sample.pop(key)
    data = SampleSchema(context=_ctx()).dump(sample).data
    return _add_items_and_annotations(data, items, annotations,
                                      item_annotations, _ctx)


def _add_items_and_annotations(data, items, annotations, item_annotations,
                               _ctx):
    built_items = []
    for i in items:
        context = _ctx(i['schema']['id'])
        item = ItemSchema(context=context).dump(i).data['data']
        built_items.append(item)
    annos = []
    for a in annotations:
        if a.get('item_container'):
            continue
        context = _ctx(None, a['container_id'])
        dumper = AnnotationSchema(context=context)
        annos.append(dumper.dump(a).data['data'])
    item_annos = []
    for a in item_annotations:
        context = _ctx(a['schema_id'])
        dumper = ItemAnnotationSchema(context=context)
        item_annos.append(dumper.dump(a).data['data'])
    data['included'] = built_items + annos + item_annos
    return data


def _process_annotations(sample):
    annotation_info = sample.get('plugins', {}).get('annotations-plugin', {})
    annotations = annotation_info.get('extracts', [])
    containers, grouped, remaining = _group_annotations(annotations)
    items, item_annotations = [], []
    processed_items = set()
    scrapes = sample.get('scrapes')  # TODO: Handle default item
    for _id, container in containers.items():
        item_id = _id.split('#')[0]
        if 'schema_id' not in container and scrapes:
            container['schema_id'] = scrapes
        item = {
            'id': item_id,
            'sample': sample,
            'schema': {'id': container['schema_id']},
            'item_annotation': container,
            'annotations': grouped.get(_id, [])
        }
        container_id = container.get('container_id')
        if container_id and container_id.split('#')[0] != item_id:
            container['parent'] = {'id': container_id}
        if item_id not in processed_items:
            items.append(item)
            processed_items.add(item['id'])
        item_annotations.append(container)
    annotations = [i for i in chain(*grouped.values())
                   if not i.get('item_container')]
    return items, annotations, item_annotations
