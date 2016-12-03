"""
html page utils
"""
from __future__ import absolute_import

from scrapy.utils.spider import arg_to_iter
from slybot.fieldtypes import FieldTypeManager


_DEFAULT_EXTRACTOR = FieldTypeManager().type_processor_class(u'raw html')()


class cached_property(object):
    """
    A property that is only computed once per instance and then replaces itself
    with an ordinary attribute. Deleting the attribute resets the property.
    Source: https://github.com/bottlepy/bottle/blob/18ea724b6f658943606237e01febc242f7a56260/bottle.py#L162-L173
    """

    def __init__(self, func):
        self.__doc__ = getattr(func, u'__doc__')
        self.func = func

    def __get__(self, obj, cls):
        if obj is None:
            return self
        value = obj.__dict__[self.func.__name__] = self.func(obj)
        return value


def region_id(region, attribute_name='data-tagid'):
    try:
        return region.attributes.get(attribute_name, -1)
    except AttributeError:
        return -1


def load_annotations(extractor):
    for e in arg_to_iter(extractor):
        if hasattr(e, 'annotation') and not hasattr(e, u'extractors'):
            meta = e.annotation.metadata
            if u'attribute' not in meta:
                attribute = [a for a in e.annotation.tag_attributes]
                content = meta.get(u'text-content', u'content')
                attribute, ann = (attribute or [(content, None)])[0]
                if not e.annotation.surrounds_attribute:
                    meta['text-content'] = '#portia-content'
                meta[u'attribute'] = attribute
                if ann is not None:
                    if isinstance(ann, list):
                        ann = ann[0].get(u'field')
                    meta[u'field'] = ann
            if not meta.get(u'field'):
                attr = e.annotation.surrounds_attribute
                if isinstance(attr, list):
                    attr = attr[0].get(u'field')
                meta[u'field'] = attr
            yield e.annotation
        if hasattr(e, u'extractors') and not hasattr(e, u'schema'):
            for sub_e in load_annotations(e.extractors):
                yield sub_e
