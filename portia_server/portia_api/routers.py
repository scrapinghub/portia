from rest_framework_nested.routers import SimpleRouter, NestedSimpleRouter

__all__ = [
    'Router',
    'NestedRouter',
]


class Router(SimpleRouter):
    def __init__(self, trailing_slash=False):
        super(Router, self).__init__(trailing_slash)

    def get_lookup_regex(self, viewset, lookup_prefix=''):
        return super(Router, self).get_lookup_regex(viewset, '')


class NestedRouter(NestedSimpleRouter, Router):
    def __init__(self, parent_router, parent_prefix, trailing_slash=False,
                 *args, **kwargs):
        super(NestedRouter, self).__init__(
            parent_router, parent_prefix, trailing_slash, *args, **kwargs)
