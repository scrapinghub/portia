import pprint
import copy


from collections import defaultdict, namedtuple
from cStringIO import StringIO
from itertools import groupby, chain
from operator import itemgetter
import operator

from numpy import array
from six.moves import xrange

from scrapely.extraction import (InstanceBasedLearningExtractor,
                                 _annotation_count)
from scrapely.extraction.pageparsing import (parse_extraction_page,
                                             TemplatePageParser)
from scrapely.extraction.pageobjects import (
    TokenDict, TemplatePage, AnnotationTag, PageRegion
)
from scrapely.extraction.regionextract import (
    RecordExtractor, BasicTypeExtractor, TraceExtractor,
    TemplatePageExtractor, RepeatedDataExtractor, AdjacentVariantExtractor,
    TextRegionDataExtractor, labelled_element
)
from scrapely.extraction.similarity import (
    similar_region, longest_unique_subsequence, first_longest_subsequence
)
from scrapely.htmlpage import HtmlTagType, HtmlPageParsedRegion, HtmlPageRegion
from scrapy.utils.spider import arg_to_iter
from slybot.fieldtypes import FieldTypeManager
from slybot.item import SlybotFieldDescriptor

from w3lib.html import remove_tags


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


MAX_SEARCH_DISTANCE_MULTIPLIER = 3
MIN_TOKEN_LENGTH_BEFORE_TRUNCATE = 3
MIN_JUMP_DISTANCE = 0.7
MAX_RELATIVE_SEPARATOR_MULTIPLIER = 0.7
_DEFAULT_EXTRACTOR = FieldTypeManager().type_processor_class('raw html')()
Region = namedtuple('Region', ['score', 'start_index', 'end_index'])
container_id = lambda x: x.annotation.metadata.get('container_id')


def _int_cmp(a, op, b):
    op = getattr(operator, op)
    a = -float('inf') if a is None else a
    b = -float('inf') if b is None else b
    return op(a, b)

class MissingRequiredError(Exception):
    pass


def group_tree(tree, container_annotations):
    result = {}
    get_first = itemgetter(0)
    for name, value in groupby(sorted(tree, key=get_first), get_first):
        value = list(value)
        if len(value) <= 1:
            result[name] = container_annotations.get(name)
        else:
            result[name] = group_tree([l[1:] for l in value if len(l) > 1],
                                      container_annotations)
    return result


def parse_template(token_dict, template_html, descriptors):
    """Create an TemplatePage object by parsing the annotated html."""
    parser = SlybotTemplatePageParser(token_dict)
    parser.feed(template_html)
    return parser.to_template(descriptors)


def _count_annotations(extractor):

    def count(extractors):
        result = 0
        for ex in extractors:
            while (hasattr(ex, 'extractors') and
                   isinstance(ex, BaseContainerExtractor)):
                return count(ex.extractors)
            result += len(ex.extractors)
        return result
    return count(extractor.extractors)


class SlybotTemplatePageParser(TemplatePageParser):
    def to_template(self, descriptors=None):
        if self.labelled_tag_stacks:
            tags = sorted(
                filter(bool, chain(*self.labelled_tag_stacks.values())),
                key=lambda a: a.start_index, reverse=True)
            try:
                next_tag_index = self.annotations[-1].end_index + 1
            except IndexError:
                next_tag_index = self.next_tag_index - len(tags) - 2
            for tag in tags:
                tag.end_index = next_tag_index
                next_tag_index += 1
            self.annotations.extend(tags)
        if descriptors is None:
            descriptors = {}
        return SlybotTemplatePage(self.html_page, self.token_dict,
                                  self.token_list, self.annotations,
                                  self.html_page.page_id, self.ignored_regions,
                                  self.extra_required_attrs, descriptors)


class SlybotTemplatePage(TemplatePage):
    __slots__ = ('descriptors', 'modifiers')

    def __init__(self, htmlpage, token_dict, page_tokens, annotations,
                 template_id=None, ignored_regions=None, extra_required=None,
                 descriptors=None):
        self.descriptors = descriptors
        self.modifiers = {}
        for descriptor in descriptors.values():
            self.modifiers.update(getattr(descriptor, 'extractors', {}))
        super(SlybotTemplatePage, self).__init__(
            htmlpage, token_dict, page_tokens, annotations, template_id,
            ignored_regions, extra_required)

    def descriptor(self, descriptor_name=None):
        if descriptor_name is None:
            descriptor_name = '#default'
        return self.descriptors.get(descriptor_name, {})


