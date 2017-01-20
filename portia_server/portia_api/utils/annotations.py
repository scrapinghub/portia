
DEFAULTS = {
    'accept': 'url',
    'align': 'number',
    'code': 'url',
    'codebase': 'url',
    'coords': 'geopoint',
    'data': 'url',
    'datetime': 'date',
    'download': 'url',
    'high': 'number',
    'href': 'url',
    'icon': 'image',
    'low': 'number',
    'max': 'number',
    'media': 'href',
    'min': 'number',
    'optimum': 'number',
    'rel': 'href',
    'rows': 'number',
    'src': 'image',
    'target': 'url',
}


def choose_field_type(annotation):
    attribute = annotation.attribute
    if attribute == 'content':
        return 'text'
    return DEFAULTS.get(attribute, 'text')
