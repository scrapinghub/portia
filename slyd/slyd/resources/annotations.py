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
    annotation_id, attribute = _split_annotation_id(annotation_id)
    anno, _ = _get_annotation(manager, spider_id, sample_id, annotation_id)
    split_annotations = _split_annotations([anno])
    anno = filter(lambda x: x['attribute'] == attribute, split_annotations)[0]
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(anno).data


def create_annotation(manager, spider_id, sample_id, attributes):
    sample = _load_sample(manager, spider_id, sample_id)
    attributes = _create_annotation(sample, attributes)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(
        _split_annotations([attributes])[0]).data


def update_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes):
    relationships = _load_relationships(attributes['data'])
    data = attributes['data'].get('attributes', {})
    annotation_id, attribute = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         annotation_id)
    # Check if attribute->field mappings and required fields have been updated
    if 'attribute' in data and attribute != data['attribute']:
        field_id = annotation['annotations'].pop(attribute, None)
        if relationships.get('field_id'):
            field_id = relationships['field_id']
        annotation['annotations'][data] = field_id
        required = set(annotation['required']) - {attribute}
        if data.get('required'):
            required += {data['attribute']}
        else:
            required -= {data['attribute']}
        data['required'] = list(required)
    elif data.get('required') and attribute in annotation['annotations']:
        data['required'] = annotation['required'] + [attribute]
    new_attribute = data.pop('attribute', attribute)

    # Check if annotation has been moved to new container
    if ('parent_id' in relationships and
            relationships['parent_id'] != annotation.get('container_id')):
        data['container_id'] = relationships['parent_id']

    # Add or update annotation
    annotation.update(data)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    for i, anno in enumerate(annotations):
        if anno['id'] == annotation_id:
            annotations[i] = annotation
            break
    else:
        annotations.append(annotation)
    manager.savejson(sample, ['spiders', spider_id, sample_id])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    split_annotations = _split_annotations([annotation])
    a = filter(lambda x: x['attribute'] == new_attribute, split_annotations)[0]
    return AnnotationSchema(context=context).dump(a).data


def delete_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes=None):
    annotation_id, attribute = _split_annotation_id(annotation_id)
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         annotation_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    sample['plugins']['annotations-plugin']['extracts'] = [
        a for a in annotations if a['id'] != annotation_id
    ]
    manager.savejson(sample, ['spiders', spider_id, sample_id])


def _get_annotation(manager, spider_id, sample_id, annotation_id):
    sample = manager.resource('spiders', spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    matching = list(filter(lambda a: a.get('id') == annotation_id,
                           annotations))
    if matching:
        return _check_annotation_attributes(matching[0], True), sample
    raise NotFound('No annotation with the id "%s" found' % annotation_id)


def _check_annotation_attributes(attributes, include_defaults=False):
    """Fill in default annotation values if required"""
    return attributes


def _group_annotations(annotations):
    """Group annotations into container/item annotations, contained annotations
    and un contained annotations"""
    extractors = [Extractor(Annotation(a)) for a in annotations]
    data = extraction.BaseContainerExtractor._get_container_data(extractors)
    containers = {id: c.annotation.metadata for id, c in data[0].items()}
    contained_annotations = {}
    for id, annos in data[1].items():
        contained_annotations[id] = _split_annotations(annos)
    remaining_annotations = _split_annotations(data[2])
    return containers, contained_annotations, remaining_annotations


def _split_annotations(annotations):
    """Split annotations into one extracted attribtue per annotation"""
    split_annotations = []
    for a in annotations:
        if isinstance(a, Extractor):
            a = a.annotation.metadata.copy()
        else:
            a = a.copy()
        for attribute, field_id in a.get('annotations', {}).items():
            if attribute:
                a['id'] = '#'.join((a['id'], attribute))
            a['attribute'] = attribute
            a['field'] = {'id': field_id}
            a['required'] = attribute in a.get('required', [])
            split_annotations.append(a)
    return split_annotations


def _split_annotation_id(id):
    """Split annotations from <annotation_id>#<field_id>"""
    split_annotation_id = unquote(id).split('#')
    annotation_id = split_annotation_id[0]
    try:
        field_id = split_annotation_id[1]
    except IndexError:
        field_id = 'content'  # TODO: Should this be None?
    return annotation_id, field_id


def _load_relationships(attributes):
    """Load relationships from jsonapi data. Used for field_id and container_id
    """
    relationships = {}
    for key, value in attributes['relationships'].items():
        relationships[key] = value.get('data') or {}
        relationships['%s_id' % key] = relationships[key].get('id')
    return relationships


def _create_annotation(sample, attributes):
    relationships = _load_relationships(attributes['data'])
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    annotation = {
        'id': aid,
        'container_id': relationships['parent_id'],
        # TODO: default to most likely attribute
        'annotations': {'content': relationships['field_id']},
        'accept_selectors': attributes.get('accept_selectors', []),
        'reject_selectors': attributes.get('reject_selectors', []),
        'required': [],
        'tagid': 1  # TODO: update this during PATCH from ui
    }
    annotations.append(annotation)
    return annotation
