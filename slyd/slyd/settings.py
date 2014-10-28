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
SPEC_DATA_DIR = join(DATA_DIR, 'gitprojects')
MYSQL_DB = 'mysql://portia:portia@frankie:3306/portia'
#DASH_API_URL = 'http://marcos-portia-integration.demo.scrapinghub.com/api/'
DASH_API_URL = 'http://33.33.33.10:8000/api/'

#################### FILESYSTEM ################################
'''
SPEC_FACTORY = {
	'PROJECT_SPEC': 'slyd.projectspec.GitProjectSpec',
	'PROJECT_MANAGER': 'slyd.projectspec.GitProjectsManager',
	'PARAMS': {
		'location': SPEC_DATA_DIR,
	},
	'CAPABILITIES': {
		'version_control': False,
		'create_projects': True,
	}
}
'''

#################### GIT MYSQL ################################
'''
SPEC_FACTORY = {
	'PROJECT_SPEC': 'slyd.gitstorage.projectspec.GitProjectSpec',
	'PROJECT_MANAGER': 'slyd.gitstorage.projects.GitProjectsManager',
	'PARAMS': {
		'storage_backend': 'dulwich.mysqlrepo.MysqlRepo',
		'location': MYSQL_DB,
	},
	'CAPABILITIES': {
		'version_control': True,
		'create_projects': True,
	}
}
'''

#################### GIT FS ###################################
SPEC_FACTORY = {
	'PROJECT_SPEC': 'slyd.gitstorage.projectspec.GitProjectSpec',
	'PROJECT_MANAGER': 'slyd.gitstorage.projects.GitProjectsManager',
	'PARAMS': {
		'storage_backend': 'dulwich.fsrepo.FsRepo',
		'location': SPEC_DATA_DIR,
	},
	'CAPABILITIES': {
		'version_control': True,
		'create_projects': True,
	}
}

#################### DASH #####################################
'''
AUTH_CONFIG = {
	'CALLABLE': 'slyd.dash.dashauth.protectResource',
	'CONFIG': {
		'dash_url': DASH_API_URL,
	}
}

SPEC_FACTORY = {
	'PROJECT_SPEC': 'slyd.dash.projectspec.ProjectSpec',
	'PROJECT_MANAGER': 'slyd.dash.projects.ProjectsManager',
	'PARAMS': {
		'storage_backend': 'dulwich.mysqlrepo.MysqlRepo',
		'location': MYSQL_DB,
		'dash_url': DASH_API_URL,
	},
	'CAPABILITIES': {
		'version_control': True,
		'create_projects': True,
	}
}
'''

# recommended for development - use scrapy to cache http responses
# add them to local_settings.py
# HTTPCACHE_ENABLED = True
# HTTPCACHE_DIR = join(DATA_DIR, 'cache')

try:
    from local_settings import *
except ImportError:
    pass
