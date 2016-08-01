from __future__ import unicode_literals

from rest_framework.renderers import JSONRenderer


class JSONApiRenderer(JSONRenderer):
    media_type = 'application/vnd.api+json'
    default_indent = 2

    def get_indent(self, accepted_media_type, renderer_context):
        indent = super(JSONApiRenderer, self).get_indent(
            accepted_media_type, renderer_context)
        if indent is None:
            return self.default_indent
        return indent

    def render(self, data, accepted_media_type=None, renderer_context=None):
        ret = super(JSONApiRenderer, self).render(data, accepted_media_type, renderer_context)
        response = renderer_context['response']

        content_type = self.media_type
        profiles = data.get('links', {}).get('profile', [])
        if profiles:
            content_type += '; profile="{}"'.format(' '.join(profiles))
        response['Content-Type'] = content_type

        return ret
