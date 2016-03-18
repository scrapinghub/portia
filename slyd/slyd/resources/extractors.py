from slybot.fieldtypes import FieldTypeManager
from slybot.validation.schema import get_schema_validator

from .models import ExtractorSchema
from .utils import _read_extractors, gen_id
from ..errors import BadRequest
from ..utils.projects import ctx, init_project
EXTRACTOR_TYPES = set(FieldTypeManager._TYPEMAP.keys())


@init_project
def list_extractors(manager, attributes=None):
    extractors = [e for _id, e in _read_extractors(manager).items()]
    context = ctx(manager)
    return ExtractorSchema(many=True, context=context).dump(extractors).data


@init_project
def get_extractor(manager, extractor_id, attributes=None):
    extractors = _read_extractors(manager)
    extractor = extractors[extractor_id]
    return ExtractorSchema(context=ctx(manager)).dump(extractor).data


def create_extractor(manager, attributes):
    extractors = _read_extractors(manager)
    _id = gen_id(disallow=set(extractors.keys()))
    attrs = attributes.get('data', {}).get('attributes', {})
    if 'type' not in attrs:
        attrs['type'] = 'type'
    if 'value' not in attrs:
        attrs['value'] = 'text'
    extractor = _build_extractor(manager, attrs, _id)
    extractors[_id] = extractor
    manager.savejson(extractors, ['extractors'])
    return ExtractorSchema(context=ctx(manager)).dump(extractors[_id]).data


def update_extractor(manager, extractor_id, attributes):
    extractors = _read_extractors(manager)
    extractor = extractors[extractor_id]
    attrs = attributes.get('data', {}).get('attributes', {})
    if 'value' not in attrs:
        attrs['value'] = extractor.get('regular_expression',
                                       extractor.get('type_extractor'))
    if 'type' not in attrs:
        attrs['type'] = 'regex' if 'regular_expression' in extractor \
            else 'type'
    extractor = _build_extractor(manager, attrs, extractor_id)
    extractors[extractor_id] = extractor
    manager.savejson(extractors, ['extractors'])
    return ExtractorSchema(context=ctx(manager)).dump(extractor).data


def delete_extractor(manager, extractor_id, attributes=None):
    extractors = _read_extractors(manager)
    del extractors[extractor_id]
    manager.savejson(extractors, ['extractors'])
    return ExtractorSchema.empty_data()


def _build_extractor(manager, attributes, extractor_id, add_default=False):
    value, type = attributes.get('value'), attributes.get('type')
    if type == 'type' and value not in EXTRACTOR_TYPES:
        raise BadRequest(
            '"%s" is not an acceptable type. Use one of the following types: '
            '"%s"' % (value, '", "'.join(sorted(EXTRACTOR_TYPES))))
    extractor = _attributes_to_extractor(attributes, extractor_id)
    get_schema_validator('extractor').validate(extractor)
    return extractor


def _attributes_to_extractor(attributes, extractor_id):
    key = 'regular_expression'
    if attributes.get('type') == 'type':
        key = 'type_extractor'
    return {
        'id': extractor_id,
        key: attributes.get('value', '')
    }
