from .annotations import _group_annotations, _split_annotations
from .samples import _load_sample
from .models import ItemAnnotationSchema
from ..utils.projects import ctx


def update_item_annotation(manager, spider_id, sample_id, annotation_id,
                           attributes=None):
    annotation_id = annotation_id.strip('#')
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    containers, _, _ = _group_annotations(annotations)
    container = containers[annotation_id]
    container['tagid'] = attributes.get('tagid')
    repeated_container_tagid = attributes.pop('repeated_container_tagid', None)
    if attributes.get('repeated'):
        repeated_container_id = container['id'].split('#')[0]
        repeated_container = containers.get(repeated_container_id)
        if not repeated_container:
            repeated_container = {
                'id': container['id'].split('#')[0],
                'container_id': container['id'],
                'repeated': True,
                'required': [],
                'annotations': {'#portia-content': None},
                'text_content': '#portia-content',
                'item_container': True
            }
        repeated_container['siblings'] = attributes.pop('siblings', 0)
        repeated_container['tagid'] = attributes.pop(repeated_container_tagid)
        # TODO: Add selectors
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id,
                  item_id=annotation_id.split('#')[0])
    container['repeated_container_tagid'] = repeated_container_tagid
    container['siblings'] = attributes.get('siblings', 0)
    item_container = _split_annotations([container.copy()])[0]
    item_container['id'] = item_container['id'].rsplit('#', 1)[0]
    return ItemAnnotationSchema(context=context).dump(item_container).data
