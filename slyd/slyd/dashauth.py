import requests
import os
import json

from datetime import datetime, timedelta
from requests import exceptions as request_exceptions
from zope.interface import implements
from twisted.cred import portal, checkers, credentials, error as credError
from twisted.internet import defer, reactor
from twisted.web import static, resource
from twisted.web.resource import Resource, IResource
from twisted.web.http import HTTPChannel
from twisted.web import server
from twisted.web.guard import HTTPAuthSessionWrapper
from twisted.web.guard import BasicCredentialFactory


DASH_API_URL = os.environ.get('DASH_API_URL', 'http://33.33.33.51:8000/api/')


auth_cache = {}


AUTH_EXPIRATION_TIME = 30


class InvalidApiKey(Exception):
    pass


class ApiKeyChecker(object):
    """Verifies apikey credentials against Dash."""

    implements(checkers.ICredentialsChecker)
    credentialInterfaces = (credentials.IUsernamePassword,)

    def _validate_apikey(self, apikey):
        payload = {'apikey': apikey}
        r = requests.get(DASH_API_URL + 'users/get.json',
            params=payload)
        auth_info = r.json()
        if auth_info['status'] != 'ok':
            raise InvalidApiKey('Invalid apikey')
        auth_info['apikey'] = apikey
        auth_info['expires_at'] = datetime.now() + timedelta(
            seconds=AUTH_EXPIRATION_TIME)
        return auth_info

    def _expired(self, auth_info):
        return datetime.now() > auth_info['expires_at']
      
    def requestAvatarId(self, credentials):
        auth_info = None
        try:
            user = credentials.username
            apikey = credentials.password
            if user != 'APIKEY' or not apikey:
                raise InvalidApiKey(
                    "Credentials must follow the APIKEY:<user_apikey> pattern")
            auth_info = auth_cache.get(apikey)
            if not auth_info or self._expired(auth_info):
                auth_info = self._validate_apikey(apikey)
                auth_cache[apikey] = auth_info
            return defer.succeed(auth_info)
        except InvalidApiKey as ex:
            return defer.fail(credError.UnauthorizedLogin(
                ex.message or "Invalid apikey"))


class ProtectedRealm(object):

    implements(portal.IRealm)

    def __init__(self, protectedResource):
        self.protectedResource = protectedResource

    def requestAvatar(self, auth_info, mind, *interfaces):
        if IResource in interfaces:
            self.protectedResource.auth_info = auth_info
            return (IResource, self.protectedResource, lambda: None)
        raise NotImplementedError()


class ResourceShield(object):
    """Protects resources by requiring appropriate apikey credentials."""

    def protectResource(self, resource):
        """Protect the given resource by enforcing apikey based auth."""
        p = portal.Portal(ProtectedRealm(resource),
            [ApiKeyChecker()])
        if hasattr(resource, 'name'):
            name = resource.name
        else:
            name = ""
        return HTTPAuthSessionWrapper(p, [BasicCredentialFactory(name)])


class ServiceRoot(Resource):
    """A simple resource that injects auth info to every passing request."""

    def __init__(self, name):
        Resource.__init__(self)
        self.name = name

    def getChildWithDefault(self, path, request):
        request.auth_info = self.auth_info
        return resource.Resource.getChildWithDefault(self, path, request)


class MyResource(Resource):

    def __init__(self):
        resource.Resource.__init__(self)

    def getChild(self, path, request):
        text = "AUTHORIZED. This is your auth info: %s" % json.dumps(
            request.auth_info, indent=4)
        return static.Data(text, "text/plain")


if __name__ == "__main__":
    # Usage example.
    shield = ResourceShield()
    root = ServiceRoot("Test service")
    root.putChild("example", MyResource())
    site = server.Site(shield.protectResource(root))
    site.protocol = HTTPChannel
    reactor.listenTCP(8801, site)
    reactor.run()
