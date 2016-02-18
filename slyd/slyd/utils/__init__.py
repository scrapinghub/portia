"""
html page utils
"""
from __future__ import absolute_import
from uuid import uuid4


def short_guid():
    return '-'.join(str(uuid4()).split('-')[1:4])
