from itertools import chain

from scrapely.extraction.pageobjects import AnnotationTag, PageRegion
from scrapely.extraction.regionextract import (
    RecordExtractor, BasicTypeExtractor, TextRegionDataExtractor,
    labelled_element
)
from scrapely.extraction.similarity import similar_region

from .utils import _int_cmp
from ..exceptions import MissingRequiredError


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
            try:
                score, pindex, sindex = similar_region(
                    page.page_tokens, self.template_tokens, labelled,
                    start_region, end_region, self.best_match, **kwargs)
            except IndexError:
                return start_index + 1, end_index, []

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
