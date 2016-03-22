"""html page utils."""
from __future__ import absolute_import
from uuid import uuid4
from slybot.plugins.scrapely_annotations.builder import add_tagids, TAGID


def short_guid():
    return '-'.join(str(uuid4()).split('-')[1:4])


___all__ = [uuid4, add_tagids, TAGID, short_guid]
