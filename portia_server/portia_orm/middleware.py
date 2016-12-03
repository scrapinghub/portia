from .datastore import data_store_context


class ORMDataStoreMiddleware(object):
    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        with data_store_context():
            return self.get_response(request)
