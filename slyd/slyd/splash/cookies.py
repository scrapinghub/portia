from splash.cookies import SplashCookieJar
from splash.har.qt import cookies2har

class PortiaCookieJar(SplashCookieJar):
    def __init__(self, web_page, socket):
        super(SplashCookieJar, self).__init__(web_page)
        self.socket = socket
        self._last_cookies = None

    def setCookiesFromUrl(self, cookie_list, url):
        result = super(PortiaCookieJar, self).setCookiesFromUrl(cookie_list, url)
        self.update_client_cookies()
        return result

    def setAllCookies(self, cookie_list):
        result = super(PortiaCookieJar, self).setAllCookies(cookie_list)
        self.update_client_cookies()
        return result

    def put_client_cookies(self, cookie_list):
        """ Set all cookies without updating the client.
        cookie_list is a list of har cookies"""
        qt_cookies = [self.har_cookie2qt(c) for c in cookie_list]
        return super(PortiaCookieJar, self).setAllCookies(qt_cookies)

    def update_client_cookies(self):
        cookies = self.allCookies()
        if self._last_cookies == cookies:
            return
        self._last_cookies = cookies
        self.socket.sendMessage({
            '_command': 'cookies',
            'cookies': cookies2har(cookies)
        })
