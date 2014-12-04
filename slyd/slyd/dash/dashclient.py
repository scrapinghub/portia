import os
import requests
import zipfile
import json

from cStringIO import StringIO
from datetime import datetime
from slyd.gitstorage.repoman import Repoman

from slybot.validation.schema import get_schema_validator


DASH_API_URL = None


def set_dash_url(dash_url):
    global DASH_API_URL
    DASH_API_URL = dash_url


class DeployError(Exception):
    pass


def import_project(name, apikey, repo):
    """Download a project from Dash and create a GIT repo for it."""
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
                as_json = _fix_spider(as_json)
                templates = as_json['templates']
                for template in templates:
                    template['name'] = template['page_id']
                    template_fname = os.path.join(filename, template['name'])
                    files[template_fname] = json.dumps(template)
            # Validate against slybot schemas.
            get_schema_validator(resource).validate(as_json)
            contents = json.dumps(as_json)
        files[filename] = contents
    repo.save_files(files, 'master', 'Publishing initial import.')


def deploy_project(name, apikey):
    """Archive a GIT project and upload it to Dash."""
    zbuff = StringIO()
    _archive_project(name, zbuff)
    zbuff.reset()
    payload = {'apikey': apikey, 'project': name}
    req = requests.post(DASH_API_URL + 'as/import.json',
        files=[('archive', ('archive', zbuff, 'application/zip'))],
        params=payload)
    if req.status_code == 200:
        project_url = DASH_API_URL.rsplit('/', 2)[0] + '/p/' + name
        return {
            'status': 'ok',
            'schedule_url': project_url,
        }
    else:
        raise DeployError('Deploy to Dash failed: %s' % req.text)


def _fix_items(items):
    """Fixes issues with the imported items."""
    for _, item in items.iteritems():
        if 'url' in item['fields']:
            del item['fields']['url']
    return items


def _fix_spider(spider):
    for template in spider['templates']:
        template['name'] = template['page_id']
    return spider


def _download_project(name, apikey):
    """Download a zipped project from Dash."""
    payload = {'apikey': apikey, 'project': name, 'version': 'slybot'}
    r = requests.get(DASH_API_URL + 'as/project-slybot.zip', params=payload)
    return r.content


def _add_to_archive(archive, filename, contents, tstamp):
    """Add a file to a zip archive."""
    fileinfo = zipfile.ZipInfo(filename, tstamp)
    fileinfo.external_attr = 0666 << 16L
    archive.writestr(fileinfo, contents, zipfile.ZIP_DEFLATED)


def _archive_project(name, buff):
    """Archive a project stored in GIT into a zip file."""
    repo = Repoman.open_repo(name)
    now = datetime.now().timetuple()[:6]
    archive = zipfile.ZipFile(buff, "w", zipfile.ZIP_DEFLATED)
    files_list = repo.list_files_for_branch('master')
    extractors = {}
    for file_path in files_list:
        if file_path.endswith('extractors.json'):
            extractors = json.loads(repo.file_contents_for_branch(file_path,
                                                                  'master'))

    for file_path in files_list:
        file_contents = repo.file_contents_for_branch(file_path, 'master')
        if file_path.startswith('spiders'):
            as_json = json.loads(file_contents)
            templates = as_json.get('templates', [])
            for template in templates:
                existing = {}
                for field, eid in template.get('extractors', {}).iteritems():
                    if eid in extractors:
                        existing[field] = eid
                template['extractors'] = extractors
            _add_to_archive(archive, file_path, json.dumps(as_json), now)
        else:
            _add_to_archive(archive, file_path, file_contents, now)
    archive.close()
