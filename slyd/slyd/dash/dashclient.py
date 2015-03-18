import os
import requests
import zipfile
import json

from collections import defaultdict
from cStringIO import StringIO
from datetime import datetime
from slyd.gitstorage.repoman import Repoman, retry_operation

from slybot.validation.schema import get_schema_validator


DASH_API_URL = None
DEFAULT_DASH_ITEM = '''{
  "default": {
    "fields": {
      "images": {"type": "image", "required": true, "vary": false},
      "price": {"type": "price", "required": true, "vary": false},
      "name": {"type": "text", "required": true, "vary": false},
      "description": {"type": "safe html", "required": false, "vary": false}
    }
  }
}'''
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
    if 'items.json' not in files:
        files['items.json'] = DEFAULT_DASH_ITEM
    repo.save_files(files, 'master', 'Publishing initial import.')
    # XXX: Tell dash that project has been opened in Portia
    deploy_project(name, apikey, changed_files=[])


@retry_operation(retries=3, catches=(DeployError,))
def deploy_project(name, apikey, changed_files=None, repo=None,
                   branch='master'):
    """Archive a GIT project and upload it to Dash."""
    zbuff = StringIO()
    if changed_files is not None:
        changed_files = list(set(changed_files) | REQUIRED_FILES)
    _archive_project(name, zbuff, changed_files, repo, branch)
    zbuff.reset()
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


def _add_to_archive(archive, filename, contents, tstamp):
    """Add a file to a zip archive."""
    fileinfo = zipfile.ZipInfo(filename, tstamp)
    fileinfo.external_attr = 0666 << 16L
    archive.writestr(fileinfo, contents, zipfile.ZIP_DEFLATED)


def _archive_project(name, buff, files=None, repo=None, branch='master'):
    """Archive a project stored in GIT into a zip file."""
    if repo is None:
        repo = Repoman.open_repo(name)
    now = datetime.now().timetuple()[:6]
    archive = zipfile.ZipFile(buff, "w", zipfile.ZIP_DEFLATED)
    files_list = files if files is not None else \
        repo.list_files_for_branch(branch)
    all_files = files_list if files is None else \
        repo.list_files_for_branch(branch)

    template_paths = defaultdict(list)
    for file_path in all_files:
        split_file_path = file_path.split('/')
        if len(split_file_path) > 2:
            template_paths[split_file_path[1]].append(file_path)
    extractors = json.loads(repo.file_contents_for_branch('extractors.json',
                                                          branch) or '{}')

    seen_files = set()
    spiders = set()
    for file_path in files_list:
        if file_path.startswith('spiders'):
            try:
                parts = file_path.split("/")
                if len(parts) >= 2:
                    spider_name = parts[1]
                    if spider_name.endswith('.json'):
                        spider_name = spider_name[:-5]
                    if spider_name not in spiders:
                        # Load spider if necessary
                        if len(parts) > 2:
                            file_path = 'spiders/' + spider_name + '.json'
                        file_contents = repo.file_contents_for_branch(
                            file_path, branch)
                        as_json = json.loads(file_contents)
                        templates = []
                        # Load all spider templates
                        spider_templates = template_paths.get(spider_name, [])
                        for template_path in spider_templates:
                            seen_files.add(template_path)
                            existing = {}
                            # Ignore deleted templates
                            try:
                                templ_contents = repo.file_contents_for_branch(
                                    template_path, branch)
                            except (TypeError, ValueError):
                                continue
                            json_template = json.loads(templ_contents)
                            # Validate extractors
                            template_extractors = json_template.get(
                                'extractors', {})
                            for field, eids in template_extractors.items():
                                existing[field] = [eid for eid in eids
                                                   if eid in extractors]
                            json_template['extractors'] = existing
                            spider_name = parts[1]
                            templates.append(json_template)
                        spiders.add(spider_name)
                        as_json.pop('template_names', None)
                        as_json['templates'] = templates
                        _add_to_archive(archive, file_path,
                                        json.dumps(as_json), now)
            except TypeError:
                # Handle Deleted Spiders
                file_contents = repo.file_contents_for_branch(file_path,
                                                              'master')
                file_info = {'deleted': True}
                if file_contents:
                    as_json = json.loads(file_contents)
                _add_to_archive(archive, file_path, json.dumps(file_info), now)
        else:
            file_contents = repo.file_contents_for_branch(file_path, branch)
            _add_to_archive(archive, file_path, file_contents, now)
        seen_files.add(file_path)

    # Add empty placeholders for missing files required by dash
    for file_path in {'extractors.json', 'items.json'} - seen_files:
        _add_to_archive(archive, file_path, '{}', now)
    archive.close()
