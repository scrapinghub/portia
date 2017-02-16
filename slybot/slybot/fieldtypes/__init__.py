"""
Field Types

Spiders extracts items of a given type. These item types are defined by a
schema, which specifies the type of each field in the item. This module
contains FieldProcessor implementations, which are the classes responsible for
custom processing of these types.

We keep the types of scrapers supported flexible and allow different methods
for each. In the future, we expect many different types, for example one might
be a mechanical turk scraper and the fields would have to do user validation
and provide error messages.
"""
from .text import (
    RawFieldTypeProcessor,
    TextFieldTypeProcessor,
    SafeHtmlFieldTypeProcessor
)
from .images import ImagesFieldTypeProcessor
from .url import UrlFieldTypeProcessor
from .number import NumberTypeProcessor
from .point import GeoPointFieldTypeProcessor
from .price import PriceTypeProcessor
from .date import DateTimeFieldTypeProcessor


class FieldTypeManager(object):
    _TYPEMAP = dict((c.name, c) for c in (
        RawFieldTypeProcessor, TextFieldTypeProcessor,
        ImagesFieldTypeProcessor, NumberTypeProcessor,
        UrlFieldTypeProcessor, SafeHtmlFieldTypeProcessor,
        GeoPointFieldTypeProcessor, PriceTypeProcessor,
        DateTimeFieldTypeProcessor
    ))
    _names = sorted(_TYPEMAP.keys())

    def available_type_names(self):
        """Find the names of all field types available. """
        return self._names

    def type_processor_class(self, name):
        """Retrieve the class for the given extractor

        This can be useful to introspect on the constructor arguments. If no
        suitable type is found, it will default to the RawFieldTypeProcessor
        (no processing of extracted data is done).
        """
        return self._TYPEMAP.get(name, RawFieldTypeProcessor)

    def type_processor_serializer(self, name):
        processor = self._TYPEMAP.get(name, RawFieldTypeProcessor)
        return getattr(processor, 'serializer', None)

    def all_processor_classes(self):
        """Retrieve all processor classes registered"""
        return list(self._TYPEMAP.values())
