import pprint
import copy


from collections import defaultdict, namedtuple
from cStringIO import StringIO
from itertools import groupby
from operator import itemgetter

from numpy import array
from six.moves import xrange

from scrapely.extraction import (InstanceBasedLearningExtractor,
                                 _annotation_count)
from scrapely.extraction.pageparsing import (parse_extraction_page,
                                             TemplatePageParser)
from scrapely.extraction.pageobjects import (TokenDict, TemplatePage,
                                             AnnotationTag)
from scrapely.extraction.regionextract import (RecordExtractor,
                                               BasicTypeExtractor,
                                               TraceExtractor,
                                               TemplatePageExtractor,
                                               RepeatedDataExtractor,
                                               AdjacentVariantExtractor)
from scrapely.extraction.similarity import (similar_region,
                                            longest_unique_subsequence,
                                            first_longest_subsequence)
from scrapely.htmlpage import HtmlTagType, HtmlPageParsedRegion


MAX_SEARCH_DISTANCE_MULTIPLIER = 3
MIN_TOKEN_LENGTH_BEFORE_TRUNCATE = 3
MIN_JUMP_DISTANCE = 0.7
MAX_RELATIVE_SEPARATOR_MULTIPLIER = 0.7
Region = namedtuple('Region', ['score', 'start_index', 'end_index'])
container_id = lambda x: x.annotation.metadata.get('container_id')


def group_tree(tree, container_annotations):
    result = {}
    get_first = itemgetter(0)
    for name, value in groupby(sorted(tree, key=get_first), get_first):
        value = list(value)
        if len(value) == 1:
            result[name] = container_annotations.get(name)
        else:
            result[name] = group_tree([l[1:] for l in value if len(l) > 1],
                                      container_annotations)
    return result


def parse_template(token_dict, template_html, descriptors):
    """Create an TemplatePage object by parsing the annotated html"""
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
        if descriptors is None:
            descriptors = {}
        return SlybotTemplatePage(self.html_page, self.token_dict,
                                  self.token_list, self.annotations,
                                  self.html_page.page_id, self.ignored_regions,
                                  self.extra_required_attrs, descriptors)