class BaseExtractor(BasicTypeExtractor):
    def __init__(self, annotation, attribute_descriptors=None):
        self.annotation = annotation
        if annotation.surrounds_attribute:
            self.content_validate = lambda x: x
            self.extract = self._extract_content
            if annotation.annotation_text:
                start = annotation.annotation_text.start_text
                end = annotation.annotation_text.follow_text
                self.content_validate = TextRegionDataExtractor(
                    start, end).extract

        if annotation.tag_attributes:
            self.tag_data = []
            for (tag_attr, extraction_attr) in annotation.tag_attributes:
                self.tag_data.append((lambda x: x, tag_attr, extraction_attr))
            self.extract = self._extract_both if \
                annotation.surrounds_attribute else self._extract_attribute

    @classmethod
    def _create_basic_extractor(cls, annotation, attribute_descriptors):
        return cls(annotation, attribute_descriptors)

    def __str__(self):
        messages = [self.__class__.__name__, '(']
        annotation = self.annotation
        messages.append(self.annotation.surrounds_attribute or '')

        if annotation.tag_attributes:
            if annotation.surrounds_attribute:
                messages.append(';')
            for (f, ta, ea) in self.tag_data:
                messages += [ea, ': attribute "', ta, '"']
        start, end = annotation.start_index, annotation.end_index
        messages.append(', template[%s:%s])' % (start, end))
        return ''.join(map(str, messages))


class SlybotRecordExtractor(RecordExtractor):
    def extract(self, page, start_index=0, end_index=None,
                ignored_regions=None, **kwargs):
        """extract data from an extraction page

        The region in the page to be extracted from may be specified using
        start_index and end_index
        """
        if ignored_regions is None:
            ignored_regions = []
        extractors = sorted(self.extractors + ignored_regions,
                            key=lambda x: labelled_element(x).start_index)
        _, _, attributes = self._doextract(page, extractors + ignored_regions,
                                           start_index,
                                           end_index, **kwargs)
        return list(attributes)

    def _doextract(self, page, extractors, start_index, end_index,
                   nested_regions=None, ignored_regions=None, **kwargs):
        # reorder extractors leaving nested ones for the end and separating
        # ignore regions
        nested_regions = nested_regions or []
        ignored_regions = ignored_regions or []
        first_extractor, following_extractors = extractors[0], extractors[1:]
        while (following_extractors and
               _int_cmp(
                labelled_element(following_extractors[0]).start_index, 'lt',
                labelled_element(first_extractor).end_index)):
            ex = following_extractors.pop(0)
            labelled = labelled_element(ex)
            if (isinstance(labelled, AnnotationTag) or
                (nested_regions and
                 _int_cmp(labelled_element(nested_regions[-1]).start_index, 'lt', labelled.start_index) and
                 _int_cmp(labelled.start_index, 'lt', labelled_element(nested_regions[-1]).end_index))):
                nested_regions.append(ex)
            else:
                ignored_regions.append(ex)
        lelem = labelled_element
        extracted_data = []
        # end_index is inclusive, but similar_region treats it as exclusive
        end_region = None if end_index is None else end_index + 1
        start_region = None if start_index is None else start_index - 1
        labelled = lelem(first_extractor)
        try:
            score, pindex, sindex = similar_region(
                page.page_tokens, self.template_tokens, labelled, start_region,
                end_region, self.best_match, **kwargs)
        except IndexError:
            start_region, end_region = start_index, end_index
            score, pindex, sindex = similar_region(
                page.page_tokens, self.template_tokens, labelled, start_region,
                end_region, self.best_match, **kwargs)

        if score > 0:
            if isinstance(labelled, AnnotationTag):
                similar_ignored_regions = []
                start = pindex
                for i in ignored_regions:
                    s, p, e = similar_region(
                        page.page_tokens, self.template_tokens, i, start,
                        sindex, self.best_match, **kwargs)
                    if s > 0:
                        similar_ignored_regions.append(PageRegion(p, e))
                        start = e or start
                extracted_data = first_extractor.extract(
                    page, pindex, sindex, similar_ignored_regions, **kwargs)
            if following_extractors:
                previous_extraction = start_region or sindex
                if previous_extraction:
                    kwargs['previous'] = previous_extraction + 1
                _, _, following_data = self._doextract(
                    page, following_extractors, sindex or start_region,
                    end_index, **kwargs)
                extracted_data += following_data
            if nested_regions:
                _, _, nested_data = self._doextract(
                    page, nested_regions, pindex, sindex, **kwargs)
                extracted_data += nested_data
        elif following_extractors:
            end_index, _, following_data = self._doextract(
                page, following_extractors, start_index, end_index, **kwargs)
            if end_index is not None:
                pindex, sindex, extracted_data = self._doextract(
                    page, [first_extractor], start_region, end_index,
                    nested_regions, ignored_regions, **kwargs
                )
                if extracted_data and sindex:
                    kwargs['previous'] = sindex + 1
            extracted_data += following_data
        elif nested_regions:
            _, _, nested_data = self._doextract(
                page, nested_regions, start_index, end_index, **kwargs)
            extracted_data += nested_data

        if (hasattr(first_extractor, 'annotation') and
                first_extractor.annotation):
            annotation = first_extractor.annotation or []
            content = annotation.surrounds_attribute or []
            attributes = annotation.tag_attributes
            attrs = chain(content, *(a for _, a in attributes))
            extracted_ids = {a['id'] for annos, _ in extracted_data
                             for a in annos
                             if isinstance(a, dict) and 'id' in a}
            if (any(isinstance(k, dict) and k.get('required') and
                    k.get('id') not in extracted_ids for k in attrs)):
                raise MissingRequiredError()
        return pindex, sindex, extracted_data


