
class GeoPointFieldTypeProcessor(object):
    """Renders point with tags"""

    name = 'geopoint'
    description = 'geo point'
    multivalue = True

    def extract(self, value):
        return value

    def adapt(self, value, htmlpage=None):
        return value

