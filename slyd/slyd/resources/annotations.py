from __future__ import absolute_import
from urllib import unquote

from .models import AnnotationSchema
from .fields import create_field
from .utils import (_load_sample, extraction, Extractor, Annotation,
                    _split_annotations)
from ..errors import NotFound
from ..utils.projects import gen_id, ctx


def list_annotations(manager, spider_id, sample_id, attributes=None):
    # TODO(refactor): Build annotation load function
    sample = manager.resource('spiders', spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(many=True, context=context).dump(annotations).data


def get_annotation(manager, spider_id, sample_id, annotation_id,
                   attributes=None):
    aid, _id = _split_annotation_id(annotation_id)
    if not _id:
        raise NotFound('No annotation with the id "%s" found.' % annotation_id)
    anno, _ = _get_annotation(manager, spider_id, sample_id, aid)
    split_annotations = _split_annotations([anno])
    anno = filter(lambda x: x['id'] == annotation_id, split_annotations)[0]
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(anno).data


def create_annotation(manager, spider_id, sample_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id)
    annotation = _create_annotation(sample, attributes)
    field = _create_field_for_annotation(manager, annotation, sample)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    annotation = AnnotationSchema(context=context).dump(
        _split_annotations([annotation])[0]).data
    if field:
        annotation['included'] = [field]
    return annotation


def update_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes):
    relationships = _load_relationships(attributes['data'])
    data = attributes['data'].get('attributes', {})
    anno_id, _id = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         anno_id)
    annotation_data = annotation['data'][_id]
    field_id = annotation_data['field']
    if relationships.get('field_id'):
        field_id = relationships['field_id']
    annotation_data['field'] = field_id
    attribute = annotation_data['attribute']
    if data.get('attribute'):
        attribute = data['attribute']
    annotation_data['attribute'] = attribute
    annotation_data['required'] = bool(data.get('required', False))
    extractors = relationships.get('extractors', [])
    if extractors:
        if isinstance(extractors, dict) and 'id' in extractors:
            extractors = [extractors.get('id')]
        elif isinstance(extractors, list):
            extractors = [e['id'] for e in extractors if e and 'id' in e]
    annotation_data['extractors'] = extractors

    # Check if annotation has been moved to new container
    if ('parent_id' in relationships and
            relationships['parent_id'] != annotation.get('container_id')):
        data['container_id'] = relationships['parent_id'].split('|')[0]

    annotation['accept_selectors'] = data.get('accept_selectors',
                                              annotation['accept_selectors'])
    annotation['reject_selectors'] = data.get('reject_selectors',
                                              annotation['reject_selectors'])
    annotation['selector'] = data.get('selector', annotation['selector'])
    if annotation['selector'] is None:
        annotation['selector'] = ', '.join(annotation['accept_selectors'])

    manager.savejson(sample, ['spiders', spider_id, sample_id])
    schema_id = annotation.get('schema_id')
    if not schema_id:
        container = _find_container(annotation, sample)
        if container:
            schema_id = container.get('schema_id')
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id, schema_id=schema_id, field_id=field_id)
    split_annotations = _split_annotations([annotation])
    a = filter(lambda x: x['id'] == annotation_id, split_annotations)[0]
    return AnnotationSchema(context=context).dump(a).data


def delete_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes=None):
    annotation_id, _id = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         annotation_id)
    del annotation['data'][_id]
    annotations = sample['plugins']['annotations-plugin']['extracts']
    if not annotation['data']:
        sample['plugins']['annotations-plugin']['extracts'] = [
            a for a in annotations if a['id'] != annotation_id
        ]
    manager.savejson(sample, ['spiders', spider_id, sample_id])


def _get_annotation(manager, spider_id, sample_id, annotation_id):
    sample = _load_sample(manager, spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    matching = list(filter(lambda a: a.get('id') == annotation_id,
                           annotations))
    if matching:
        return _check_annotation_attributes(matching[0], True), sample
    raise NotFound('No annotation with the id "%s" found' % annotation_id)


def _check_annotation_attributes(attributes, include_defaults=False):
    """Fill in default annotation values if required."""
    return attributes


def _nested_containers(annotations):
    extractors = [Extractor(Annotation(a)) for a in annotations]
    info = extraction.BaseContainerExtractor._get_container_data(extractors)
    data = extraction.BaseContainerExtractor._build_extraction_tree(info[0])
    grouped_data = extraction.group_tree(data, info[1])
    nested = set()
    _find_annotation_paths(grouped_data, nested)
    return nested


def _find_annotation_paths(tree, nested, parents=None):
    if parents is None:
        parents = []
    for k, v in tree.items():
        if v is None:
            nested.add(tuple(parents))
            continue
        if isinstance(v, list):
            for ex in v:
                anno = ex.annotation.metadata
                if anno.get('item_container'):
                    _find_annotation_paths(anno, nested, parents[:] + [k])
        elif isinstance(v, dict):
            _find_annotation_paths(v, nested, parents[:] + [k])


def _split_annotation_id(_id):
    """Split annotations from <annotation_id>#<sub_annotation_id>."""
    split_annotation_id = unquote(_id).split('|')
    annotation_id = split_annotation_id[0]
    try:
        field_id = split_annotation_id[1]
    except IndexError:
        field_id = None
    return annotation_id, field_id


def _load_relationships(attributes):
    """Load relationships from jsonapi data. For field_id and container_id."""
    relationships = {}
    for key, value in attributes['relationships'].items():
        relationships[key] = value.get('data') or {}
        if hasattr(relationships[key], 'get'):
            relationships['%s_id' % key] = relationships[key].get('id')
    return relationships


def _create_annotation(sample, attributes):
    relationships = _load_relationships(attributes['data'])
    attributes = attributes['data']['attributes']
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    _id = gen_id(disallow={i for a in annotations for i in a.get('data', [])})
    annotation = {
        'id': aid,
        'container_id': relationships['parent_id'].split('|')[0],
        # TODO: default to most likely attribute
        'data': {
            _id: {
                'attribute': attributes.get('attribute', 'content'),
                'field': relationships['field_id'],
                'required': False,
                'extractors': []
            }
        },
        'accept_selectors': attributes.get('accept_selectors', []),
        'reject_selectors': attributes.get('reject_selectors', []),
        'selector': attributes.get('selector'),
        'required': [],
        'tagid': attributes.get('tagid', '1')
    }
    if annotation['selector'] is None:
        annotation['selector'] = ', '.join(annotation['accept_selectors'])
    annotations.append(annotation)
    return annotation


def _find_container(annotation, sample):
    container_id = annotation.get('container_id')
    if container_id:
        for a in sample['plugins']['annotations-plugin']['extracts']:
            if a["id"] == container_id:
                return a
    return None


def _create_field_for_annotation(manager, annotation, sample):
    field, parent, container_id = None, None, annotation['container_id']
    for a in sample['plugins']['annotations-plugin']['extracts']:
        if a['id'].startswith(container_id):
            if not parent:
                parent = a
            if len(a['id']) > len(parent['id']):
                parent = a
    if parent:
        field = create_field(manager, parent['schema_id'],
                             {'data': {'attributes': {'type': 'text'},
                              'type': 'fields'}})
        field_id = field['data']['id']
        for anno in annotation['data'].values():
            if anno['field'] is None:
                anno['field'] = field_id
    if field:
        return field['data']