class SlybotTemplatePage(TemplatePage):
    __slots__ = ('descriptors')

    def __init__(self, htmlpage, token_dict, page_tokens, annotations,
                 template_id=None, ignored_regions=None, extra_required=None,
                 descriptors=None):
        self.descriptors = descriptors
        super(SlybotTemplatePage, self).__init__(
            htmlpage, token_dict, page_tokens, annotations, template_id,
            ignored_regions, extra_required)

    def descriptor(self, descriptor_name=None):
        if descriptor_name is None:
            descriptor_name = '#default'
        return self.descriptors.get(descriptor_name, {})


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
            if self.legacy:  # Mimic old slybot behaviour
                for extractor_cls in self._extractor_classes:
                    extractors = extractor_cls.apply(template, extractors)
                new_extractors.extend(extractors)
            else:
                new_extractors.extend(RecordExtractor.apply(template,
                                                            extractors))
        else:
            for container_name, container_data in extractors.items():
                annotation = self._find_annotation(template, container_name)
                if container_name not in containers or not container_contents:
                    continue  # Ignore missing or empty containers
                if annotation.metadata.get('item_container'):
                    self._add_new_container(
                        annotation, new_extractors, container_data, template,
                        containers, container_contents)
        self.annotation = None
        if annotation:
            self.annotation = annotation
        elif new_extractors:
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
            containers = container_annos[container_name]
            annotation = None
            for a in template.annotations:
                if a.metadata.get('id') == container_name:
                    annotation = a
                    break
            if containers:
                cls._add_new_container(
                    annotation, container_extractors, container_data,
                    template, container_annos, containers)
        return container_extractors

    @staticmethod
    def _add_new_container(annotation, extractors, container_data, template,
                           containers, container_contents):
        """
        Create a new container from the provided container information.
        """
        if annotation.metadata.get('repeated'):
            extractors.append(
                RepeatedContainerExtractor(
                    container_data, template,
                    containers=containers,
                    container_contents=container_contents)
            )
        else:
            extractors.append(
                ContainerExtractor(
                    container_data, template,
                    annotation=annotation,
                    containers=containers,
                    container_contents=container_contents))

    def _find_annotation(self, template, annotation_id):
        """
        Look for an annotation with the given id in the given template
        """
        for annotation in template.annotations:
            if annotation.metadata.get('id') == annotation_id:
                return annotation

    def _validate_and_adapt_item(self, item, htmlpage):
        """
        Look at item extracted by this container and make sure that all
        required fields are extracted, adapted and fields are renamed if
        necessary.
        """
        if not hasattr(self.schema, '_item_validates') or u'_type' in item:
            return item
        if not self.schema._item_validates(item):
            return {}
        for k in self.extra_requires:
            if k not in item:
                return {}
            if k.startswith('_sticky'):
                item.pop(k)
        new_item = {}
        for k, v in item.items():
            field_descriptor = self.schema.attribute_map.get(k)
            if field_descriptor:
                values = []
                for value in v:
                    if isinstance(value, HtmlPageParsedRegion):
                        value = field_descriptor.extractor(value)
                    if value:
                        values.append(value)
                if hasattr(field_descriptor, 'adapt'):
                    if hasattr(htmlpage, 'htmlpage'):
                        htmlpage = htmlpage.htmlpage
                    v = [field_descriptor.adapt(x, htmlpage) for x in values
                         if x and not isinstance(x, dict)]
                else:
                    v = list(filter(bool, values))
                if field_descriptor.name != field_descriptor.description:
                    k = field_descriptor.description
            new_item[k] = v
        new_item[u'_type'] = self.schema.description
        return new_item

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
                 container_contents=None, annotation=None, legacy=False,
                 required_fields=None):
        if containers is None:
            containers = {}
        if container_contents is None:
            container_contents = {}
        self.legacy = legacy
        self.template_tokens = template.page_tokens
        self.template_token_dict = template.token_dict
        self.extractors = self._build_extractors(
            extractors, containers, container_contents, template)
        self.content_validate = lambda x: x
        self.best_match = longest_unique_subsequence
        if annotation:
            self.annotation = annotation
        BaseContainerExtractor.__init__(self, extractors, template)
        if required_fields:
            self.extra_requires = set(required_fields) | self.extra_requires

    def extract(self, page, start_index=0, end_index=None,
                ignored_regions=None, **kwargs):
        """
        Find a region surrounding repeated data and run extractors on the data
        in that region.
        """
        items = []
        start_index = max(0, start_index - 1)
        max_end_index = len(page.token_page_indexes)
        if end_index is None:
            end_index = max_end_index - 1
        else:
            end_index = min(max_end_index, end_index + 1)
        region = Region(*similar_region(
            page.page_tokens, self.template_tokens, self.annotation,
            start_index, end_index, self.best_match, **kwargs))
        if region.score < 1:
            return []
        for extractor in self.extractors:
            item = extractor.extract(page, region.start_index,
                                     region.end_index, ignored_regions,
                                     **kwargs)
            if not isinstance(item, (list, tuple)):
                item = [item]
            items.extend(item)
        items = [self._validate_and_adapt_item(i, page) for i in items]
        return items


