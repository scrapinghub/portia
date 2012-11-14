import itertools
from lxml import html

def _pick_node(doc, selector):
    nodes = doc.xpath(selector['xpath'])
    if nodes:
        return nodes[0]

def _get_field_values(form, field_descriptor):
    #field_name = field_descriptor['name']
    field_type = field_descriptor['type']
    select_field = _pick_node(form, field_descriptor)
    if field_type == 'fixed':
        return [[select_field.name, field_descriptor['value']]]
    elif field_type == 'all':
        return [[select_field.name, option] for option in select_field.value_options]

def fill_generic_form(url, body, form_descriptor):

    doc = html.document_fromstring(body, base_url=url)
    form = _pick_node(doc, form_descriptor)
    if form is None:
        raise Exception('Generic form not found')

    # Get all the possible inputs for each field
    values = [_get_field_values(form, field)
              for field in form_descriptor['fields']]

    for params in itertools.product(*values):
        form_values = dict((key, value) for (key, value) in form.form_values())
        for name, option in params:
            form_values[name] = option
        yield form_values.items(), form.action or form.base_url, form.method
