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


def import_project(name, apikey):
    """Download a project from Dash and create a GIT repo for it."""
    archive = zipfile.ZipFile(StringIO(_download_project(name, apikey)))
    repo = Repoman.create_repo(name)
    files = {}
    for filename in archive.namelist():
        contents = archive.read(filename)
        if filename == 'items.json':
            resource = 'items'
            contents = _fix_items(contents)
        elif filename == 'extractors.json':
            resource = 'extractors'
        elif filename.startswith('spiders'):
            resource = 'spider'
        else:
            resource = None
        if resource in ['items', 'spider', 'extractors']:
            # Validate against slybot schemas.
            get_schema_validator(resource).validate(json.loads(contents))
        files[filename] = contents
    repo.save_files(files, 'master', 'Initial import.')
    return repo


def deploy_project(name, apikey):
    """Archive a GIT project and upload it to Dash."""
    zbuff = StringIO()
    _archive_project(name, zbuff)
    zbuff.reset()
    payload = {'apikey': apikey, 'project': name}
    req = requests.post(DASH_API_URL + 'as/import.json',
        files=[('archive', ('archive', zbuff, 'application/zip'))],
        params=payload)
    project_url = DASH_API_URL.rsplit('/', 2)[0] + '/p/' + name
    return {
        'status': 'ok',
        'schedule_url': project_url,
    }


def _fix_items(raw_items):
    """Fixes issues with the imported items."""
    items = json.loads(raw_items)
    for _, item in items.iteritems():
        if 'url' in item['fields']:
            del item['fields']['url']
    return json.dumps(items) 


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
    for file_path in repo.list_files_for_branch('master'):
        file_contents = repo.file_contents_for_branch(file_path, 'master')
        _add_to_archive(archive, file_path, file_contents, now)
    archive.close()
