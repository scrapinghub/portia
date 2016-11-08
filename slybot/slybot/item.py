import hashlib
from collections import defaultdict, namedtuple

from scrapy.item import DictItem, Field, Item
from scrapely.descriptor import ItemDescriptor, FieldDescriptor

from slybot.fieldtypes import FieldTypeManager
FieldProcessor = namedtuple('FieldProcessor', ['name', 'description',
                                               'extract', 'adapt'])


class SlybotItem(DictItem):
    # like DictItem.__setitem__ but doesn't check the field is declared
    def __setitem__(self, name, value):
        self._values[name] = value

    def display_name(self):
        return self._display_name

    @classmethod
    def create_iblitem_class(cls, schema):

        class IblItem(cls, Item):
            ftm = FieldTypeManager()
            fields = defaultdict(dict)
            version_fields = []
            _display_name = schema.get('name')
            for _name, _meta in schema.get('fields', {}).items():
                name = _meta.get('name', _name)
                serializer = ftm.type_processor_serializer(_meta.get('type'))
                if serializer:
                    _meta['serializer'] = serializer
                fields[name] = Field(_meta)
                if not _meta.get("vary", False):
                    version_fields.append(name)
            version_fields = sorted(version_fields)
        return IblItem


def create_slybot_item_descriptor(schema, schema_name=""):
    field_type_manager = FieldTypeManager()
    descriptors = []
    for pname, pdict in schema.get('fields', {}).items():
        required = pdict['required']
        pdisplay_name = pdict.get('name', pname)
        pclass = field_type_manager.type_processor_class(pdict['type'])
        processor = pclass()
        descriptor = SlybotFieldDescriptor(pname, pdisplay_name, processor,
                                           required)
        descriptors.append(descriptor)
    return SlybotItemDescriptor(schema_name,
                                schema.get('name', schema_name),
                                descriptors)


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
        self._processor = field_type_processor

    @property
    def processor(self):
        return FieldProcessor(self._processor.name,
                              self._processor.description,
                              self.extractor, self.adapt)

    def __str__(self):
        return "SlybotFieldDescriptor(%s, %s)" % (self.name,
                                                  self._processor.name)


class SlybotItemDescriptor(ItemDescriptor):
    def __str__(self):
        return "SlybotItemDescriptor(%s)" % self.name

    def copy(self):
        attribute_descriptors = []
        for d in self.attribute_map.values():
            attribute_descriptors.append(
                SlybotFieldDescriptor(d.name, d.description, d.processor,
                                      d.required))
        return SlybotItemDescriptor(self.name, self.description,
                                    attribute_descriptors)


def create_item_version(item):
    """Item version based on hashlib.sha1 algorithm"""
    if not item.version_fields:
        return
    _hash = hashlib.sha1()
    for attrname in item.version_fields:
        _hash.update(repr(item.get(attrname)).encode('utf-8'))
    return _hash.digest()
