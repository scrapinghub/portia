import os
import requests
import zipfile

from cStringIO import StringIO
from datetime import datetime
from repoman import Repoman


DASH_API_URL = os.environ.get('DASH_API_URL', 'http://33.33.33.51:8000/api/')


def import_project(name, apikey):
    """Download a project from Dash and create a GIT repo for it."""
    archive = zipfile.ZipFile(StringIO(_download_project(name, apikey)))
    repo = Repoman.create_repo(name)
    for filename in archive.namelist(): 
        repo.save_file(filename, archive.read(filename), 'master')
    return repo


def export_project(name, apikey):
    """Archive a GIT project and upload it to Dash."""
    zbuff = StringIO()
    _archive_project(name, zbuff, apikey)
    zbuff.reset()
    payload = {'apikey': apikey, 'project': name}
    req = requests.post(DASH_API_URL + 'as/import.json',
        files=[('archive', ('archive', zbuff, 'application/zip'))],
        params=payload)
    return req.text


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
