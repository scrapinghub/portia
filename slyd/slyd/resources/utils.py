class BaseApiResponse(object):
    def __init__(self, data):
        self.data = data

    def format_response(self, request, data):
        raise NotImplementedError
