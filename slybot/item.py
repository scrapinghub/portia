import hashlib
from collections import defaultdict

from scrapy.item import DictItem, Field
from scrapely.descriptor import ItemDescriptor, FieldDescriptor

from slybot.fieldtypes import FieldTypeManager, ExtractorTypes
from slybot.utils import create_regex_extractor

def get_iblitem_class(schema):
    if not schema:
        schema = {'id': 'item', 'properties': []}
    class IblItem(DictItem):
        fields = defaultdict(dict)
        version_fields = []
        for name, meta in schema['properties']:
            fields[name] = Field(meta)
            if not meta.get("vary", False):
                version_fields.append(name)
        version_fields = sorted(version_fields)
        # like DictItem.__setitem__ but doesn't check the field is declared
        def __setitem__(self, name, value):
            self._values[name] = value
    return IblItem

def create_slybot_item_descriptor(schema):
    field_type_manager = FieldTypeManager()
    if schema is None:
        schema = {'id': 'item', 'properties': ()}
    descriptors = []
    for pname, pdict in schema.get('properties', ()):
        description = pdict.get('description')
        required = not pdict.get('optional', True)
        pclass = field_type_manager.type_processor_class(pdict.get('type'))
        processor = pclass()
        descriptor = SlybotFieldDescriptor(pname, description, processor, required)
        descriptors.append(descriptor)
    return ItemDescriptor(schema['id'], schema.get('description'), descriptors)

class SlybotFieldDescriptor(FieldDescriptor):
    """Extends the scrapely field descriptor to use slybot fieldtypes and
    to be created from a slybot item schema
    """

    def __init__(self, name, description, field_type_processor, required=False):
        """Create a new SlybotFieldDescriptor with the given name and description. 
        The field_type_processor is used for extraction and is publicly available
        """
        FieldDescriptor.__init__(self, name, description, 
            field_type_processor.extract, required)
        # add an adapt method
        self.adapt = field_type_processor.adapt

def create_item_version(item_cls, item):
    """Item version based on hashlib.sha1 algorithm"""
    if not item_cls.version_fields:
        return
    hash = hashlib.sha1()
    for attrname in item_cls.version_fields:
        hash.update(repr(item.get(attrname)))
    return hash.digest()

def apply_extractors(descriptor, extractors, all_extractors):
    field_type_manager = FieldTypeManager()
    for eid in extractors or ():
        extractor_doc = all_extractors[eid]
        field_name = extractor_doc["field_name"]
        if not field_name in descriptor.attribute_map:
            descriptor.attribute_map[field_name] = SlybotFieldDescriptor(field_name, 
                    field_name, field_type_manager.type_processor_class("text"))
        if "regular_expression" in extractor_doc:
            descriptor.attribute_map[field_name].extractor = \
                    create_regex_extractor(extractor_doc["regular_expression"])
        else:
            descriptor.attribute_map[field_name].extractor = \
                    getattr(ExtractorTypes, extractor_doc["builtin_extractor"])

