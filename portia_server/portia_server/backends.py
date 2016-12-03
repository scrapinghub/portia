from .models import LocalUser


class LocalAuthentication(object):
    def authenticate(self, request, **kwargs):
        return LocalUser(**kwargs), None

    def get_user(self, user_id):
        # fall through and let the middleware add the user again
        return None
