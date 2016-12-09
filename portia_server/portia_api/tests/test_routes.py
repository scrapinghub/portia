import unittest

from rest_framework.test import APIRequestFactory

from portia_api.resources.route import JsonApiRoute


class TestRoute(unittest.TestCase):
    def test_route_representation(self):
        factory = APIRequestFactory()
        request = factory.get('/projects/')
        route = JsonApiRoute(request=request)
        self.assertEqual(str(route), 'GET /projects/')
        self.assertEqual(repr(route), 'Route(GET /projects/)')
