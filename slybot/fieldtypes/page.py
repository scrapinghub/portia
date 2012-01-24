class HtmlPageFieldTypeProcessor(object):
    name = 'html page'
    description = 'renders items as html browser snapshot'

    def render(self, field_name, body, item):
        """Renders as thumbnail image"""
        thumbnail_url = "thumbnail/%s.jpg" % item["_id"]

        return u"<img alt='%s' title='%s' src='%s'>" % \
                (thumbnail_url, thumbnail_url, thumbnail_url)
