import re
from itertools import groupby

from scrapely.extractors import htmlregion

from slybot.fieldtypes import FieldTypeManager
from slybot.item import SlybotFieldDescriptor

def create_regex_extractor(pattern):
    """Create extractor from a regular expression.
    Only groups from match are extracted and concatenated, so it
    is required to define at least one group. Ex:
    >>> extractor = create_regex_extractor("(\d+).*(\.\d+)")
    >>> extractor(u"The price of this product is <div>45</div> </div class='small'>.50</div> pounds")
    u'45.50'
    """
    ereg = re.compile(pattern, re.S)
    def _extractor(txt):
        m = ereg.search(txt)
        if m:
            return htmlregion("".join(filter(None, m.groups())))
    
    return _extractor

class PipelineExtractor:
    def __init__(self, *extractors):
        self.extractors = extractors
    
    def __call__(self, value):
        for extractor in self.extractors:
            value = extractor(value or "")
        return value
    

def apply_extractors(descriptor, template_extractors_ids, extractors):
    field_type_manager = FieldTypeManager()
    template_extractors = [extractors[eid] for eid in template_extractors_ids]
    for field_name, field_extractors in groupby(template_extractors or (), lambda x: x["field_name"]):
        equeue = []
        for extractor_doc in field_extractors:
            if "regular_expression" in extractor_doc:
                equeue.append(create_regex_extractor(extractor_doc["regular_expression"]))
            elif "type_extractor" in extractor_doc: # overrides default one
                descriptor.attribute_map[field_name] = SlybotFieldDescriptor(field_name, 
                    field_name, field_type_manager.type_processor_class(extractor_doc["type_extractor"])())
        if not field_name in descriptor.attribute_map:
            # if not defined type extractor, use text type by default, as it is by far the most commonly used
            descriptor.attribute_map[field_name] = SlybotFieldDescriptor(field_name, 
                    field_name, field_type_manager.type_processor_class("text")())
            
        if equeue:
            equeue.insert(0, descriptor.attribute_map[field_name].extractor)
            descriptor.attribute_map[field_name].extractor = PipelineExtractor(*equeue)

