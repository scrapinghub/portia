from scrapely.extraction import (InstanceBasedLearningExtractor,
                                 _annotation_count)
from scrapely.extraction.pageparsing import parse_extraction_page
from scrapely.extraction.pageobjects import TokenDict
from scrapely.extraction.regionextract import (TraceExtractor,
                                               TemplatePageExtractor)
from scrapy.selector import Selector
from scrapy.utils.spider import arg_to_iter

from .container_extractors import BaseContainerExtractor, ContainerExtractor
from .pageparsing import parse_template
from .region_extractors import BaseExtractor
from .utils import _count_annotations
from ..processors import ItemProcessor


class TemplatePageMultiItemExtractor(TemplatePageExtractor):
    def extract(self, page, start_index=0, end_index=None):
        items = []
        for extractor in self.extractors:
            extracted = extractor.extract(page, start_index, end_index,
                                          self.template.ignored_regions)
            for item in arg_to_iter(extracted):
                if item:
                    if isinstance(item, (ItemProcessor, dict)):
                        item[u'_template'] = self.template.id
                    items.append(item)

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
        sel = Selector(text=html.body)
        for extraction_tree in extraction_trees:
            template_id = extraction_tree.template.id
            extracted = extraction_tree.extract(extraction_page)
            correctly_extracted = []
            for item in extracted:
                if (isinstance(item, ItemProcessor) or
                        not hasattr(self, 'validated')):
                    if hasattr(item, 'process'):
                        item = item.process(sel)
                else:
                    item = self.validated[template_id]([item])
                if item:
                    correctly_extracted.append(item)
            if len(correctly_extracted) > 0:
                return correctly_extracted, extraction_tree.template
        return None, None

    def __str__(self):
        trees = ',\n'.join(map(str, self.extraction_trees))
        return "SlybotIBLExtractor[\n%s\n]" % (trees)
