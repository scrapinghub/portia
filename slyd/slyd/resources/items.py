from __future__ import absolute_import
from .annotations import (_split_annotations, _load_relationships,
                          _nested_containers)
from .fields import _create_field, _dump_fields
from .models import ItemSchema, AnnotationSchema, ItemAnnotationSchema
from .utils import (_load_sample, _create_schema, _process_annotations,
                    _add_items_and_annotations, _read_schemas)
from ..errors import NotFound
from ..utils.projects import ctx, gen_id


def list_items(manager, spider_id, sample_id, attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    items, _, _ = _process_annotations(sample)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return ItemSchema(many=True, context=context).dump(items).data


def get_item_sub_annotations(manager, spider_id, sample_id, item_id,
                             attributes=None):
    sample = _load_sample(manager, spider_id, sample_id)
    items, annotations, item_annotations = _process_annotations(sample)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    items = [item for item in items if item['id'] == item_id]
    annotations = [a for a in annotations if a.get('container_id') == item_id]
    item_annotations = [i for i in item_annotations if i['id'] == item_id]
    item = ItemSchema(many=True, context=context).dump(items).data
    _ctx = lambda x=None, y=None: ctx(manager, spider_id=spider_id,
                                      sample_id=sample['id'], schema_id=x,
                                      item_id=y)
    return _add_items_and_annotations(item, items, annotations,
                                      item_annotations, _ctx)


def get_item(manager, spider_id, sample_id, item_id, attributes=None):
    item_id = item_id.split('#')[0]
    sample = _load_sample(manager, spider_id, sample_id,
                          create_missing_item=False)
    items, _, _ = _process_annotations(sample)
    item = filter(lambda x: x.get('id') == item_id, items)
    if not item:
        raise NotFound('No item with the id "%s" could be found' % item_id)
    else:
        item = item[0]
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return ItemSchema(context=context).dump(item).data


def create_item(manager, spider_id, sample_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id,
                          create_missing_item=False)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    relationships = _load_relationships(attributes.get('data'))
    attributes = attributes.get('data', {}).get('attributes', {})
    schema_id = relationships.get('schema_id')
    container_id = relationships.get('parent_id')
    if not schema_id:
        name = sample.get('name', sample.get('id'))
        schemas, schema_id = _create_schema(manager, {'name': name})
        if sample['scrapes'] not in schemas:
            sample['scrapes'] = schema_id
    annotation = {
        'id': aid,
        'accept_selectors': ['body'],
        'selector': 'body',
        'field': attributes.get('field'),
        'annotations': {'#portia-content': '#dummy'},
        'required': [],
        'text-content': '#portia-content',
        'item_container': True,
        'schema_id': schema_id,
        'container_id': container_id
    }
    annotations.append(annotation)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id,
                  item_id=annotation['container_id'])
    return _item(sample, {'id': schema_id}, annotation, context=context)


def update_item(manager, spider_id, sample_id, item_id, attributes):
    item_id = item_id.split('#')[0]
    sample = _load_sample(manager, spider_id, sample_id,
                          create_missing_item=False)
    all_annotations = sample['plugins']['annotations-plugin']['extracts']
    ids = (item_id, '%s#parent' % item_id)
    annotations = filter(lambda x: x.get('id') in ids, all_annotations)
    if not annotations:
        raise NotFound('No item with the id "%s" could be found' % item_id)
    relationships = _load_relationships(attributes['data'])
    schema_id = relationships.get('schema_id')
    schema = {'id': schema_id}
    ported = False
    filtered = [a for a in all_annotations if a.get('container_id') in ids]
    for annotation in annotations:
        if schema_id is not None:
            if (not ported and 'schema_id' in annotation and
                    schema_id != annotation['schema_id']):
                _, schema = _port_annotation_fields(
                    manager, annotation['schema_id'], schema_id, filtered)
                schema['id'] = schema_id
                ported = True
            annotation['schema_id'] = schema_id
        elif 'schema_id' in annotation:
            schema_id = annotation['schema_id']
            schema = {'id': schema_id}
    annotation['container_id'] = relationships.get('parent_id')
    annotation = sorted(annotations, key=lambda x: x['id'], reverse=True)[0]
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id,
                  item_id=annotation.get('container_id'))
    return _item(sample, schema, annotation, annotations=filtered,
                 context=context, manager=manager)


def delete_item(manager, spider_id, sample_id, item_id, attributes=None):
    item_id = item_id.split('#')[0]
    sample = _load_sample(manager, spider_id, sample_id,
                          create_missing_item=False)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    try:
        _get_item(annotations, item_id)
    except NotFound:
        pass  # If item doesn't exist might need to fix project relationships
    # Delete all annotations related to the item
    paths = _nested_containers(annotations)
    paths = list(filter(lambda x: item_id in x, paths))
    longest_path = set()
    if paths:
        longest_path = max(paths, key=len)
    if longest_path:
        longest_path = set(longest_path[longest_path.index(item_id):])
    longest_path.add(item_id)
    sample['plugins']['annotations-plugin']['extracts'] = [
        a for a in annotations
        if not (a['id'] in (item_id, '%s#parent' % item_id) or
                a.get('container_id') in longest_path)
    ]
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    return ItemSchema.empty_data()


def _get_item(items, item_id):
    for item in items:
        if item['id'] == item_id and item.get('container_id'):
            return item
    raise NotFound('No item with the id "%s" could be found.' % item_id)


def _item(sample, schema, item_annotation, annotations=None, context=None,
          manager=None):
    if annotations is None:
        annotations = []
    if context is None:
        context = {}
    item_id = item_annotation['id'].rsplit('#', 1)[0]
    container_id = item_annotation.get('container_id')
    item = {
        'id': item_id,
        'sample': sample,
        'schema': schema,
        'item_annotation': item_annotation,
        'annotations': annotations
    }
    if container_id and item_annotation['id'].split('#')[0] != container_id:
        item_annotation['parent'] = {'id': container_id}
        item['parent'] = {'id': container_id}
    item = ItemSchema(context=context).dump(item).data
    item_annotation_s = ItemAnnotationSchema(context=context)
    item_annotation = item_annotation_s.dump(item_annotation).data['data']
    dumped_annotations = []
    for annotation in _split_annotations(annotations):
        context['field_id'] = annotation['field']['id']
        dumped_annotations.append(
            AnnotationSchema(context=context).dump(annotation).data['data'])
    fields = []
    if 'fields' in schema:
        fields = _dump_fields(manager, schema['fields'], schema['id'])['data']
    item['included'] = [item_annotation] + dumped_annotations + fields
    return item


def _port_annotation_fields(manager, old_schema_id, new_schema_id,
                            annotations):
    schemas = _read_schemas(manager)
    old_schema, new_schema = schemas[old_schema_id], schemas[new_schema_id]
    new_schemas_names = {
        d.get('name', _id): _id for _id, d in new_schema['fields'].items()
    }
    new_fields = False
    for annotation in annotations:
        for aid, annotation in annotation.get('data', {}).items():
            field_id = annotation['field']
            field = old_schema['fields'].get(field_id, {})
            field_name = field.get('name', field_id)
            if field_name in new_schemas_names:
                annotation['field'] = new_schemas_names[field_name]
            else:
                if not field:
                    field = {
                        'name': 'field%s' % len(new_schema['fields']),
                        'vary': False,
                        'required': False,
                        'type': 'text'
                    }
                new_schema, fid = _create_field(new_schema, field, schemas)
                new_fields = True
                annotation['field'] = fid
    if new_fields:
        manager.savejson(schemas, ['items'])
    return annotations, new_schema
