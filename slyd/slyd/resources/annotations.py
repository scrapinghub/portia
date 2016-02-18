from __future__ import absolute_import
from collections import namedtuple
from urllib import unquote

import slybot.plugins.scrapely_annotations.extraction as extraction

from .models import AnnotationSchema
from .utils import _load_sample
from ..errors import NotFound
from ..utils.projects import gen_id, ctx

Extractor = namedtuple('Extractor', ['annotation'])
Annotation = namedtuple('Annotation', ['metadata'])


def list_annotations(manager, spider_id, sample_id, attributes=None):
    # TODO(refactor): Build annotation load function
    sample = manager.resource('spiders', spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(many=True, context=context).dump(annotations).data


def get_annotation(manager, spider_id, sample_id, annotation_id,
                   attributes=None):
    aid, id = _split_annotation_id(annotation_id)
    anno, _ = _get_annotation(manager, spider_id, sample_id, aid)
    split_annotations = _split_annotations([anno])
    anno = filter(lambda x: x['id'] == annotation_id, split_annotations)[0]
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(anno).data


def create_annotation(manager, spider_id, sample_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id)
    attributes = _create_annotation(sample, attributes)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    sample = manager.resource('spiders', spider_id, sample_id)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(
        _split_annotations([attributes])[0]).data


def update_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes):
    relationships = _load_relationships(attributes['data'])
    data = attributes['data'].get('attributes', {})
    anno_id, id = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         anno_id)
    annotation_data = annotation['data'][id]
    field_id = annotation_data['field']
    if relationships.get('field_id'):
        field_id = relationships['field_id']
    annotation_data['field'] = field_id
    attribute = annotation_data['attribute']
    if data.get('attribute'):
        attribute = data['attribute']
    annotation_data['attribute'] = attribute
    if data.get('required'):
        annotation_data['required'] = True
    else:
        annotation_data['required'] = False
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
        data['container_id'] = relationships['parent_id'].split('#')[0]

    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    split_annotations = _split_annotations([annotation])
    a = filter(lambda x: x['id'] == annotation_id, split_annotations)[0]
    return AnnotationSchema(context=context).dump(a).data


def delete_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes=None):
    annotation_id, id = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         annotation_id)
    del annotation['data'][id]
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


def _group_annotations(annotations):
    """Group annotations into container/item annotations, contained annotations
    and un contained annotations."""
    extractors = [Extractor(Annotation(a)) for a in annotations]
    data = extraction.BaseContainerExtractor._get_container_data(extractors)
    containers = {id: c.annotation.metadata for id, c in data[0].items()}
    contained_annotations = {}
    for id, annos in data[1].items():
        contained_annotations[id] = _split_annotations(annos)
    remaining_annotations = _split_annotations(data[2])
    return containers, contained_annotations, remaining_annotations


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
        _find_annotation_paths(v, nested, parents[:] + [k])


def _split_annotations(annotations):
    """Split annotations into one extracted attribtue per annotation."""
    split_annotations = []
    for a in annotations:
        if isinstance(a, Extractor):
            a = a.annotation.metadata.copy()
        else:
            a = a.copy()
        if a.get('item_container'):
            continue
        _default = {
            'default': {
                'field': '#dummy',
                'required': False,
                'extractors': [],
                'attribute': '#portia-content'
            }
        }
        attributes = a.get('data', _default)
        if not attributes:
            attributes = _default
        for id, annotation in attributes.items():
            a['id'] = '#'.join((a['id'], id))
            a.pop('schema_id', None)
            a['attribute'] = annotation['attribute']
            a['field'] = {'id': annotation['field']}
            a['required'] = annotation.get('required', False)
            a['extractors'] = [{'id': e} for e in annotation['extractors']]
            split_annotations.append(a)
    return split_annotations


def _split_annotation_id(id):
    """Split annotations from <annotation_id>#<field_id>."""
    split_annotation_id = unquote(id).split('#')
    annotation_id = split_annotation_id[0]
    try:
        field_id = split_annotation_id[1]
    except IndexError:
        field_id = 'content'  # TODO: Should this be None?
    return annotation_id, field_id


def _load_relationships(attributes):
    """Load relationships from jsonapi data. For field_id and container_id."""
    relationships = {}
    for key, value in attributes['relationships'].items():
        relationships[key] = value.get('data') or {}
        relationships['%s_id' % key] = relationships[key].get('id')
    return relationships


def _create_annotation(sample, attributes):
    relationships = _load_relationships(attributes['data'])
    attributes = attributes['data']['attributes']
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    id = gen_id(disallow={i for a in annotations for i in a.get('data', [])})
    annotation = {
        'id': aid,
        'container_id': relationships['parent_id'].split('#')[0],
        # TODO: default to most likely attribute
        'data': {
            id: {
                'attribute': 'content',
                'field': relationships['field_id'],
                'required': False,
                'extractors': []
            }
        },
        'accept_selectors': attributes.get('accept_selectors', []),
        'reject_selectors': attributes.get('reject_selectors', []),
        'required': [],
        'tagid': attributes.get('tagid', '1')
    }
    annotations.append(annotation)
    return annotation
