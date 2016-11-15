import json
from itertools import chain

from scrapy.utils.spider import arg_to_iter

from scrapely.extraction.pageparsing import (
    TemplatePageParser, _AUTO_CLOSE_TAGS_ON_OPEN, _END_UNPAIREDTAG_TAGS,
    HtmlTag
)
from scrapely.extraction.pageobjects import (
    TemplatePage, AnnotationTag, AnnotationText
)


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

    @staticmethod
    def _read_template_annotation(html_tag):
        template_attr = html_tag.attributes.get('data-scrapy-annotate')
        if template_attr is None:
            return None
        return json.loads(template_attr.replace('&quot;', '"'))

    def read_jannotations(self, html_tag):
        jannotations = self._read_template_annotation(html_tag)
        return jannotations if jannotations else None

    def build_annotation(self, jannotation, is_open=True):
        annotation = AnnotationTag(self.next_tag_index,
                                   self.next_tag_index + 1)
        content_key = jannotation.pop('text-content', 'content')
        attribute_annotations = jannotation.pop('annotations', {})
        content = attribute_annotations.pop(content_key, None)
        if is_open and content:
            annotation.surrounds_attribute = content
        annotation.tag_attributes = list(attribute_annotations.items())
        annotation.metadata = jannotation
        return annotation

    def handle_generated(self, annotation, ignored=False):
        if not annotation.metadata.pop('generated', False):
            return
        self.token_list.pop()
        annotation.start_index -= 1
        if self.previous_element_class == HtmlTag:
            annotation.annotation_text = AnnotationText('')
        else:
            annotation.annotation_text = AnnotationText(self.prev_data)
        if ignored:
            ignored = self.ignored_regions.pop()
            self.ignored_regions.append((ignored[0] - 1, ignored[1]))

    def handle_variant(self, annotation, is_open=True):
        try:
            variant_id = int(annotation.metadata.pop('variant', 0))
        except (TypeError, ValueError):
            variant_id = None
        if variant_id is not None and variant_id > 0:
            if is_open and annotation.surrounds_attribute is not None:
                self.variant_stack.append(variant_id)
            else:
                annotation.variant_id = variant_id
        if is_open and self.variant_stack and annotation.variant_id is None:
            variant_id = self.variant_stack[-1]
            if variant_id == '0':
                variant_id = None
            annotation.variant_id = variant_id

    def handle_ignore(self, html_tag, is_open=True):
        next_tag_idx = self.next_tag_index
        read_bool = lambda x: self._read_bool_template_attribute(html_tag, x)
        ignore = read_bool('ignore')
        ignore_beneath = read_bool('ignore-beneath')
        if ignore:
            if html_tag.tag == "img":
                self.ignored_regions.append((next_tag_idx, next_tag_idx + 1))
            elif is_open:
                self.ignored_regions.append((next_tag_idx, None))
                self.ignored_tag_stacks[html_tag.tag].append(html_tag)
        elif is_open and self.ignored_tag_stacks.get(html_tag.tag):
            self.ignored_tag_stacks[html_tag.tag].append(None)
        if ignore_beneath:
            self.ignored_regions.append((next_tag_idx, None))
        return ignore or ignore_beneath

    def handle_replacement(self, html_tag):
        replacement = html_tag.attributes.pop("data-scrapy-replacement", None)
        if replacement:
            self.token_list.pop()
            self._add_token(replacement, html_tag.tag_type, html_tag.start,
                            html_tag.end)
            self.replacement_stacks[html_tag.tag].append(replacement)
        elif html_tag.tag in self.replacement_stacks:
            self.replacement_stacks[html_tag.tag].append(None)
        if self.unpairedtag_stack:
            if html_tag.tag in _END_UNPAIREDTAG_TAGS:
                self._close_unpaired_tag()
            else:
                self.unpairedtag_stack.append(html_tag.tag)
        tagname = replacement or self._update_replacement_stack(html_tag)
        self._handle_unclosed_tags(tagname, _AUTO_CLOSE_TAGS_ON_OPEN)
        return tagname

    def _handle_unpaired_tag(self, html_tag):
        self.handle_ignore(html_tag, is_open=False)
        jannotations = self.read_jannotations(html_tag)
        for jannotation in arg_to_iter(jannotations):
            if self.unpairedtag_stack:
                self._close_unpaired_tag()
            self.extra_required_attrs.extend(jannotation.pop('required', []))
            annotation = self.build_annotation(jannotation)
            self.handle_variant(annotation, is_open=False)
            self.annotations.append(annotation)
        self.next_tag_index += 1

    def _handle_open_tag(self, html_tag):
        ignored = self.handle_ignore(html_tag)
        tagname = self.handle_replacement(html_tag)
        jannotations = self.read_jannotations(html_tag)
        if not jannotations and tagname in self.labelled_tag_stacks:
            # add this tag to the stack to match correct end tag
            self.labelled_tag_stacks[tagname].append(None)
        increment = not jannotations
        for jannotation in arg_to_iter(jannotations):
            self.extra_required_attrs.extend(jannotation.pop('required', []))
            annotation = self.build_annotation(jannotation)
            self.handle_generated(annotation, ignored)
            self.handle_variant(annotation)
            # Don't increment generated/text annotation
            if annotation.annotation_text is None and not increment:
                increment = True
            # look for a closing tag if the content is important
            if annotation.surrounds_attribute:
                self.labelled_tag_stacks[tagname].append(annotation)
            else:
                annotation.end_index = annotation.start_index + 1
                self.annotations.append(annotation)
        self.next_tag_index += increment


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


def parse_template(token_dict, template_html, descriptors):
    """Create an TemplatePage object by parsing the annotated html."""
    parser = SlybotTemplatePageParser(token_dict)
    parser.feed(template_html)
    return parser.to_template(descriptors)
