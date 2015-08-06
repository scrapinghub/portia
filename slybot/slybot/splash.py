from scrapyjs import SplashMiddleware


class SlybotJsMiddleware(SplashMiddleware):
    def process_request(self, request, spider):
        req = super(SlybotJsMiddleware, self).process_request(request, spider)
        splash_auth = getattr(spider, 'splash_auth', None)
        if splash_auth and 'Authorization' not in request.headers:
            request.headers['Authorization'] = splash_auth
        return req

    def process_response(self, request, response, spider):
        splash_options = request.meta.get("_splash_processed")
        response = super(SlybotJsMiddleware, self).process_response(
            request, response, spider)
        if splash_options:
            url = splash_options['args'].get('url')
            response._set_url(url or response.url)
        return response
