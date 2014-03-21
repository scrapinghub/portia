"""
Slyd test settings

Imports slyd settings and adds necessary overrides for test setup
"""
from slyd.settings import *

LOG_LEVEL = 'DEBUG'

# testing never makes remote requests. A cache may serve stale content.
HTTPCACHE_ENABLED = False

RESOURCE_DIR = join(dirname(__file__), 'resources')
DATA_DIR = join(RESOURCE_DIR, 'data')
SPEC_DATA_DIR = join(DATA_DIR, 'projects')
