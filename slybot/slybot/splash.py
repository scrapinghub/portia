import os

from scrapy_splash.middleware import SplashMiddleware
from scrapy_splash.response import _SplashResponseMixin


def replace(self, *args, **kwargs):
    """Create a new Response with the same attributes except for those
    given new values.
    """
    cls = kwargs.pop('cls', self.__class__)
    fields = ['url', 'status', 'headers', 'body', 'request', 'flags']
    if issubclass(cls, _SplashResponseMixin):
        fields.append('real_url')
    for x in fields:
        kwargs.setdefault(x, getattr(self, x))
    return cls(*args, **kwargs)
_SplashResponseMixin.replace = replace


DEFAULT_LUA_SOURCE = u'''
function main(splash)
  splash:init_cookies(splash.args.cookies or {})
  assert(splash:go(splash.args.url))
  assert(splash:wait(splash.args.wait))
  splash:runjs(splash.args.js_source)
  assert(splash:wait(0.5))
  return {
    html = splash:html(),
    cookies = splash:get_cookies(),
  }
end'''
js_file = os.path.join(os.path.dirname(__file__), 'splash-script-combined.js')
js_source = ""
if os.path.exists(js_file):
    with open(js_file, 'r') as f:
        js_source = f.read()


class SlybotJsMiddleware(SplashMiddleware):
    def process_request(self, request, spider):
        splash_opts = request.meta.get('splash')
        if splash_opts and 'args' in splash_opts:
            args = splash_opts['args']
            args['js_source'] = "{};\n{}".format(
                js_source, args.get('js_source', ''))

        req = super(SlybotJsMiddleware, self).process_request(
            request, spider)
        splash_auth = getattr(spider, 'splash_auth', None)
        if splash_auth and 'Authorization' not in request.headers:
            request.headers['Authorization'] = splash_auth
        return req
