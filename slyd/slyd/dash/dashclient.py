import os
import requests
import zipfile
import json

from cStringIO import StringIO
from slyd.gitstorage.repoman import retry_operation, Repoman
from slyd.projecttemplates import templates as default_templates
from slyd.utils.download import GitProjectArchiver

from slybot.validation.schema import get_schema_validator


DASH_API_URL = None
REQUIRED_FILES = {'extractors.json', 'items.json', 'project.json'}


def set_dash_url(dash_url):
    global DASH_API_URL
    DASH_API_URL = dash_url


class DeployError(Exception):

    def __init__(self, message='', data={}):
        self.message = message
        self.data = data


def import_project(name, apikey, repo):
    """Download a project from Dash and create a GIT repo for it."""

    def validump_resource(jsonres, restype):
        get_schema_validator(restype).validate(jsonres)
        return json.dumps(jsonres)

    def split_templates(spider, spider_filename, files):
        templates = spider['templates']
        spider['templates'] = []
        spider['template_names'] = []
        for template in templates:
            template['name'] = template['page_id']
            spider['template_names'].append(template['name'])
            template_fname = os.path.join(
                spider_filename.rpartition('.')[0],
                str(template['name']) + '.json')
            files[template_fname] = validump_resource(template, 'template')

    archive = zipfile.ZipFile(StringIO(_download_project(name, apikey)))
    files = {}
    for filename in archive.namelist():
        contents = archive.read(filename)
        if filename == 'items.json':
            resource = 'items'
        elif filename == 'extractors.json':
            resource = 'extractors'
        elif filename.startswith('spiders'):
            resource = 'spider'
        else:
            resource = None
        if resource in ['items', 'spider', 'extractors']:
            as_json = json.loads(contents)
            if resource == 'items':
                as_json = _fix_items(as_json)
            elif resource == 'spider':
                split_templates(as_json, filename, files)
            contents = validump_resource(as_json, resource)
        files[filename] = contents
    if 'extractors.json' not in files:
        files['extractors.json'] = '{}'
    if ('items.json' not in files or not files['items.json'] or
            files['items.json'] == '{}'):
        files['items.json'] = default_templates['ITEMS']
    repo.save_files(files, 'master', 'Publishing initial import.')
    # XXX: Tell dash that project has been opened in Portia
    deploy_project(name, apikey, changed_files=[])


@retry_operation(retries=3, catches=(DeployError,))
def deploy_project(name, apikey, changed_files=None, repo=None,
                   branch='master'):
    """Archive a GIT project and upload it to Dash."""
    if repo is None:
        repo = Repoman.open_repo(name)
    archiver = GitProjectArchiver(repo,
                                  branch=branch,
                                  ignore_deleted=False,
                                  version=(0, 9),
                                  required_files=REQUIRED_FILES)
    spiders = None
    if changed_files is not None:
        spiders = {archiver._spider_name(name)
                   for name in changed_files if name.startswith('spiders/')}
    print(spiders)
    zbuff = archiver.archive(spiders)
    payload = {'apikey': apikey, 'project': name}
    req = requests.post(
        DASH_API_URL + 'as/import.json?version=portia',
        files=[('archive', ('archive', zbuff, 'application/zip'))],
        params=payload
    )
    if req.status_code == 200:
        project_url = DASH_API_URL.rsplit('/', 2)[0] + '/p/' + name
        return {
            'status': 'ok',
            'schedule_url': project_url
        }
    else:
        raise DeployError('Deploy to Dash failed: %s' % req.text)


def search_spider_names(project, apikey, name=''):
    """Search existing spider names in a project"""
    payload = {'project': project, 'apikey': apikey, 'spider': name}
    req = requests.get(DASH_API_URL + 'spiders/list.json',
                       params=payload)
    if req.status_code == 200:
        return [s.get('id') for s in req.json().get('spiders', [])]
    return []


def _fix_items(items):
    """Fixes issues with the imported items."""
    for _, item in items.iteritems():
        if 'url' in item['fields']:
            del item['fields']['url']
    return items


def _download_project(name, apikey):
    """Download a zipped project from Dash."""
    payload = {'apikey': apikey, 'project': name, 'version': 'portia'}
    r = requests.get(DASH_API_URL + 'as/project-slybot.zip', params=payload)
    return r.content
