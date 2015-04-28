from twisted.python import log
from twisted.python.compat import intToBytes
from twisted.web import http
from twisted.web.server import Site as WebSite, Request as WebRequest


class Request(WebRequest):
    def is_ajax(self):
        req_with = self.requestHeaders.getRawHeaders('X-Requested-With', [])
        return 'XMLHttpRequest' in req_with

    def processingFailed(self, reason):
        if self.is_ajax():
            log.err(reason)
            if self.site.displayTracebacks:
                body = reason.getTraceback()
            else:
                body = b"Processing Failed"

            self.setResponseCode(http.INTERNAL_SERVER_ERROR)
            self.setHeader(b'content-type', b"text/plain")
            self.setHeader(b'content-length', intToBytes(len(body)))
            self.write(body)
            self.finish()
            return reason

        return WebRequest.processingFailed(self, reason)


class Site(WebSite):
    requestFactory = Request