class RepeatedContainerExtractor(BaseContainerExtractor, RecordExtractor):
    def __init__(self, extractors, template, containers=None,
                 container_contents=None, schemas=None, legacy=False):
        if containers is None:
            containers = {}
        if container_contents is None:
            container_contents = {}
        if schemas is None:
            schemas = {}
        self.legacy = legacy
        self.template_tokens = template.page_tokens
        self.template_token_dict = template.token_dict
        self.prefix, self.suffix = self._find_prefix_suffix(
            extractors, container_contents, containers, template)
        self.extractors = self._build_extractors(
            extractors, containers, container_contents, template)
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
                    if (page.page_tokens[peek:peek + suffixlen]
                            == self.suffix).all():
                        for extractor in self.extractors:
                            items = extractor.extract(
                                page, index, peek, ignored_regions,
                                suffix_max_length=suffixlen)
                            if items:
                                extracted.extend([
                                    self._validate_and_adapt_item(item, page)
                                    for item in items])
                            index = max(peek, index) - 1
                        break
            index += 1
        if self.parent_annotation.metadata.get('field'):
            return [(self.parent_annotation.metadata['field'], extracted)]
        return list(filter(bool, extracted))

    def _find_prefix_suffix(self, extractors, container_contents, containers,
                            template):
        """
        Find the prefix and suffix for this repeating extractor.
        """
        parent, child = self._find_siblings(template, containers,
                                            container_contents)
        self.parent_annotation = parent
        parent_sindex = 0 if not parent else parent.start_index
        htt = HtmlTagType
        tokens = template.page_tokens[parent_sindex:child.start_index + 1]
        prefix_tokens = self._find_tokens(tokens,
                                          (htt.OPEN_TAG, htt.UNPAIRED_TAG),
                                          template)
        prefix_tokens.reverse()
        tokens = template.page_tokens[child.start_index + 1:
                                      child.end_index + 1]
        suffix_tokens = self._find_tokens(tokens,
                                          (htt.CLOSE_TAG, htt.UNPAIRED_TAG,
                                           htt.OPEN_TAG),
                                          template)
        prefix_tokens = self._trim_prefix(prefix_tokens, suffix_tokens,
                                          template)
        suffix_tokens.reverse()
        suffix_tokens = self._trim_prefix(suffix_tokens, prefix_tokens,
                                          template, 2)
        tokens = template.page_tokens[child.start_index + 1:
                                      child.end_index][::-1]
        max_separator = int(len(tokens) * MAX_RELATIVE_SEPARATOR_MULTIPLIER)
        tokens = self._find_tokens(tokens,
                                   (htt.OPEN_TAG, htt.UNPAIRED_TAG),
                                   template)
        prefix_tokens = self._trim_prefix(prefix_tokens + tokens,
                                          suffix_tokens,
                                          template, 3, True)
        tokens = template.page_tokens[child.end_index + 1:
                                      child.end_index + max_separator][::-1]
        tokens = self._find_tokens(tokens,
                                   (htt.OPEN_TAG, htt.UNPAIRED_TAG),
                                   template)
        suffix_tokens = self._trim_prefix(suffix_tokens + tokens,
                                          prefix_tokens,
                                          template, 3, True)
        # Heuristic to reduce chance of false positives
        self.min_jump = int((child.end_index - child.start_index -
                             len(suffix_tokens)) * MIN_JUMP_DISTANCE)
        return (array(prefix_tokens), array(suffix_tokens))

    def _find_siblings(self, template, containers, container_contents):
        child_id = container_contents[0].annotation.metadata['container_id']
        child = self.annotation = containers[child_id][0].annotation
        parent_id = self.annotation.metadata.get('container_id')
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
                return self._find_siblings_end(template, start_index + idx,
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
    def _find_tokens(tokens, token_types, template):
        """
        Find a consecutive list tokens marching the supplied token types.
        Possibly remove the final token as this may reduce the number of
        regions that can be found.
        """
        result_tokens = []
        for token in reversed(tokens):
            if template.token_dict.token_type(token) in token_types:
                result_tokens.append(token)
            else:
                break
        if len(result_tokens) > MIN_TOKEN_LENGTH_BEFORE_TRUNCATE:
            result_tokens = result_tokens[:-1]
        return result_tokens


class TemplatePageMultiItemExtractor(TemplatePageExtractor):
    def extract(self, page, start_index=0, end_index=None):
        items = []
        for extractor in self.extractors:
            extracted = extractor.extract(page, start_index, end_index,
                                          self.template.ignored_regions)
            for item in extracted:
                if item:
                    item[u'_template'] = self.template.id
            items.extend(filter(bool, extracted))
        return items


class SlybotIBLExtractor(InstanceBasedLearningExtractor):
    tree_order_func = _count_annotations

    def __init__(self, template_descriptor_pairs, trace=False,
                 apply_extrarequired=True):
        self.token_dict = TokenDict()
        parsed_templates = []
        for template, descriptors in template_descriptor_pairs:
            parsed = parse_template(self.token_dict, template, descriptors)
            parsed_templates.append(parsed)
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
        parsed_templates.sort(key=_annotation_count,
                              reverse=True)
        self.extraction_trees = list(sorted([
            self.build_extraction_tree(p, None, trace)
            for p in parsed_templates
        ], key=_count_annotations, reverse=True))

    def build_extraction_tree(self, template, type_descriptor=None,
                              trace=False):
        """Build a tree of region extractors corresponding to the
        template
        """
        basic_extractors = BasicTypeExtractor.create(template.annotations)
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
            extractors, template, legacy=True,
            required_fields=template.extra_required_attrs)
        extractors = [outer_container]
        extractors.extend(item_containers)
        return TemplatePageMultiItemExtractor(template, extractors)

    def extract(self, html, pref_template_id=None):
        """extract data from an html page

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
                if u'_type' in item:
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
