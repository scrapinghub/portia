import itertools
from lxml import html

def _pick_nodes(doc, selector):
    if 'id' in selector:
        nodes = doc.xpath('.//*[@id="%s"]' % selector['id'])
    elif 'name' in selector:
        nodes = doc.xpath('.//*[@name="%s"]' % selector['name'])
    elif 'xpath' in selector:
        nodes = doc.xpath(selector['xpath'])
    else:
        nodes = []
    return nodes

def _pick_node(doc, selector):
    nodes = _pick_nodes(doc, selector)
    if nodes:
        return nodes[0]

def _get_field_values(form, field_descriptor):
    field_name = field_descriptor['name']
    field_type = field_descriptor['type']
    if field_type == 'fixed':
        return [[field_name, field_descriptor['value']]]
    elif field_type == 'all':
        select_field = _pick_node(form, field_descriptor)
        return [[field_name, option] for option in select_field.value_options]

def fill_generic_form(url, body, form_descriptor):

    doc = html.document_fromstring(body, base_url=url)
    form = _pick_node(doc, form_descriptor)
    if form is None:
        raise Exception('Generic form not found')

    # Get all the possible inputs for each field
    values = [_get_field_values(form, field)
              for field in form_descriptor['fields']]

    for params in itertools.product(*values):
        for name, option in params:
            form.fields[name] = option
        yield form.form_values(), form.action or form.base_url, form.method
