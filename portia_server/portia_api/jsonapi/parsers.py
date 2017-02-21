from __future__ import unicode_literals

from rest_framework.parsers import JSONParser


class JSONApiParser(JSONParser):
    media_type = 'application/vnd.api+json'
