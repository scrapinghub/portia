import copy

import six

from collections import defaultdict
from itertools import chain

from parsel import SelectorList
from scrapely.extraction.regionextract import TextRegionDataExtractor
from scrapely.htmlpage import HtmlPageParsedRegion, HtmlPageRegion
from scrapely.extractors import htmlregion
from scrapy.utils.spider import arg_to_iter
from slybot.item import SlybotFieldDescriptor

from w3lib.html import remove_tags

from .utils import (cached_property, load_annotations, region_id,
                    _DEFAULT_EXTRACTOR)
from .exceptions import ItemNotValidError, MissingRequiredError


def _compose(f, g):
    """given unary functions f and g, return a function that computes f(g(x))
    """
    def _exec(x):
        ret = g(x)
        if ret is not None:
            ret = HtmlPageRegion(ret.htmlpage, remove_tags(ret.text_content))
            return f(ret)
        return None
    return _exec


class ItemProcessor(object):
    """Processor for extracted data."""
    ignore = False
    should_overwrite = True
    selector_modes = (u'css', u'xpath')

    def __init__(self, data, extractor, regions, parent_region=None,
                 htmlpage=None):
        self.annotation = extractor.annotation
        self.id = self.annotation.metadata.get(u'id')
        self.regions = arg_to_iter(regions)
        parent_region = arg_to_iter(parent_region) if parent_region else []
        self.parent_region = parent_region
        self.modifiers = extractor.modifiers or {}
        self.schema = extractor.schema or {}
        if hasattr(htmlpage, u'htmlpage'):
            htmlpage = htmlpage.htmlpage
        self.htmlpage = htmlpage
        self.annotations = list(
            load_annotations(getattr(extractor, 'extractors', [])))
        self.fields = self._process_fields(data)

    @cached_property
    def field(self):
        """Field display name."""
        return getattr(self.descriptor, 'description', self.name)

    @cached_property
    def descriptor(self):
        """Field descriptor and adaptor."""
        return getattr(self.schema, u'attribute_map', {}).get(self.name)

    @cached_property
    def name(self):
        """Field unique name."""
        return self.annotation.metadata.get(u'field')

    @cached_property
    def description(self):
        """Field display name."""
        return self.field

    @property
    def region_id(self):
        return ', '.join(str(r) for r in self.regions)

    @cached_property
    def metadata(self):
        return self.annotation.metadata

    def attribute_query(self, metadata):
        """Extract attribute or content from a region."""
        content_field = metadata.get(u'text-content', u'content')
        attribute = metadata.get(u'attribute', content_field)
        if attribute == content_field:
            return u'self::node()'
        return u'@%s' % attribute

    def _process_fields(self, data):
        """Convert extracted data into ItemField fields."""
        schema, modifiers, page = self.schema, self.modifiers, self.htmlpage
        fields = {}
        for field_num, (field, value) in enumerate(self._normalize_data(data)):
            # Repeated Fields and nested items support
            if hasattr(field, 'fields'):
                self._add_item(field, fields)
                continue
            # New style annotation field
            elif isinstance(field, dict):
                field_id = field.get(u'id') or field_num
            # Legacy attribute, field mapping annotation
            else:
                field_id = field_num
                field = {u'field': field, u'id': field_id,
                         u'attribute': u'content'}
            field_cls = self._field_class(field['field'])
            fields[field_id] = field_cls(value, field, schema, modifiers, page)
        return fields

    def _field_class(self, field):
        if not field or field.startswith('#'):
            return ScrapelyField
        if field.startswith('_'):
            return ProcessedField
        return ItemField

    def _add_item(self, item, fields=None):
        fields = self.fields if fields is None else fields
        child = None
        if len(item.fields) == 1:
            child = next(six.itervalues(item.fields))
        if child and item.descriptor == child.extractor:
            fields[child.id] = child
        else:
            fields[item.name] = item

    def _normalize_data(self, data):
        """Normalize extracted data for conversion into ItemFields."""
        if isinstance(data, dict):
            data = data.items()
        elif data and not isinstance(data[0], (tuple, dict)):
            data = [data]
        for i in data:
            if hasattr(i, u'items'):
                i = i.items()
            else:
                i = (i,)
            other_fields = []
            for fields in chain(arg_to_iter(i), other_fields):
                try:
                    fields, value = fields
                except ValueError:
                    for field in fields:
                        if hasattr(field, 'fields'):
                            yield field, None
                        elif len(field) == 2:
                            # Queue repeated fields for normalization
                            other_fields.append(field)
                    continue
                if isinstance(fields, list):
                    # More than a one attribute for a single annotation
                    for field in fields:
                        yield field, value
                elif isinstance(fields, six.string_types):
                    # Legacy field support
                    yield {u'field': fields, u'attribute': u'content'}, value
                else:
                    yield fields, value

    def process(self, selector=None, include_meta=False):
        """Extract CSS and XPath annotations and dump item."""
        if selector is not None:
            self._process_selectors(selector)
        return self.dump(include_meta, validate=True)

    def _process_selectors(self, selector):
        selector_annotations = self._selector_annotations()
        field_annotations = (
            f.metadata for f in self.fields.values()
            if hasattr(f, 'selection_mode') and
            f.selection_mode in self.selector_modes
        )
        for field_id, field in self.fields.items():
            if hasattr(field, 'fields'):
                value = field.process(selector)
                if not value:
                    continue
                meta = {'id': field.id, 'field': field.name,
                        'attribute': 'content'}
                self.fields[field_id] = ProcessedField(
                    value, meta, self.schema,
                    self.modifiers, self.htmlpage)
        all_selector_annotations = list(
            chain(selector_annotations, field_annotations))
        if all_selector_annotations:
            self._process_css_and_xpath(all_selector_annotations, selector)

    def _selector_annotations(self):
        for annotation in self.annotations:
            meta = annotation.metadata
            if meta.get(u'selection_mode') not in self.selector_modes:
                continue
            surrounds = arg_to_iter(annotation.surrounds_attribute) or []
            tags = chain(*(a for _, a in annotation.tag_attributes))
            for attribute in chain(surrounds, tags):
                new_attribute = {k: v for k, v in meta.items()}
                new_attribute.update(attribute)
                yield new_attribute

    def _process_css_and_xpath(self, annotations, selector):
        schema, modifiers, page = self.schema, self.modifiers, self.htmlpage
        region_ids = list(filter(bool, (region_id(r) for r in self.regions)))
        query = ','.join(('[data-tagid="%s"]' % rid for rid in region_ids))
        parents = {e._root for e in selector.css(query)}
        containers = ()
        if self.parent_region:
            pquery = '[data-tagid="%s"]' % self.parent_region
            containers = {e._root for e in selector.css(pquery)}
        for i, a in enumerate(annotations, start=len(self.fields)):
            mode = a.get(u'selection_mode')
            query = a.get(mode if mode != 'css' else u'selector')
            try:
                elems = self._pick_elems(
                    getattr(selector, mode)(query), parents, containers)
            except ValueError:
                continue
            for elem in elems:
                elem._root.attrib.pop('data-tagid', None)
            extracted = elems.xpath(self.attribute_query(a)).extract()
            value = list(map(six.text_type.strip, extracted))
            if value:
                aid = a.get(u'id') or i
                value = [htmlregion(v) for v in arg_to_iter(value)]
                self.fields[aid] = ItemField(value, a, schema, modifiers, page)

    def _pick_elems(self, elements, parents, containers):
        closest_elements, closest_set = SelectorList(), set()
        other_elements = SelectorList()
        for element in elements:
            try:
                element_parents = element._root.iterancestors()
            except AttributeError:
                continue
            for parent in element_parents:
                if parent in parents:
                    closest_elements.append(element)
                    closest_set.add(element)
                if parent in containers and element not in closest_set:
                    break
            else:
                other_elements.append(element)
        if closest_elements:
            return closest_elements
        elif other_elements:
            return other_elements
        return elements

    def merge(self, other):
        """Merge this instance with another ItemProcessor instance

        Add additional regions.
        Add additional annotations.
        Add new fields from the other ItemProcessor.
        Merge existing field values.
        """
        for region in other.regions:
            if region not in self.regions:
                self.regions.append(region)
        aids = {a.metadata.get(u'id') for a in self.annotations}
        other_aids = {a.metadata.get(u'id') for a in other.annotations}
        missing_ids = other_aids - aids
        for annotation in other.annotations:
            id_ = annotation.metadata.get(u'id')
            if id_ and id_ in missing_ids:
                self.annotations.append(annotation)
        if other.name:
            self._add_item(other)
            return
        for field_id, field in other.fields.items():
            if field_id in self.fields:
                self.fields[field_id].merge(field)
            else:
                self.fields[field_id] = field

    def dump(self, include_meta=False, validate=False):
        """Dump processed fields into a new item."""
        try:
            return self._dump(include_meta, validate)
        except (MissingRequiredError, ItemNotValidError):
            return {}

    def _dump(self, include_meta=False, validate=False):
        item = defaultdict(list)
        meta = defaultdict(dict)
        schema_id = getattr(self.schema, u'id', None)
        for field in self.fields.values():
            value = field.dump()
            if not value or field.ignore:
                continue
            if field.should_overwrite:
                item[field.field] = value
            else:
                item[field.field].extend(value)
            if include_meta:
                meta[field.id].update(dict(schema=schema_id, **field.metadata))
        if validate:
            self._validate(item)

        # Rename fields to their human readable names
        item = self._item_with_names(item)
        if include_meta:
            item[u'_meta'] = meta
        if u'_type' not in item:
            _type = getattr(self.schema, u'description', schema_id)
            if _type:
                item[u'_type'] = _type
        return item

    def _validate(self, item):
        item_fields = self._item_with_names(item, u'name')
        # Bring keys from nested items into primary item for required check
        for key, value in list(item_fields.items()):
            if isinstance(value, dict):
                for sub_key in value:
                    item_fields[sub_key] = True
        # Check if a pre prcessed item has been provided
        if u'_type' in item_fields:
            return item_fields
        if (hasattr(self.schema, u'_item_validates') and
                not self.schema._item_validates(item_fields)):
            raise ItemNotValidError
        if all(fname[0] == '_' or fname == 'url' for fname in item_fields):
            raise ItemNotValidError

    def _item_with_names(self, item, attribute=u'description'):
        item_dict = {}
        for field, value in item.items():
            if not (field and value):
                continue
            if hasattr(field, attribute):
                item_dict[getattr(field, attribute)] = value
            else:
                item_dict[field] = value
        return item_dict

    def __getitem__(self, key):
        values = []
        for field in self.fields.values():
            if hasattr(field.field, u'get'):
                field_name = field.field.get(u'field')
            else:
                field_name = field.field
            if field_name == key:
                values.extend(field.dump())
        return values

    def __bool__(self):
        return bool(self.dump())

    __nonzero__ = __bool__

    def __len__(self):
        return len(self.fields)

    def __hash__(self):
        return hash(str(self.id) + str(self.region_id))

    def __setitem__(self, key, value):
        self.fields[key] = ProcessedField(value, {u'id': key, u'field': key,
                                                  u'attribute': u'content'})

    def __str__(self):
        return u'%s, %s' % (self.id, self.region_id)

    def __repr__(self):
        return u'%s(%s, %s)' % (self.__class__.__name__, str(self),
                                repr(self.fields))