class BaseContainerExtractor(object):
    _extractor_classes = [
        RepeatedDataExtractor,
        AdjacentVariantExtractor,
        RepeatedDataExtractor,
        AdjacentVariantExtractor,
        RepeatedDataExtractor,
        RecordExtractor,
    ]

    def __init__(self, extractors, template):
        schema_name = None
        if hasattr(self, 'annotation'):
            schema_name = self.annotation.metadata.get('schema_id')
        self.schema = template.descriptor(schema_name).copy()
        self.modifiers = template.modifiers
        extra_requires = getattr(self, 'extra_requires', [])
        self.extra_requires = extra_requires
        if hasattr(self.schema, '_required_attributes'):
            requires = list(extra_requires) + self.schema._required_attributes
            self.schema._required_attributes = requires

    @classmethod
    def apply(cls, template, extractors):
        # Group containers and get container info
        container_info = cls._get_container_data(extractors)
        containers, container_annos, non_container_annos = container_info
        # Build extraction tree
        extraction_tree = cls._build_extraction_tree(containers)
        tree = group_tree(extraction_tree, container_annos)

        # Build containerized extractors
        container_extractors = cls._build_containerized_extractors(
            containers, container_annos, template, tree)
        return non_container_annos + container_extractors

    def _build_extractors(self, extractors, containers, container_contents,
                          template):
        new_extractors = []
        annotation = None
        if isinstance(extractors, list):  # Bottom of extraction tree
            self.extra_requires = set()
            for ex in extractors:
                fields = ex.annotation.metadata.get('required_fields', [])
                self.extra_requires.update(fields)
            new_extractors.extend(
                SlybotRecordExtractor.apply(template, extractors))
        else:
            for container_name, container_data in (extractors or {}).items():
                annotation = self._find_annotation(template, container_name)
                if annotation.metadata.get('item_container'):
                    self._add_new_container(
                        annotation, new_extractors, container_data, template,
                        containers, container_contents)
        if not hasattr(self, 'annotation'):
            self.annotation = None
        if annotation:
            self.annotation = annotation
        elif new_extractors and self.annotation is None:
            self.annotation = new_extractors[0].annotation
        return new_extractors

    @staticmethod
    def _get_container_data(extractors):
        """
        Find information about all containers.

        Group all annotations by container.
        Group all annotations without a container.
        """
        # Get information about nested data
        containers = dict((x.annotation.metadata['id'], x)
                          for x in extractors
                          if x.annotation.metadata.get('item_container'))
        container_annos = defaultdict(list)
        non_container_annos = []
        for con_id, annotation in groupby(extractors, container_id):
            annotation = list(annotation)
            # Handle repeated container deletion but not parent container
            if (con_id and str(con_id).endswith('#parent') and
                    con_id not in containers):
                con_id = con_id.strip('#parent')
            if con_id and con_id in containers:
                container_annos[con_id].extend(annotation)
            else:
                non_container_annos.extend([
                    e for e in annotation
                    if e.annotation.metadata.get('id') not in containers
                ])
        return (containers, container_annos, non_container_annos)

    @staticmethod
    def _build_extraction_tree(containers):
        """
        Find the containers path for each sub container.
        """
        extraction_tree = []
        for container in containers.values():
            parent_id = container_id(container)
            path = [container.annotation.metadata['id']]
            parent = container
            if parent_id:
                while container_id(parent):
                    parent_id = container_id(parent)
                    if parent_id in path:
                        break  # Avoid cyclical tree
                    path.append(parent_id)
                    parent = containers[parent_id]
            path.reverse()
            extraction_tree.append(path)
        return extraction_tree

    @classmethod
    def _build_containerized_extractors(cls, containers, container_annos,
                                        template, tree):
        """
        Convert container annotation trees into container extractors.
        """
        container_extractors = []
        for container_name, container_data in tree.items():
            if container_name not in containers:
                continue  # Ignore missing containers
            container = container_annos[container_name]
            annotation = None
            for a in template.annotations:
                if a.metadata.get('id') == container_name:
                    annotation = a
                    break
            if container:
                cls._add_new_container(
                    annotation, container_extractors, container_data,
                    template, container_annos, container)
        return container_extractors

    @staticmethod
    def _add_new_container(annotation, extractors, container_data, template,
                           containers, container_contents):
        """
        Create a new container from the provided container information.
        """
        meta = annotation.metadata
        cls = ContainerExtractor
        if meta.get('repeated'):
            cls = RepeatedContainerExtractor
            if meta.get('field'):
                cls = RepeatedFieldsExtractor
        extractors.append(
            cls(container_data, template, annotation=annotation,
                containers=containers, container_contents=container_contents))

    def _find_annotation(self, template, annotation_id):
        """
        Look for an annotation with the given id in the given template
        """
        annotation_id = annotation_id.decode('utf-8')
        for annotation in template.annotations:
            aid = annotation.metadata.get('id', '').decode('utf-8')
            if aid == annotation_id:
                return annotation

    def _validate_and_adapt_item(self, item, htmlpage):
        """
        Look at item extracted by this container and make sure that all
        required fields are extracted, adapted and fields are renamed if
        necessary.
        """
        if u'_type' in item:
            return item
        if isinstance(item, dict):
            for k in self.extra_requires:
                if k.startswith('_sticky'):  # Sticky no longer supported
                    item.pop(k, None)
                    continue
                if k not in item:
                    return {}
        new_item = defaultdict(list)
        if isinstance(item, dict):
            item = item.items()
        elif item and not isinstance(item[0], (tuple, dict)):
            item = [item]
        item_fields = (list(i.items()) if hasattr(i, 'items') else (i,)
                       for i in item)
        for k, v in chain(*item_fields):
            if hasattr(k, 'startswith'):
                if k.startswith('_'):
                    new_item[k] = v
                    continue
                elif k.startswith('#'):
                    continue
            try:
                for k, v in self._process_fields(k, v, htmlpage):
                    new_item[k].extend(v)
            except MissingRequiredError:
                return {}
        new_item_fields = {getattr(f, 'name', f): v
                           for f, v in new_item.items() if v}
        new_item = {getattr(f, 'description', f): v
                    for f, v in new_item.items() if v}
        _type = getattr(self.schema, 'description', None)
        if (hasattr(self.schema, '_item_validates') and
                not self.schema._item_validates(new_item_fields)):
            return {}
        merged_item = defaultdict(list)
        for f, v in new_item.items():
            fieldname = getattr(f, 'description', f)
            try:
                assert not fieldname.startswith('_')
                merged_item[fieldname] += v
            except (TypeError, AssertionError):
                merged_item[fieldname] = v
        if _type:
            merged_item[u'_type'] = _type
        return dict(merged_item)

    def _process_fields(self, annotations, regions, htmlpage):
        for annotation in arg_to_iter(annotations):
            if isinstance(annotation, dict):
                field = annotation['field']
                try:
                    field_extraction = self.schema.attribute_map.get(field)
                except AttributeError:
                    field_extraction = None
                if field_extraction is None:
                    field_extraction = SlybotFieldDescriptor(
                        field, field, _DEFAULT_EXTRACTOR)
                if annotation.get('pre_text') or annotation.get('post_text'):
                    text_extractor = TextRegionDataExtractor(
                        annotation.get('pre_text', ''),
                        annotation.get('post_text', ''))
                    field_extraction = copy.deepcopy(field_extraction)
                    field_extraction.extractor = _compose(
                        field_extraction.extractor, text_extractor.extract)
                extracted = self._process_values(
                    regions, htmlpage, field_extraction
                )
                for extractor in annotation.get('extractors', []):
                    custom_extractor_func = self.modifiers.get(extractor)
                    if custom_extractor_func and extracted:
                        extracted = [custom_extractor_func(s, htmlpage)
                                     for s in extracted]
                if annotation.get('required') and not extracted:
                    raise MissingRequiredError()
                yield (field_extraction, extracted)
            else:
                try:
                    extraction_func = self.schema.attribute_map.get(annotation)
                except AttributeError:
                    extraction_func = None
                if extraction_func is None:
                    extraction_func = SlybotFieldDescriptor(
                        annotation, annotation, _DEFAULT_EXTRACTOR)
                values = self._process_values(regions, htmlpage,
                                              extraction_func)
                yield (extraction_func, values)

    def _process_values(self, regions, htmlpage, extraction_func):
        values = []
        for value in arg_to_iter(regions):
            if (isinstance(value, (HtmlPageParsedRegion, HtmlPageRegion)) and
                    hasattr(extraction_func, 'extractor')):
                value = extraction_func.extractor(value)
            if value:
                values.append(value)
        if hasattr(extraction_func, 'adapt'):
            if hasattr(htmlpage, 'htmlpage'):
                htmlpage = htmlpage.htmlpage
            values = [extraction_func.adapt(x, htmlpage) for x in values
                      if x and not isinstance(x, dict)]
        else:
            values = list(filter(bool, values))
        return values

    def __str__(self):
        stream = StringIO()
        pprint.pprint(self.extractors, stream)
        stream.seek(0)
        template_data = stream.read()
        if template_data:
            return "%s[\n%s\n]" % (self.__class__.__name__, template_data)
        return "%s[none]" % (self.__class__.__name__)


