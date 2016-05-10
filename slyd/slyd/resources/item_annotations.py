import copy

from .annotations import _load_relationships
from .items import _port_annotation_fields
from .utils import _load_sample, _group_annotations
from .models import ItemAnnotationSchema
from ..utils.projects import ctx


def update_item_annotation(manager, spider_id, sample_id, item_id,
                           attributes=None):
    annotation_id = item_id.strip('#')
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    container, repeated_selectors = _update_item_annotation(
        sample, attributes['data'], annotations)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id,
                  item_id=annotation_id.split('#')[0])
    container['repeated_container_selectors'] = repeated_selectors
    container['id'] = annotation_id
    return ItemAnnotationSchema(context=context).dump(container).data


def _update_item_annotation(sample, attributes, annotations):
    annotation_id = attributes['id'].strip('#')
    containers, _, _ = _group_annotations(annotations)
    container = containers.get(annotation_id,
                               containers.get(_strip_parent(annotation_id)))
    if container is None:
        raise KeyError('No annotation with id "%s" found' % annotation_id)
    relationships = _load_relationships(attributes)
    attributes = attributes.get('attributes', {})
    container['accept_selectors'] = attributes.get('accept_selectors', [])
    repeated_container_selectors = [
        s for s in attributes.pop('repeated_accept_selectors', []) if s
    ]
    schema_id = relationships.get('schema_id')
    if attributes.get('repeated') or repeated_container_selectors:
        repeated_container_id = _strip_parent(container['id'])
        repeated_container = containers.get(repeated_container_id)
        container_id = repeated_container_id + '#parent'
        if container == repeated_container:
            matching_containers = [
                a for a in annotations
                if a.get('item_container') and a['id'] == container_id
            ]
            if matching_containers:
                container = matching_containers[0]
            else:
                container = copy.deepcopy(container)
                annotations.append(container)
            container['repeated'] = False
            container['siblings'] = 0
        container['id'] = container_id
        matching_containers = [
            a for a in annotations
            if a.get('item_container') and a['id'] == repeated_container_id
        ]
        if matching_containers:
            repeated_container = matching_containers[0]
        if not repeated_container:
            repeated_container = {
                'required': [],
                'annotations': {'#portia-content': '#dummy'},
                'text-content': '#portia-content',
                'item_container': True,
                'reject_selectors': []
            }
            annotations.append(repeated_container)
        repeated_container['id'] = repeated_container_id
        repeated_container['repeated'] = True
        repeated_container['container_id'] = container['id']
        repeated_container['siblings'] = attributes.pop('siblings', 0)
        repeated_container['accept_selectors'] = repeated_container_selectors
        if schema_id:
            repeated_container['schema_id'] = schema_id
        if repeated_container_selectors:
            repeated_container['selector'] = repeated_container_selectors[0]
    else:
        repeated_container_id = _strip_parent(container['id'])
        parent_container_id = '{}#parent'.format(repeated_container_id)
        parent = [
            a for a in sample['plugins']['annotations-plugin']['extracts']
            if a.get('id') == parent_container_id
        ]
        if parent:
            container = parent[0]
            annotations = [
                a for a in sample['plugins']['annotations-plugin']['extracts']
                if a.get('id') != repeated_container_id
            ]
            container['id'] = repeated_container_id
            container['container_id'] = None
            sample['plugins']['annotations-plugin']['extracts'] = annotations

    parent_container_id = relationships.get('parent_id')
    if schema_id:
        container['schema_id'] = schema_id
    field = attributes.get('field')
    if field:
        container['field'] = field
    container['item_container'] = True
    container['container_id'] = parent_container_id
    if container['accept_selectors']:
        container['selector'] = container['accept_selectors'][0]
    return container, repeated_container_selectors


def _strip_parent(id_):
    return id_[:-len('#parent')] if id_.endswith('#parent') else id_
