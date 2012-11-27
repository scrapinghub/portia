import itertools
from lxml import html

class GenericForm:

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def _pick_node(self, doc, selector):
        nodes = doc.xpath(selector['xpath'])
        if nodes:
            return nodes[0]

    def _get_field_values(self, form, field_descriptor):
        field_type = field_descriptor['type']
        if field_type == 'fixed':
            if 'name' in field_descriptor:
                return [[field_descriptor['name'], self.get_value(field_descriptor)]]
            else:
                select_field = self._pick_node(form, field_descriptor)
                return [[select_field.name, self.get_value(field_descriptor)]]
        elif field_type == 'all':
            select_field = self._pick_node(form, field_descriptor)
            return [[select_field.name, option] for option in select_field.value_options]
        elif field_type == 'url':
            if 'name' in field_descriptor:
                field_name = field_descriptor['name']
            else:
                select_field = self._pick_node(form, field_descriptor)
                field_name = select_field.name
            return [[field_name, option] for option in field_descriptor['file_values']]

    def get_value(self, field_descriptor):
        return field_descriptor.get('value').format(**self.kwargs)

    def set_values_url_field(self, field_descriptor, body):
        field_descriptor['file_values'] = body.split('\n')

    def get_url_field(self, form_descriptor):
        for i, field_descriptor in enumerate(form_descriptor['fields']):
            if (field_descriptor['type'] == 'url'
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
            form_values = dict((key, value) for (key, value) in form.form_values())
            for name, option in params:
                form_values[name] = option
            yield form_values.items(), form.action or form.base_url, form.method