class ContainerExtractor(BaseContainerExtractor, BasicTypeExtractor):
    def __init__(self, extractors, template, containers=None,
                 container_contents=None, annotation=None,
                 required_fields=None):
        if containers is None:
            containers = {}
        if container_contents is None:
            container_contents = {}
        if annotation is not None:
            aid = annotation.metadata.get('id')
        else:
            aid = None
        self.template_tokens = template.page_tokens
        self.template_token_dict = template.token_dict
        self.extractors = self._build_extractors(
            extractors, containers, container_contents, template)
        record = [e for e in containers.get(aid, [])
                  if not e.annotation.metadata.get('item_container')]
        if record and not isinstance(extractors, list):
            self.extractors.extend(
                SlybotRecordExtractor.apply(template, record))
        self.content_validate = lambda x: x
        self.best_match = longest_unique_subsequence
        if annotation:
            self.annotation = annotation
        BaseContainerExtractor.__init__(self, extractors, template)
        if required_fields:
            self.extra_requires = set(required_fields) | self.extra_requires
        # A Container can only extract many items if it has at least one child
        # RepeatedContainerExtractor
        self.many = False
        if (any(isinstance(e, RepeatedContainerExtractor)
                for e in self.extractors)):
            self.many = True

    def extract(self, page, start_index=0, end_index=None,
                ignored_regions=None, **kwargs):
        """
        Find a region surrounding repeated data and run extractors on the data
        in that region.
        """
        start_index = max(0, start_index - 1)
        max_end_index = len(page.token_page_indexes)
        if end_index is None:
            end_index = max_end_index
        else:
            end_index = min(max_end_index, end_index + 1)
        region = Region(*similar_region(
            page.page_tokens, self.template_tokens, self.annotation,
            start_index, end_index, self.best_match, **kwargs))
        if region.score < 1:
            return []
        items = self._extract_items_from_region(region, page, ignored_regions,
                                                **kwargs)
        items = [self._validate_and_adapt_item(i, page) for i in items]
        if self.many:
            return items
        return self._merge_items(items)

    def _extract_items_from_region(self, region, page, ignored_regions, **kw):
        items = []
        for extractor in self.extractors:
            try:
                try:
                    item = extractor.extract(
                        page, region.start_index, region.end_index,
                        ignored_regions, **kw
                    )
                except TypeError:
                    ex = SlybotRecordExtractor(
                        extractor.extractors, extractor.template_tokens
                    )
                    item = ex.extract(
                        page, region.start_index, region.end_index,
                        ignored_regions, **kw
                    )
            except MissingRequiredError:
                return []
            if (isinstance(extractor, RepeatedContainerExtractor) or
                    isinstance(item, list)):
                if item and isinstance(item[0], dict):
                    items.extend(item)
                else:
                    items.append(item)
            else:
                items.append(item)
        return items

    def _merge_items(self, items):
        result = defaultdict(list)
        for item in items:
            if hasattr(item, 'items'):
                item = item.items()
            for k, v in item:
                if isinstance(v, list):
                    result[k].extend(v)
                else:
                    # Overwrites different item types
                    result[k] = v
        return [dict(result)]


