"""Scrapy settings"""
from os.path import join, dirname

EXTENSIONS = {
    'scrapy.contrib.logstats.LogStats': None,
    'scrapy.webservice.WebService': None,
    'scrapy.telnet.TelnetConsole': None,
    'scrapy.contrib.throttle.AutoThrottle': None
}

LOG_LEVEL = 'DEBUG'

# location of slybot projects - assumes a subdir per project
DATA_DIR = join(dirname(dirname(__file__)), 'data')
SPEC_DATA_DIR = join(DATA_DIR, 'projects')


# recommended for development - use scrapy to cache http responses
HTTPCACHE_ENABLED = True
HTTPCACHE_DIR = join(DATA_DIR, 'cache')
