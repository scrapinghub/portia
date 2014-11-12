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


auth_cache = {}


AUTH_EXPIRATION_TIME = 30


class InvalidApiKey(Exception):
    pass


class ApiKeyChecker(object):
    """Verifies apikey credentials against Dash."""

    implements(checkers.ICredentialsChecker)
    credentialInterfaces = (credentials.IUsernamePassword,)

    def __init__(self, dash_api_url):
        self.dash_api_url = dash_api_url

    def _validate_apikey(self, apikey):
        payload = {'apikey': apikey}
        r = requests.get(self.dash_api_url + 'users/get.json',
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


class AuthResource(Resource):
    """A simple wrapper that injects auth info to every passing request."""

    def __init__(self, resource):
        Resource.__init__(self)
        self.wrapped = resource

    def getChildWithDefault(self, path, request):
        request.auth_info = {
            'username': self.auth_info['username'],
            'authorized_projects': map(str, self.auth_info['projects']),
            'service_token': self.auth_info['apikey'],
            'staff': self.auth_info['staff'],
        }
        # Don't consume any segments.
        request.postpath.insert(0, request.prepath.pop())
        return self.wrapped


def protectResource(resource, config):
    """Protect the given resource by enforcing apikey based auth."""
    wrapped = AuthResource(resource)
    p = portal.Portal(ProtectedRealm(wrapped), [ApiKeyChecker(
        config['dash_url'])])
    return HTTPAuthSessionWrapper(p, [BasicCredentialFactory('Portia')])