class RepeatedContainerExtractor(BaseContainerExtractor, RecordExtractor):
    def __init__(self, extractors, template, containers=None,
                 container_contents=None, annotation=None, schemas=None):
        if containers is None:
            containers = {}
        if container_contents is None:
            container_contents = {}
        if schemas is None:
            schemas = {}
        if annotation is not None:
            aid = annotation.metadata.get('id')
        else:
            aid = None
        self.template_tokens = template.page_tokens
        self.template_token_dict = template.token_dict
        self.prefix, self.suffix = self._find_prefix_suffix(
            extractors, container_contents, containers, template)
        self.extractors = self._build_extractors(
            extractors, containers, container_contents, template)
        record = [e for e in containers.get(aid, [])
                  if not e.annotation.metadata.get('item_container')]
        if record and not isinstance(extractors, list):
            self.extractors.extend(
                SlybotRecordExtractor.apply(template, record))
        self.best_match = first_longest_subsequence
        BaseContainerExtractor.__init__(self, extractors, template)

    def extract(self, page, start_index=0, end_index=None,
                ignored_regions=None, **kwargs):
        """
        Find regions bounded by the prefix and suffix and repeatedly
        extract them.
        """
        prefixlen = len(self.prefix)
        suffixlen = len(self.suffix)
        index = max(0, start_index - prefixlen)
        if end_index is None:
            end_index = len(self.template_tokens)
        max_index = min(len(page.page_tokens) - suffixlen,
                        end_index + len(self.suffix))
        max_start_index = max_index - prefixlen
        extracted = []
        while index <= max_start_index:
            prefix_end = index + prefixlen
            if (page.page_tokens[index:prefix_end] == self.prefix).all():
                for peek in xrange(prefix_end + self.min_jump, max_index + 1):
                    next_prefix = page.page_tokens[peek:peek + prefixlen]
                    next_suffix = page.page_tokens[peek:peek + suffixlen]
                    matches_next_prefix = (next_prefix == self.prefix).all()
                    matches_next_suffix = (next_suffix == self.suffix).all()
                    if not (matches_next_suffix or matches_next_prefix or
                            peek + suffixlen >= max_index):
                        continue
                    if matches_next_prefix:
                        peek -= suffixlen + 1
                    try:
                        items = []
                        _index = index
                        for extractor in self.extractors:
                            items += extractor.extract(
                                page, index, peek + self.offset,
                                ignored_regions,
                                suffix_max_length=suffixlen)
                            _index = max(peek, index) - 1
                    except MissingRequiredError:
                        pass
                    else:
                        extracted.extend(
                            self._process_items(items, page))
                    index = _index
                    break
            index += 1
        result = []
        for i, item in enumerate(extracted, 1):
            if not item:
                continue
            try:
                item[u'_index'] = i
            except TypeError:
                pass
            result.append(item)
        if self.parent_annotation.metadata.get('field'):
            return [(self.parent_annotation.metadata['field'], result)]
        return result

    def _process_items(self, items, page):
        if not items:
            return []
        return arg_to_iter(self._validate_and_adapt_item(items, page))

    def _find_prefix_suffix(self, extractors, container_contents, containers,
                            template):
        """
        Find the prefix and suffix for this repeating extractor.
        """
        htt = HtmlTagType
        all_tags = (htt.CLOSE_TAG, htt.UNPAIRED_TAG, htt.OPEN_TAG)
        open_tags = (htt.OPEN_TAG, htt.UNPAIRED_TAG)
        parent, child = self._find_siblings(template, containers,
                                            container_contents)
        self.parent_annotation = parent
        parent_sindex = 0 if not parent else parent.start_index
        tokens = template.page_tokens[parent_sindex:child.start_index + 1]
        prefix = self._find_tokens(tokens, open_tags, template)
        prefix.reverse()
        tokens = template.page_tokens[child.start_index + 1:
                                      child.end_index + 1]
        suffix = self._find_tokens(tokens, all_tags, template)
        prefix = self._trim_prefix(prefix, suffix, template)
        suffix.reverse()
        suffix = self._trim_prefix(suffix, prefix, template, 3)
        tokens = template.page_tokens[child.start_index + 1:
                                      child.end_index][::-1]
        max_separator = int(len(tokens) * MAX_RELATIVE_SEPARATOR_MULTIPLIER)
        tokens = self._find_tokens(tokens, open_tags, template)
        prefix = self._trim_prefix(
            prefix + tokens, suffix, template, 3, True)
        tokens = template.page_tokens[child.end_index + 1:
                                      child.end_index + max_separator][::-1]
        tokens = self._find_tokens(tokens, open_tags, template, prefix[0])
        self.offset = 1 if not tokens else 0
        suffix = self._trim_prefix(suffix + tokens, prefix, template, 3, True)
        # Heuristic to reduce chance of false positives
        self.min_jump = int((child.end_index - child.start_index -
                             len(suffix)) * MIN_JUMP_DISTANCE)
        return (array(prefix), array(suffix))

    def _find_siblings(self, template, containers, container_contents):
        child_id = container_contents[0].annotation.metadata['container_id']
        child = self.annotation = containers[child_id][0].annotation
        parent_id = child.metadata.get('container_id')
        parent = self._find_annotation(template, parent_id)
        siblings = child.metadata.get('siblings', 0)
        end = child.end_index
        if siblings > 0:
            end = self._find_siblings_end(template, child.end_index + 1,
                                          parent.end_index, siblings)
        if end is not None:
            new_child = AnnotationTag(child.start_index, end,
                                      child.surrounds_attribute,
                                      child.annotation_text,
                                      child.tag_attributes)
            new_child.metadata = child.metadata
            self.annotation = new_child
            return (parent, new_child)
        return parent, child

    def _find_siblings_end(self, template, start_index, max_index, siblings):
        if start_index >= max_index:
            return None
        if siblings == 0:
            return start_index
        htt = HtmlTagType
        first_token = template.page_tokens[start_index]
        if template.token_dict.token_type(first_token) == htt.UNPAIRED_TAG:
            return self._find_siblings_end(template, start_index + 1,
                                           max_index, siblings - 1)
        tokens = template.page_tokens[start_index + 1:max_index]
        tag_stack = [first_token]
        for idx, token in enumerate(tokens, 1):
            token_type = template.token_dict.token_type(token)
            if token_type == htt.OPEN_TAG:
                tag_stack.append(token)
            elif token_type == htt.CLOSE_TAG:
                tag_stack.pop(-1)
            if not tag_stack:
                return self._find_siblings_end(template, start_index + idx + 1,
                                               max_index, siblings - 1)

    def _trim_prefix(self, prefix, suffix, template, min_prefix_len=1,
                     remove_from_end=False):
        """
        If the annotation is on the first element it is possible that there are
        too many tokens in the prefix to find sibling regions. This looks ahead
        for sibling regions and reduces the number of tokens until it can find
        some.
        """
        if len(prefix) <= min_prefix_len:
            return prefix
        new_prefix = copy.copy(prefix)
        suffixlen = len(suffix)
        end_index = self.annotation.end_index
        start_index = self.annotation.start_index
        annotation_length = start_index - end_index
        max_start_index = min(
            start_index + MAX_SEARCH_DISTANCE_MULTIPLIER * annotation_length,
            len(template.page_tokens))
        while len(new_prefix) > min_prefix_len:
            index = end_index
            while index < max_start_index:
                prefixlen = len(new_prefix)
                prefix_end = index + prefixlen
                if (template.page_tokens[index:prefix_end]
                        == new_prefix).all():
                    for peek in xrange(prefix_end, max_start_index + 1):
                        if (template.page_tokens[peek:peek + suffixlen]
                                == suffix).all():
                            return new_prefix
                index += 1
            if remove_from_end:
                new_prefix = new_prefix[:-1]
            else:
                new_prefix = new_prefix[1:]

        return new_prefix

    @staticmethod
    def _find_tokens(tokens, token_types, template, upto=None):
        """
        Find a consecutive list tokens marching the supplied token types.
        Possibly remove the final token as this may reduce the number of
        regions that can be found.
        """
        result_tokens = []
        token_type = template.token_dict.token_type
        for token in reversed(tokens):
            if token == upto:
                break
            if token_type(token) in token_types:
                result_tokens.append(token)
            else:
                break
        if len(result_tokens) > MIN_TOKEN_LENGTH_BEFORE_TRUNCATE:
            result_tokens = result_tokens[:-1]
        return result_tokens


