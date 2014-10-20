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

#################### FILESYSTEM ################################
PROJECT_SPEC = 'slyd.projectspec.ProjectSpec'
PROJECT_MANAGER = 'slyd.projects.ProjectsManager'
VERSION_CONTROL = False

#################### GIT #######################################
#PROJECT_SPEC = 'slyd.gitstorage.projectspec.GitProjectSpec'
#PROJECT_MANAGER = 'slyd.gitstorage.projects.GitProjectsManager'
#VERSION_CONTROL = True

#################### DASH ######################################
#PROJECT_SPEC = 'slyd.gitstorage.projectspec.GitProjectSpec'
#PROJECT_MANAGER = 'slyd.dash.projects.ProjectsManager'
#VERSION_CONTROL = True
#PORTIA_AUTH = 'slyd.dash.dashauth.protectResource'

# recommended for development - use scrapy to cache http responses
# add them to local_settings.py
# HTTPCACHE_ENABLED = True
# HTTPCACHE_DIR = join(DATA_DIR, 'cache')

try:
    from local_settings import *
except ImportError:
    pass
