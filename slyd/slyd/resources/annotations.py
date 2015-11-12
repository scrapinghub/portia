from __future__ import absolute_import

from slybot.validation.schema import get_schema_validator

from .models import AnnotationSchema
from ..errors import NotFound
from ..utils.projects import gen_id, ctx


def list_annotations(manager, spider_id, sample_id, attributes=None):
    sample = manager.resource('spiders', spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(many=True, context=context).dump(annotations)


def get_annotation(manager, spider_id, sample_id, annotation_id,
                   attributes=None):
    anno = _get_annotation(manager, spider_id, sample_id, annotation_id)[0]
    if anno is None:
        raise NotFound('The annotation "%s" could not be '
                       'found' % annotation_id)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(anno)


def create_annotation(manager, spider_id, sample_id, attributes):
    attributes = _check_annotation_attributes(attributes, True)
    get_schema_validator('annotation').validate(attributes)
    sample = manager.resource('spiders', spider_id, sample_id)
    # TODO: Need to convert sample to new format during load
    annotations = sample['plugins']['annotations-plugin']['extracts']
    aid = gen_id(disallow=[a['id'] for a in annotations if a.get('id')])
    attributes['id'] = aid
    annotations.append(attributes)
    manager.savejson(sample, ['spiders', spider_id, sample])
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(attributes)


def update_annotation(manager, spider_id, sample_id, annotation_id,
                      attributes):
    annotation, sample = _get_annotation(manager, spider_id, sample_id,
                                         annotation_id)
    annotation.update(attributes)
    get_schema_validator('annotation').validate(annotation)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    for i, anno in enumerate(annotations):
        if anno['id'] == annotation_id:
            annotations[i] = annotation
            break
    else:
        annotations.append(annotation)
    context = ctx(manager, spider_id=spider_id, sample_id=sample_id)
    return AnnotationSchema(context=context).dump(attributes)


def delete_annotation(manager, spider_id, sample_id, attributes=None):
    manager.remove_template(spider_id, sample_id)


def _get_annotation(manager, spider_id, sample_id, annotation_id):
    sample = manager.resource('spiders', spider_id, sample_id)
    annotations = sample['plugins']['annotations-plugin']['extracts']
    matching = list(filter(lambda a: a.get('id') == annotation_id,
                           annotations))
    if matching:
        return _check_annotation_attributes(matching[0]), sample
    return None, sample


def _check_annotation_attributes(attributes, include_defaults=False):
    attributes = AnnotationSchema().load(attributes).data
    if include_defaults:
        attributes['_skip_relationships'] = True
        a = AnnotationSchema().dump(attributes).data['data']['attributes']
        attributes = a
    return attributes
