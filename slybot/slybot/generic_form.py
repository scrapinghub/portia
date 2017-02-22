import re
import itertools

from collections import OrderedDict

from lxml import html

from scrapy.http.request.form import _get_inputs


class GenericForm:

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def _pick_node(self, doc, selector):
        nodes = doc.xpath(selector['xpath'])
        if nodes:
            return nodes[0]

    def _filter_by_regex(self, lines, regex):
        search_regex = re.compile(regex).search
        return [l for l in lines if search_regex(l)]

    def _get_field_values(self, form, field_descriptor):
        if 'name' in field_descriptor:
            field_name = field_descriptor['name']
        else:
            select_field = self._pick_node(form, field_descriptor)
            field_name = select_field.name

        field_type = field_descriptor['type']
        if field_type == 'constants':
            return [[field_name, option] for option in self.get_value(field_descriptor)]
        elif field_type == 'iterate':
            select_field = self._pick_node(form, field_descriptor)
            values = self._filter_by_regex(select_field.value_options,
                                           self.get_value(field_descriptor))
            return [[select_field.name, option] for option in values]
        elif field_type == 'inurl':
            return [[field_name, option] for option in field_descriptor['file_values']]

    def get_value(self, field_descriptor):
        values = field_descriptor.get('value', '')
        if isinstance(values, list):
            return [val.format(**self.kwargs) for val in values]
        else:
            return values.format(**self.kwargs)

    def set_values_url_field(self, field_descriptor, body):
        field_descriptor['file_values'] = body.split('\n')

    def get_url_field(self, form_descriptor):
        for i, field_descriptor in enumerate(form_descriptor['fields']):
            if (field_descriptor['type'] == 'inurl'
                and (not 'file_values' in field_descriptor or
                     not field_descriptor['file_values'])):
                yield i, field_descriptor

    def fill_generic_form(self, url, body, form_descriptor):

        doc = html.document_fromstring(body, base_url=url)
        form = self._pick_node(doc, form_descriptor)
        if form is None:
            raise Exception('Generic form not found')

        # Get all the possible inputs for each field
        values = [self._get_field_values(form, field)
                  for field in form_descriptor['fields']]
        for params in itertools.product(*values):
            form_values = OrderedDict(_get_inputs(form, None, False, None,
                                                  None))
            for name, option in params:
                form_values[name] = option
            yield list(form_values.items()), form.action or form.base_url, form.method
