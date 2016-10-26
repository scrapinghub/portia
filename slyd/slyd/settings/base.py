"""Scrapy settings"""
from os.path import join, dirname

EXTENSIONS = {
    'scrapy.contrib.logstats.LogStats': None,
    'scrapy.webservice.WebService': None,
    'scrapy.telnet.TelnetConsole': None,
    'scrapy.contrib.throttle.AutoThrottle': None
}

LOG_LEVEL = 'DEBUG'
SCHEDULE_URL = 'http://localhost:6800/schedule.json'

# location of slybot projects - assumes a subdir per project
DATA_DIR = join(dirname(dirname(__file__)), 'data')
SPEC_DATA_DIR = join(DATA_DIR, 'projects')

DJANGO_SETTINGS = 'portia_server.settings'

SPEC_FACTORY = {
    'PROJECT_SPEC': 'slyd.projectspec.FileSystemProjectSpec',
    'PROJECT_MANAGER': 'slyd.projects.FileSystemProjectsManager',
    'PARAMS': {
        'location': SPEC_DATA_DIR,
        'schedule_url': SCHEDULE_URL
    },
}

PLUGINS = [{
    "ui": "portiaWeb.annotations-plugin",
    "web": "slyd.plugins.scrapely_annotations.Annotations",
    "bot": "slybot.plugins.scrapely_annotations.Annotations",
    "type": "extraction",
    "options": {
        "fillColor": 'rgba(88,150,220,0.4)',
        "strokeColor": 'rgba(88,150,220,0.4)',
        "textColor": 'white'
    }
}]


# recommended for development - use scrapy to cache http responses
# add them to local_settings.py
# HTTPCACHE_ENABLED = True
# HTTPCACHE_DIR = join(DATA_DIR, 'cache')
