from __future__ import absolute_import
import itertools
import json
import os
import six
import zipfile

from collections import defaultdict
from os.path import join
from six import StringIO
from datetime import datetime

from slybot.utils import decode
from portia2code.porter import load_project_data, port_project

from storage.projecttemplates import templates

REQUIRED_FILES = {'setup.py', 'scrapy.cfg', 'extractors.json', 'items.json',
                  'project.json', 'spiders/__init__.py', 'spiders/settings.py'}
FILE_TEMPLATES = {
    'extractors.json': '{}',
    'items.json': '{}',
    'project.json': templates['PROJECT'],
    'scrapy.cfg': templates['SCRAPY'],
    'setup.py': templates['SETUP'],
    'spiders/__init__.py': '',
    'spiders/settings.py': templates['SETTINGS']
}


def walk(storage, dirname=''):
    dirs, files = storage.listdir(dirname)
    for dname in dirs:
        files.extend([join(dname, fname)
                      for fname in walk(storage, join(dirname, dname))])
    return set(files)


class ProjectArchiver(object):

    required_files = frozenset(REQUIRED_FILES)
    file_templates = FILE_TEMPLATES

    def __init__(self, storage, required_files=None):
        self.separator = os.path.sep
        self.storage = storage
        self.name = storage.name
        if required_files is not None:
            self.required_files = required_files

    def archive(self, spiders=None):
        """
        Zip the contents or a subset of the contents in this project together
        """
        zbuff = StringIO()
        self._archive = zipfile.ZipFile(zbuff, "w", zipfile.ZIP_DEFLATED)
        self._add_files(spiders)
        self._archive.close()
        zbuff.seek(0)
        return zbuff

    def _add_files(self, spiders):
        """
        Add all selected spiders and other files to the project
        """
        now = datetime.now().timetuple()[:6]
        extractors = self.read_file('extractors.json', deserialize=True) or {}
        files, all_files, spider_templates = self._paths(spiders)
        seen_files = set()
        for file_path in files:
            if file_path in seen_files:
                continue
            if (file_path.startswith('spiders/') and
                    file_path.endswith('.json')):
                path, contents, added = self._add_spider(file_path,
                                                         spider_templates,
                                                         extractors)
                if contents is not None:
                    self._add_file(file_path, contents, now)
            else:
                self._add_file(file_path, self.read_file(file_path), now)
        file_list = set(f.filename for f in self._archive.filelist)
        for file_path in self.required_files:
            if file_path in file_list:
                continue
            self._add_file(file_path, self.file_templates[file_path], now)

    def _add_file(self, filename, contents, tstamp):
        """
        Add a file to the zip archive.
        """
        if filename is None or contents in (None, 'null'):
            return
        fileinfo = zipfile.ZipInfo(filename, tstamp)
        fileinfo.external_attr = 0o666 << 16
        self._archive.writestr(fileinfo, contents, zipfile.ZIP_DEFLATED)

    def _add_spider(self, file_path, templates, extractors):
        """
        Add a spider or template to the archive.
        """
        data = self.read_file(file_path, deserialize=True)
        added = {file_path}
        if data is not None and data.get('deleted'):
            return self._deleted_spider(file_path, data, templates)

        spider_content = json.dumps(data, sort_keys=True, indent=4)
        return file_path, spider_content, added

    def _deleted_spider(self, file_path, spider_data, templates):
        """
        Add information about a deleted spider.
        """
        spider = self._spider_name(file_path)
        file_path = self._spider_path(file_path)
        added = {file_path}
        added.update(set(templates.get(spider, [])))
        if self.ignore_deleted:
            return None, None, added
        spider_content = json.dumps(spider_data, sort_keys=True, indent=4)
        return file_path, spider_content, added

    def _spider_templates(self, spider_templates, extractors):
        """
        Find all templates for a legacy spider and combine them into a single
        list.
        """
        templates, added = [], set()
        for template_path in spider_templates:
            added.add(template_path)
            existing = {}
            template = self.read_file(template_path, deserialize=True)
            if template is None:
                continue
            template_extractors = template.get('extractors', {})
            if not isinstance(template_extractors, dict):
                template_extractors = {e.get('field'): e.get('id')
                                       for e in template_extractors
                                       if 'field' in e and e['field']}
            for field, eids in template_extractors.items():
                existing[field] = [eid for eid in eids
                                   if eid in extractors]
            template['extractors'] = existing
            templates.append(template)
        return templates, added

    def _spider_name(self, file_path):
        """
        Get the name of a spider for a template or spider path.
        """
        split = file_path.split(self.separator)
        if len(split) > 2:
            return split[1]
        return split[1][:-5]

    def _name(self, file_path):
        """
        Get the name for the current json path
        """
        split = file_path.split(self.separator)
        if split[-1].endswith('.json'):
            return split[-1][:-5]
        return ''

    def _spider_path(self, file_path):
        if len(file_path.split(self.separator)) > 2:
            return 'spiders/%s.json' % self._spider_name(file_path)
        return file_path

    def _paths(self, spiders):
        """
        Build a collection of paths needed to build the archive.
        """
        if spiders is None:
            all_files = self.list_files()
            return all_files, all_files, self._template_paths(None, all_files)
        if isinstance(spiders, six.string_types):
            spiders = [spiders]
        spider_paths = set('spiders/%s.json' % spider for spider in spiders)
        all_files = self.list_files()
        template_paths = self._template_paths(spiders, all_files)
        templates = set(itertools.chain(*template_paths.values()))
        spider_paths = spider_paths | templates
        files = list(set(spider_paths) | self.required_files)
        return files, all_files, template_paths

    def _template_paths(self, spiders, files):
        """
        Map all template paths to the corresponding spider.
        """
        spider_templates = defaultdict(list)
        for file_path in files:
            split_file_path = file_path.split('/')
            if len(split_file_path) > 2 and (spiders is None or
                                             split_file_path[1] in spiders):
                spider_templates[split_file_path[1]].append(file_path)
        return spider_templates

    def list_files(self):
        return walk(self.storage)

    def read_file(self, filename, deserialize=False):
        try:
            contents = self.storage.open(filename).read()
        except IOError as e:
            if filename in ('items.json', 'extractors.json'):
                return {} if deserialize else '{}'
            raise e
        if deserialize and contents is not None:
            return json.loads(contents)
        return contents


class CodeProjectArchiver(ProjectArchiver):
    def archive(self, spiders=None):

        class ArchivingStorage(object):
            def __init__(self, storage):
                self.storage = storage

            def isdir(self, *args, **kwargs):
                return self.storage.isdir(self.rel_path(*args))

            def listdir(self, *args, **kwargs):
                if spiders and args == ['spiders']:
                    return ['{}.json'.format(s) for s in spiders]
                path = self.rel_path(*args)
                return itertools.chain(*self.storage.listdir(path))

            def rel_path(self, *args):
                return '/'.join(args)

            def open(self, *args, **kwargs):
                raw = kwargs.get('raw')
                fp = self.storage.open_with_default(self.rel_path(*args), {})
                return decode(fp.read()) if raw else json.load(fp)

        storage = ArchivingStorage(self.storage)
        schemas, extractors, spiders = load_project_data(storage)
        name = self._process_name()
        return port_project(name, schemas, spiders, extractors)

    def _process_name(self):
        try:
            int(self.name)
        except ValueError:
            return self.name
        # Scrapy will not allow the use of a number as a project name
        return 'A%s' % self.name