class RepeatedFieldsExtractor(RepeatedContainerExtractor):
    def __init__(self, extractors, template, containers=None,
                 container_contents=None, annotation=None, schemas=None):
        extractors = [BaseExtractor(annotation, schemas)]
        self.annotation = annotation
        RepeatedContainerExtractor.__init__(
            self, extractors, template, containers, container_contents,
            schemas)
        self.extractors = [RepeatedDataExtractor(
            [self.prefix[-2:]], [self.suffix[:1]],
            [BaseExtractor(annotation, self.schema)])]

    def extract(self, page, start_index=0, end_index=None,
                ignored_regions=None, **kwargs):
        data = self.extractors[0].extract(
            page, start_index, end_index, ignored_regions, **kwargs)
        if not data:
            return []
        values = [v for _, v in data]
        return [(data[0][0], values)]

    def _validate_and_adapt_item(self, item):
        return item

    def _find_siblings(self, template, containers, container_contents):
        container_id = self.annotation.metadata['container_id']
        parent = self._find_annotation(template, container_id)
        return parent, self.annotation


class TemplatePageMultiItemExtractor(TemplatePageExtractor):
    def extract(self, page, start_index=0, end_index=None):
        items = []
        for extractor in self.extractors:
            extracted = extractor.extract(page, start_index, end_index,
                                          self.template.ignored_regions)
            for item in extracted:
                if item:
                    if isinstance(item, dict):
                        item[u'_template'] = self.template.id
            items.extend(filter(bool, extracted))
        return items


