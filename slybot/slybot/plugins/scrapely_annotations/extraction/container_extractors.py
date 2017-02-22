import pprint
import copy

from collections import defaultdict
from itertools import groupby

from numpy import array
from six.moves import xrange, StringIO

from scrapely.extraction.pageobjects import AnnotationTag
from scrapely.extraction.regionextract import (
    RecordExtractor, BasicTypeExtractor, RepeatedDataExtractor,
    AdjacentVariantExtractor
)
from scrapely.extraction.similarity import (
    similar_region, longest_unique_subsequence, first_longest_subsequence
)
from scrapely.htmlpage import HtmlTagType
from scrapy.utils.spider import arg_to_iter

from .region_extractors import SlybotRecordExtractor, BaseExtractor
from .utils import container_id, group_tree, Region, element_from_page_index
from ..processors import MissingRequiredError, ItemProcessor


MAX_SEARCH_DISTANCE_MULTIPLIER = 3
MIN_TOKEN_LENGTH_BEFORE_TRUNCATE = 3
MIN_JUMP_DISTANCE = 0.7
MAX_RELATIVE_SEPARATOR_MULTIPLIER = 0.7


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
        schema_name = self.annotation.metadata.get('schema_id')
        self.schema = template.descriptor(schema_name).copy()
        self.modifiers = template.modifiers
        extra_requires = getattr(self, 'extra_requires', [])
        self.extra_requires = extra_requires
        if hasattr(self.schema, '_required_attributes'):
            requires = list(extra_requires) + self.schema._required_attributes
            self.schema._required_attributes = requires

    @property
    def annotation(self):
        try:
            return self._annotation
        except AttributeError:
            return AnnotationTag(1, 1)

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
        if not hasattr(self, '_annotation'):
            self._annotation = None
        if annotation:
            self._annotation = annotation
        elif new_extractors and self._annotation is None:
            self._annotation = new_extractors[0].annotation
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
        return sorted(extraction_tree, key=len)

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
        for annotation in template.annotations:
            aid = annotation.metadata.get('id', '')
            if aid == annotation_id:
                return annotation

    def _validate_and_adapt_item(self, item, htmlpage, region=None,
                                 surrounding_region=None):
        if isinstance(item, ItemProcessor):
            return item

        # Check if all required fields are available
        if isinstance(item, dict):
            for k in self.extra_requires:
                if k.startswith('_sticky'):  # Sticky no longer supported
                    item.pop(k, None)
                    continue
                if k not in item:
                    return {}
        processor = ItemProcessor(item, self, region, surrounding_region,
                                  htmlpage)

        # Check if item is valid
        if len(processor):
            return processor
        else:
            return {}

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
            self._annotation = annotation
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
        surrounding = element_from_page_index(page, start_index)
        items = self._extract_items_from_region(
            region, page, ignored_regions, surrounding, **kwargs)
        tag = element_from_page_index(page, region.start_index)
        items = [self._validate_and_adapt_item(i, page, tag) for i in items]
        if self.many:
            return items
        return self._merge_items(items)

    def _extract_items_from_region(self, region, page, ignored_regions,
                                   surrounding, **kwargs):
        items = []
        for extractor in self.extractors:
            try:
                try:
                    item = extractor.extract(
                        page, region.start_index, region.end_index,
                        ignored_regions, **kwargs
                    )
                except TypeError:
                    ex = SlybotRecordExtractor(
                        extractor.extractors, extractor.template_tokens
                    )
                    item = ex.extract(
                        page, region.start_index, region.end_index,
                        ignored_regions, **kwargs
                    )
            except MissingRequiredError:
                return []
            if (isinstance(extractor, BaseContainerExtractor) and
                    isinstance(item, list)):
                items.extend(item)
            else:
                if not isinstance(item, ItemProcessor):
                    item = ItemProcessor(item, self, [region], surrounding,
                                         page)
                items.append(item)
        return items

    def _merge_items(self, items):
        items = sorted((i for i in items if len(i)),
                       key=lambda x: x.name or '')
        if not items:
            return []
        item = items[0]
        for other_item in items[1:]:
            item.merge(other_item)
        return item


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
        surrounding_tag = element_from_page_index(page, start_index)
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
                        tag = element_from_page_index(page, index)
                        processed = self._process_items(items, page, tag,
                                                        surrounding_tag)
                        extracted.extend(processed)
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

    def _process_items(self, items, page, region, surrounding_region):
        if not items:
            return []
        items = self._validate_and_adapt_item(items, page, region,
                                              surrounding_region)
        return arg_to_iter(items)

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
        max_separator = child.metadata.get('max_separator', -1)
        if max_separator == -1:
            max_separator = int(
                len(tokens) * MAX_RELATIVE_SEPARATOR_MULTIPLIER)
        tokens = self._find_tokens(tokens, open_tags, template)
        prefix = self._trim_prefix(
            prefix + tokens, suffix, template, 3, True)
        tokens = template.page_tokens[child.end_index + 1:
                                      child.end_index + max_separator][::-1]
        tokens = self._find_tokens(tokens, open_tags, template, prefix[0])
        self.offset = 1 if not tokens else 0
        suffix = self._trim_prefix(suffix + tokens, prefix, template, 3, True)
        # Heuristic to reduce chance of false positives
        self.min_jump = child.metadata.get('min_jump', -1)
        if self.min_jump == -1:
            self.min_jump = int((child.end_index - child.start_index -
                                 len(suffix)) * MIN_JUMP_DISTANCE)
        return (array(prefix), array(suffix))

    def _find_siblings(self, template, containers, container_contents):
        child_id = container_contents[0].annotation.metadata['container_id']
        child = self._annotation = containers[child_id][0].annotation
        parent_id = child.metadata.get('container_id')
        parent = self._find_annotation(template, parent_id)
        siblings = child.metadata.get('siblings') or 0
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
            self._annotation = new_child
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
        page_tokens = template.page_tokens
        new_prefix = copy.copy(prefix)
        suffixlen = len(suffix)
        end_index = self.annotation.end_index
        start_index = self.annotation.start_index
        annotation_length = start_index - end_index
        max_start_index = min(
            start_index + MAX_SEARCH_DISTANCE_MULTIPLIER * annotation_length,
            len(page_tokens))
        while len(new_prefix) > min_prefix_len:
            index = end_index
            while index < max_start_index:
                prefixlen = len(new_prefix)
                prefix_end = index + prefixlen
                if (page_tokens[index:prefix_end] == new_prefix).all():
                    for peek in xrange(prefix_end, max_start_index + 1):
                        suffix_tokens = page_tokens[peek:peek + suffixlen]
                        if (suffix_tokens == suffix).all():
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
        self._annotation = annotation
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

    def _validate_and_adapt_item(self, item, htmlpage=None, region=None,
                                 surrounding_region=None):
        return item

    def _find_siblings(self, template, containers, container_contents):
        container_id = self.annotation.metadata['container_id']
        parent = self._find_annotation(template, container_id)
        return parent, self.annotation
