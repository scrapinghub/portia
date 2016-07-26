from slyd.settings.base import *

AUTH_CONFIG = {
    'CALLABLE': 'auth.protectResource',
    'CONFIG': {}
}

SPEC_FACTORY = {
    'PROJECT_SPEC': 'slyd.projectspec.FileSystemProjectSpec',
    'PROJECT_MANAGER': 'slyd.projects.FileSystemProjectsManager',
    'PARAMS': {
        'location': "",
    },
    'CAPABILITIES': {
        'version_control': False,
        'create_projects': True,
        'delete_projects': True,
        'rename_projects': True,
        'deploy_projects': False,
        'rename_spiders': True,
        'rename_templates': True
    },
    'CUSTOM': {}
}
