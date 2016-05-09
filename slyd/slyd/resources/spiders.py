from __future__ import absolute_import
from six import text_type
from slybot.validation.schema import get_schema_validator

from .models import SpiderSchema
from ..errors import BadRequest
from ..utils.projects import allowed_file_name, clean_spider, ctx, init_project


@init_project
def list_spiders(manager, attributes=None):
    return SpiderSchema(many=True, context=ctx(manager)).dump(
        [_load_spider(manager, s) for s in manager.list_spiders()]).data


@init_project
def get_spider(manager, spider_id, attributes=None):
    spider = _load_spider(manager, spider_id)
    context = ctx(manager, spider_id=spider_id)
    return SpiderSchema(context=context).dump(spider).data


@init_project
def create_spider(manager, attributes):
    spider = _check_spider_attributes(attributes, include_defaults=True)
    clean_spider(spider)
    get_schema_validator('spider').validate(spider)
    if spider['name'] in set(manager.list_spiders()):
        raise BadRequest('A spider with the name "%s" already '
                         'exists' % spider['name'])
    spider_id = spider['id'] = spider['name']
    manager.savejson(spider, ['spiders', spider['id']])
    context = ctx(
        manager,
        spider_id=spider_id.encode('utf8') if isinstance(spider_id, text_type) else spider_id)
    return SpiderSchema(context=context).dump(spider).data


def update_spider(manager, spider_id, attributes):
    attributes = SpiderSchema().load(attributes).data
    spider = manager.spider_json(spider_id)
    # init_requests are populated through the SpiderSchema
    spider.pop('init_requests', None)
    spider.update(attributes)
    get_schema_validator('spider').validate(spider)
    rename = spider.get('name') and spider_id != spider['name']
    original_id = spider_id
    if rename:
        manager.rename_spider(spider_id, spider['name'])
        spider_id = spider['name']
    spider['id'] = spider_id
    clean_spider(spider)
    manager.savejson(spider, ['spiders', spider_id])
    spider['samples'] = [{'id': name} for name in spider['template_names']]
    context = ctx(
        manager,
        spider_id=spider_id.encode('utf8') if isinstance(spider_id, text_type) else spider_id)
    if rename:
        # HACK: Ember doesn't allow changing IDs, so return a "new" spider
        # and mark the original as deleted.
        if 'samples' in spider:
            del spider['samples']
        response = SpiderSchema(context=context).dump(spider).data
        spider = _populate_relationships(spider, spider_id)
        new_spider = SpiderSchema(context=context).dump(spider).data
        response['included'] = [new_spider['data']]
        response['data']['attributes']['name'] = "_deleted"
        response['data']['id'] = original_id
    else:
        response = SpiderSchema(context=context).dump(spider).data
    return response


def delete_spider(manager, spider_id, attributes=None):
    manager.remove_spider(spider_id)
    return SpiderSchema.empty_data()


def _check_spider_attributes(attributes, include_defaults=False):
    attributes = SpiderSchema().load(attributes).data
    if not allowed_file_name(attributes['name']):
        raise BadRequest('Bad Request',
                         '"%s" is not a valid name' % attributes['name'])
    if include_defaults:
        return SpiderSchema().dump(attributes).data['data']['attributes']
    return attributes


def _load_spider(manager, spider_id, include_samples=False):
    spider = manager.spider_json(spider_id)
    spider['id'] = spider_id
    spider = _populate_relationships(spider, spider_id)
    if include_samples:
        samples = []
        for name in spider['template_names']:
            sample = manager.resource('spiders', spider_id, name)
            sample['id'] = name
            samples.append(sample)
        spider['samples'] = samples
    return spider


def _populate_relationships(spider, spider_id):
    if not spider.get('name'):
        spider['name'] = spider_id
    spider['samples'] = [
        {'id': name} for name in spider.get('template_names', [])
    ]
    return spider
