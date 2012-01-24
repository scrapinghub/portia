from .text import escape_html

class GeoPointFieldTypeProcessor(object):
    """Renders point with tags"""

    name = 'geopoint'
    description = 'geo point'
    multivalue = True

    def extract(self, value):
        return value

    def adapt(self, value, htmlpage):
        return value

    def render(self, field_name, field_value, item):
        try:
            lat, lon = field_value
        except (TypeError, ValueError):
            return escape_html(field_value)

        point = '{0},{1}'.format(lat, lon)
        return '<span class="geopoint" data-point="{0}">{0}</span>'.format(point)
