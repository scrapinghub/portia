from __future__ import absolute_import
from .annotations import _split_annotations, _load_relationships
from .models import ItemSchema, AnnotationSchema, ItemAnnotationSchema
from .samples import _process_annotations
from .utils import _load_sample
from ..errors import NotFound
from ..utils.projects import ctx, gen_id


def list_items(manager, spider_id, sample_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    items, _, _ = _process_annotations(sample)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return ItemSchema(many=True, context=context).dump(items).data


def get_item(manager, spider_id, sample_id, item_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    items, _, _ = _process_annotations(sample)
    item = filter(lambda x: x.get('id') == item_id, items)
    if not item:
        raise NotFound('No item with the id "%s" could be found' % item_id)
    else:
        item = item[0]
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return ItemSchema(context=context).dump(item).data


def create_item(manager, spider_id, sample_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    schema_id = attributes['data']['relationships']['schema']['data']['id']
    annotation = {
        'id': aid,
        'tagid': 1,
        # TODO: Field id in place of None for nested items
        'annotations': {'#portia-content': None},
        'required': [],
        'text_content': '#portia-content',
        'item_container': True,
        'schema_id': schema_id
    }
    annotations.append(annotation)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return _item(sample, {'id': schema_id}, annotation, context=context)


def update_item(manager, spider_id, sample_id, item_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    annotation = filter(lambda x: x.get('id') == item_id, annotations)
    if not annotation:
        raise NotFound('No item with the id "%s" could be found' % item_id)
    else:
        annotation = annotation[0]
    relationships = _load_relationships(attributes['data'])
    schema_id = relationships.get('schema_id')
    if schema_id is not None:
        annotation['schema_id'] = schema_id
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return _item(sample, {'id': schema_id}, annotation, context=context)


def delete_item(manager, spider_id, sample_id, item_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    _get_item(annotations, item_id)  # Raises 404 error if item doesn't exist
    sample['plugins']['annotations-plugin']['extracts'] = [
        a for a in annotations if a['id'] != item_id
    ]
    manager.savejson(sample, ['spiders', spider_id, sample_id])


def _get_item(items, item_id):
    for item in items:
        print(item)
        if item['id'] == item_id and item['container_id']:
            return item
    raise NotFound('No item with the id "%s" could be found.' % item_id)


def _item(sample, schema, item_annotation, annotations=None, context=None):
    if annotations is None:
        annotatations = []
    if context is None:
        context = {}
    item_annotation = _split_annotations([item_annotation.copy()])[0]
    item = ItemSchema(context=context).dump({
        'id': item_annotation['id'],
        'sample': sample,
        'schema': schema,
        'item_annotation': item_annotation,
        'annotations': annotatations
    }).data
    item_annotation_s = ItemAnnotationSchema(context=context)
    item_annotation = item_annotation_s.dump(item_annotation).data['data']
    dumped_annotations = []
    for annotation in _split_annotations(annotatations):
        context['field_id'] = annotation['field']['id']
        dumped_annotations.append(
            AnnotationSchema(context=context).dump(annotation).data['data'])
    item['included'] = [item_annotation] + dumped_annotations
    return item
