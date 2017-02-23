import re
import six

from scrapely.extractors import htmlregion
from scrapely.htmlpage import HtmlPageRegion

from slybot.fieldtypes import FieldTypeManager
from slybot.item import SlybotFieldDescriptor, SlybotItemDescriptor


def create_regex_extractor(pattern):
    r"""Create extractor from a regular expression.

    Only groups from match are extracted and concatenated, so it
    is required to define at least one group. Ex:
    >>> extractor = create_regex_extractor("(\d+).*(\.\d+)")
    >>> extractor(u"The price is <b>45</b></i class='sm'>.50</i> $")
    u'45.50'
    """
    ereg = re.compile(pattern, re.S)

    def _extractor(txt, htmlpage=None):
        if txt is None:
            return
        m = ereg.search(txt)
        if m:
            return htmlregion(u"".join([g for g in m.groups() or m.group()
                                        if g]))

    name = u"Regex: %s" % pattern
    if six.PY2:
        name = name.encode('utf-8')
    _extractor.__name__ = name
    return _extractor


def create_type_extractor(_type):
    types = FieldTypeManager()
    extractor = types.type_processor_class(_type)()

    def _extractor(txt, htmlpage=None):
        if txt is None:
            return
        page = getattr(htmlpage, 'htmlpage', htmlpage)
        if not hasattr(txt, 'text_content'):
            txt = HtmlPageRegion(page, txt)
        data = extractor.extract(txt)
        if data:
            return extractor.adapt(data, page)
    name = (u"Type Extractor: %s" % _type)
    if six.PY2:
        name = name.encode('utf-8')
    _extractor.__name__ = name
    return _extractor


class PipelineExtractor:
    def __init__(self, *extractors):
        self.extractors = extractors

    def __call__(self, value):
        for extractor in self.extractors:
            value = extractor(value) if value else value
        return value

    @property
    def __name__(self):
        return repr(self.extractors)


def apply_extractors(descriptor, template_extractors, extractors):
    type_processor_class = FieldTypeManager().type_processor_class
    if isinstance(template_extractors, dict):
        template_extractors = template_extractors.items()
    attribute_map = descriptor.attribute_map
    for field_name, field_extractors in template_extractors:
        equeue = []
        for eid in field_extractors:
            e_doc = extractors.get(eid, {})
            if "regular_expression" in e_doc:
                equeue.append(
                    create_regex_extractor(e_doc["regular_expression"]))
            elif "type_extractor" in e_doc:  # overrides default one
                try:
                    display_name = attribute_map[field_name].description
                except KeyError:
                    display_name = field_name
                field_type = type_processor_class(e_doc["type_extractor"])()
                attribute_map[field_name] = SlybotFieldDescriptor(
                    field_name, display_name, field_type)
        if field_name not in attribute_map:
            # if not defined type extractor, use text type by default, as it is
            # by far the most commonly used
            attribute_map[field_name] = SlybotFieldDescriptor(
                field_name, field_name,
                type_processor_class("text")())

        if equeue:
            equeue.insert(0, attribute_map[field_name].extractor)
            attribute_map[field_name].extractor = PipelineExtractor(*equeue)


def add_extractors_to_descriptors(descriptors, extractors):
    new_extractors = {}
    for _id, data in extractors.items():
        if "regular_expression" in data:
            extractor = create_regex_extractor(data['regular_expression'])
        else:
            extractor = create_type_extractor(data['type_extractor'])
        new_extractors[_id] = extractor
    for descriptor in descriptors.values():
        if isinstance(descriptor, SlybotItemDescriptor):
            descriptor.extractors = new_extractors
