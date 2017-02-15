import urllib2
import json
import random
import cookielib

class CookiesFetcher(object):

    def fetch(self, current_url):
        cookies = cookielib.LWPCookieJar()
        handlers = [
          urllib2.HTTPHandler(),
          urllib2.HTTPSHandler(),
          urllib2.HTTPCookieProcessor(cookies)
        ]
        opener = urllib2.build_opener(*handlers)
        self._prepare(current_url, opener)
        return self._dump(cookies)

    def _prepare(self, url, opener):

        request = urllib2.Request(url)
        user_agents = ['Mozilla/5.0 (X11; U; Linux i686) Gecko/20071127 Firefox/2.0.0.11',
                       'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) \
               Chrome/41.0.2228.0 Safari/537.36',
                       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 \
               (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A']
        request.add_header('User-agent', user_agents[random.randint(0, 2)])
        return opener.open(request)

    def _dump(self, cookies):
        cookies_list = [{cookie.name: cookie.value} for cookie in cookies]
        return json.dumps(cookies_list, encoding='UTF-8', default=str)
