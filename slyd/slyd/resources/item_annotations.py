from .annotations import _group_annotations
from .samples import _load_sample
from .models import ItemAnnotationSchema
from ..utils.projects import ctx


def update_item_annotation(manager, spider_id, sample_id, annotation_id,
                           attributes=None):
    annotation_id = annotation_id.strip('#')
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    containers, _, _ = _group_annotations(annotations)
    container = containers.get(annotation_id,
                               containers[annotation_id.strip('#parent')])
    container['tagid'] = attributes.get('tagid')
    repeated_container_tagid = attributes.pop('repeated_container_tagid', None)
    if attributes.get('repeated'):
        repeated_container_id = container['id'].strip('#parent')
        if container['id'] == repeated_container_id:
            container = container.copy()
            container['id'] = repeated_container_id + '#parent'
            annotations.append(container)
        repeated_container = containers.get(repeated_container_id)
        if not repeated_container:
            repeated_container = {
                'id': repeated_container_id,
                'container_id': container['id'],
                'required': [],
                'annotations': {'#portia-content': None},
                'text_content': '#portia-content',
                'item_container': True
            }
            annotations.append(repeated_container)
        repeated_container['repeated'] = True
        repeated_container['container_id'] = container['id']
        repeated_container['siblings'] = attributes.pop('siblings', 0)
        repeated_container['tagid'] = attributes.pop(repeated_container_tagid)
        # TODO: Add selectors
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id,
                  item_id=annotation_id.split('#')[0])
    container['repeated_container_tagid'] = repeated_container_tagid
    container['siblings'] = attributes.get('siblings', 0)
    container['id'] = annotation_id
    return ItemAnnotationSchema(context=context).dump(container).data
