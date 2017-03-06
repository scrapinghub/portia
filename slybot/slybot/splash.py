from scrapy_splash.middleware import SplashMiddleware
import os

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
            args['js_source'] = "%s;\n%s" % (js_source, args.get('js_source', ''))

        req = super(SlybotJsMiddleware, self).process_request(request, spider)
        splash_auth = getattr(spider, 'splash_auth', None)
        if splash_auth and 'Authorization' not in request.headers:
            request.headers['Authorization'] = splash_auth
        return req
