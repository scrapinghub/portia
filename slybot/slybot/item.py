import hashlib
from collections import defaultdict

from scrapy.item import DictItem, Field
from scrapely.descriptor import ItemDescriptor, FieldDescriptor

from slybot.fieldtypes import FieldTypeManager


class SlybotItem(DictItem):
    # like DictItem.__setitem__ but doesn't check the field is declared
    def __setitem__(self, name, value):
        self._values[name] = value

    @classmethod
    def create_iblitem_class(cls, schema):
        class IblItem(cls):
            fields = defaultdict(dict)
            version_fields = []
            for _name, _meta in schema['fields'].items():
                fields[_name] = Field(_meta)
                if not _meta.get("vary", False):
                    version_fields.append(_name)
            version_fields = sorted(version_fields)
        return IblItem


def create_slybot_item_descriptor(schema):
    field_type_manager = FieldTypeManager()
    descriptors = []
    for pname, pdict in schema['fields'].items():
        required = pdict['required']
        pclass = field_type_manager.type_processor_class(pdict['type'])
        processor = pclass()
        descriptor = SlybotFieldDescriptor(pname, pname, processor, required)
        descriptors.append(descriptor)
    return ItemDescriptor("", "", descriptors)


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


def create_item_version(item):
    """Item version based on hashlib.sha1 algorithm"""
    if not item.version_fields:
        return
    _hash = hashlib.sha1()
    for attrname in item.version_fields:
        _hash.update(repr(item.get(attrname)))
    return _hash.digest()