class SlybotIBLExtractor(InstanceBasedLearningExtractor):
    tree_order_func = _count_annotations

    def __init__(self, template_descriptor_pairs, trace=False,
                 apply_extrarequired=True):
        self.token_dict = TokenDict()
        parsed_templates = []
        template_versions = []
        for template, descriptors, version in template_descriptor_pairs:
            parsed = parse_template(self.token_dict, template, descriptors)
            parsed_templates.append(parsed)
            template_versions.append(version)
            if _annotation_count(parsed):
                parse_extraction_page(self.token_dict, template)

        for parsed in parsed_templates:
            default_schema = getattr(parsed, '_default_schema', None)
            descriptor = parsed.descriptors.get(default_schema)
            if descriptor is not None and apply_extrarequired:
                descriptor = descriptor.copy()
                parsed.descriptors[default_schema] = descriptor
                parsed.descriptors['#default'] = descriptor

        # templates with more attributes are considered first
        parsed_templates = sorted(
            parsed_templates, key=_annotation_count, reverse=True
        )
        self.extraction_trees = [
            self.build_extraction_tree(p, None, trace)
            for p, v in zip(parsed_templates, template_versions)
        ]

    def build_extraction_tree(self, template, type_descriptor=None,
                              trace=False):
        """Build a tree of region extractors corresponding to the template."""
        basic_extractors = BaseExtractor.create(template.annotations)
        if trace:
            basic_extractors = TraceExtractor.apply(template, basic_extractors)
        basic_extractors = ContainerExtractor.apply(template, basic_extractors)

        item_containers, extractors = [], []
        for extractor in basic_extractors:
            if (isinstance(extractor, BaseContainerExtractor) and
                    not extractor.annotation.metadata.get('field')):
                item_containers.append(extractor)
            else:
                extractors.append(extractor)
        if not extractors:
            return TemplatePageMultiItemExtractor(template, item_containers)
        outer_container = ContainerExtractor(
            extractors, template,
            required_fields=template.extra_required_attrs)
        extractors = [outer_container]
        extractors.extend(item_containers)
        return TemplatePageMultiItemExtractor(template, extractors)

    def extract(self, html, pref_template_id=None):
        """Extract data from an html page.

        If pref_template_url is specified, the template with that url will be
        used first.
        """
        extraction_page = parse_extraction_page(self.token_dict, html)
        extraction_trees = self.extraction_trees
        if pref_template_id is not None:
            extraction_trees = sorted(
                self.extraction_trees,
                key=lambda x: x.template.id != pref_template_id)
        for extraction_tree in extraction_trees:
            template_id = extraction_tree.template.id
            extracted = extraction_tree.extract(extraction_page)
            correctly_extracted = []
            for item in extracted:
                if u'_type' in item or not hasattr(self, 'validated'):
                    correctly_extracted.append(item)
                else:
                    validated = self.validated[template_id]([item])
                    if validated:
                        correctly_extracted.append(validated)
            if len(correctly_extracted) > 0:
                return correctly_extracted, extraction_tree.template
        return None, None

    def __str__(self):
        trees = ',\n'.join(map(str, self.extraction_trees))
        return "SlybotIBLExtractor[\n%s\n]" % (trees)
