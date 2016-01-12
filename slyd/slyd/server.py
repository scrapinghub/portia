from twisted.python import log
from twisted.python.compat import intToBytes
from twisted.web import http
from twisted.web.http import _escape
from twisted.web.server import Site as WebSite, Request as WebRequest
from twisted.web.iweb import IAccessLogFormatter
from zope.interface.declarations import provider


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


@provider(IAccessLogFormatter)
def debugLogFormatter(timestamp, request):
    """
    @return: A combined log formatted log line for the given request.

    @see: L{IAccessLogFormatter}
    """
    referrer = _escape(request.getHeader(b"referer") or b"-")
    agent = _escape(request.getHeader(b"user-agent") or b"-")
    line = (
        u'"%(ip)s" - - %(timestamp)s "%(method)s %(uri)s %(protocol)s" '
        u'%(code)d %(length)s "%(referrer)s" "%(agent)s"' % dict(
            ip=_escape(request.getClientIP() or b"-"),
            timestamp=timestamp,
            method=_escape(request.method),
            uri=_escape(request.uri),
            protocol=_escape(request.clientproto),
            code=request.code,
            length=request.sentLength or u"-",
            referrer=referrer,
            agent=agent,
        )
    )
    return line
