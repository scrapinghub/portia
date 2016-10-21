from itertools import chain

from scrapely.extraction.pageparsing import TemplatePageParser
from scrapely.extraction.pageobjects import TemplatePage


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


def parse_template(token_dict, template_html, descriptors):
    """Create an TemplatePage object by parsing the annotated html."""
    parser = SlybotTemplatePageParser(token_dict)
    parser.feed(template_html)
    return parser.to_template(descriptors)