class ItemField(object):
    should_overwrite = False

    def __init__(self, value, meta, schema=None, modifiers=None,
                 htmlpage=None):
        self.htmlpage = htmlpage
        self.value = value
        self._meta = meta
        self.id = meta.get(u'id')
        self._field = meta[u'field']
        self.attribute = meta[u'attribute']
        self.selection_mode = meta.get(u'selection_mode', u'auto')
        self.extractor, self.adaptors = self._load_extractors(
            self._field, schema, modifiers)

    @cached_property
    def field(self):
        return self

    @cached_property
    def ignore(self):
        if not self._field:
            return True
        return False

    @cached_property
    def description(self):
        """Field display name."""
        return getattr(self.extractor, u'description', self._field)

    @cached_property
    def name(self):
        """Field unique name."""
        return getattr(self.extractor, u'name', self._field)

    @cached_property
    def metadata(self):
        meta = {k: v for k, v in self._meta.items() if k not in
                (u'name', u'value', u'schema')}
        meta['field'], meta['value'], meta['processed'] = (
            self._field, self.value, self.dump())
        return meta

    @cached_property
    def required(self):
        return self._meta.get('required') or False

    def dump(self):
        """Process and adapt extracted data for field."""
        values = self._process()
        return self._adapt(values)

    def merge(self, other):
        try:
            self.value.extend(other.value)
        except AttributeError:
            self.value = other.value

    def _load_extractors(self, field, schema, modifiers):
        field, _meta = self._field, self._meta
        extractors = []
        try:
            field_extraction = schema.attribute_map.get(field)
        except AttributeError:
            field_extraction = None
        if field_extraction is None:
            field_extraction = SlybotFieldDescriptor(field, field,
                                                     _DEFAULT_EXTRACTOR)
        if u'pre_text' in _meta or u'post_text' in _meta:
            text_extractor = TextRegionDataExtractor(
                _meta.get(u'pre_text', u''),
                _meta.get(u'post_text', u''))
            field_extraction = copy.deepcopy(field_extraction)
            field_extraction.extractor = _compose(
                field_extraction.extractor, text_extractor.extract)
        extractors = _meta.get(u'extractors', [])
        if isinstance(extractors, dict):
            extractors = extractors.get(field, [])
        adaptors = []
        for extractor in extractors:
            if extractor in modifiers:
                adaptors.append(modifiers[extractor])
        return field_extraction, adaptors

    def _process(self):
        values = []
        for value in arg_to_iter(self.value):
            if (isinstance(value, (HtmlPageParsedRegion, HtmlPageRegion)) and
                    hasattr(self.extractor, u'extractor')):
                value = self.extractor.extractor(value)
            if value:
                values.append(value)
        if hasattr(self.extractor, u'adapt'):
            values = [self.extractor.adapt(x, self.htmlpage) for x in values
                      if x and not isinstance(x, (dict, ItemProcessor))]
        else:
            values = list(filter(bool, values))
        return values

    def _adapt(self, values):
        for adaptor in self.adaptors:
            if values:
                values = [adaptor(v, self.htmlpage) for v in values if v]
        if self.required and not values:
            raise MissingRequiredError
        return values

    def __hash__(self):
        return hash(str(self.id) + str(self._field))

    def __str__(self):
        return u'%s: %s | id=%s' % (self.description, self.dump(), self.id)

    def __repr__(self):
        return u'%s(%s, field=%s, extractor=%s, adaptors=%s)' % (
            self.__class__.__name__, str(self), self._field, self.extractor,
            self.adaptors)


class ProcessedField(ItemField):
    """Field without any transformations."""
    should_overwrite = True

    @cached_property
    def field(self):
        return self._field

    def dump(self):
        return self.value


class ScrapelyField(ItemField):
    """Field used for guiding extraction but not used for extracting data."""
    ignore = True
