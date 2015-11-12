from scrapy.http.request import Request
from scrapy.utils.request import request_fingerprint

from slybot.validation.schema import get_schema_validator

from .models import SampleSchema, HtmlSchema
from ..errors import BadRequest
from ..utils.projects import ctx, gen_id


def list_samples(manager, spider_id, attributes=None):
    samples = []
    spider = manager.resource('spiders', spider_id)
    _samples = spider.get('template_names')
    if _samples is None:
        # TODO: Convert to new format
        _samples = [str(i) for i in range(1, len(spider.get('templates', 0)))]
    for name in _samples:
        sample = _load_sample(manager, spider_id, name)
        sample['id'] = name
        samples.append(sample)
    context = ctx(manager, spider_id=spider_id)
    return SampleSchema(many=True, context=context).dump(samples).data


def get_sample(manager, spider_id, sample_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    sample['id'] = sample_id
    context = ctx(manager, spider_id=spider_id)
    # Convert to having annotations shown
    # add annotations as included
    return SampleSchema(context=context).dump(sample)


def create_sample(manager, spider_id, attributes):
    attributes = _check_sample_attributes(attributes, True)
    get_schema_validator('template').validate(attributes)
    spider = manager.resource('spiders', spider_id)
    sample_id = gen_id(disallow=spider['template_names'])
    manager.savejson(attributes, ['spiders', spider_id, sample_id])
    spider['template_names'].append(sample_id)
    manager.savejson(spider, ['spiders', spider_id])
    attributes['id'] = sample_id
    context = ctx(manager, spider_id=spider_id)
    return SampleSchema(context=context).dump(attributes)


def update_sample(manager, spider_id, sample_id, attributes):
    attributes = _check_sample_attributes(attributes)
    sample = _load_sample(manager, spider_id, sample_id)
    sample.update(attributes)
    get_schema_validator('template').validate(sample)
    manager.savejson(sample, 'spiders', spider_id, sample_id)
    sample['id'] = sample_id
    # TODO: add annotation data
    context = ctx(manager, spider_id=spider_id)
    return SampleSchema(context=context).dump(sample)


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
        attributes['_skip_relationships'] = True
        return SampleSchema().dump(attributes).data['data']['attributes']
    return attributes


def _load_sample(manager, spider_id, sample_id):
    sample = manager.resource('spiders', spider_id, sample_id)
    if 'name' not in sample:
        sample['name'] = sample_id
    return sample
