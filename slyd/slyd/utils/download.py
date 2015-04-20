import itertools
import json
import os
import zipfile

from collections import defaultdict
from cStringIO import StringIO
from datetime import datetime

from slyd.projecttemplates import templates

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


class ProjectArchiver(object):

    required_files = frozenset(REQUIRED_FILES)
    file_templates = FILE_TEMPLATES

    def __init__(self, project, version=None, required_files=None):
        if version is None:
            version = (0, 10)
        self.separator = os.path.sep
        self.version = version
        self.project = project
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
        zbuff.reset()
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
                seen_files.update(added)
                if contents is not None:
                    self._add_file(file_path, contents, now)
            else:
                self._add_file(file_path, self.read_file(file_path), now)
                seen_files.add(file_path)
        missing = (set(self.file_templates) & self.required_files) - seen_files
        for file_path in missing:
            self._add_file(file_path, self.file_templates[file_path], now)

    def _add_file(self, filename, contents, tstamp):
        """
        Add a file to the zip archive.
        """
        if filename is None or contents is None:
            return
        fileinfo = zipfile.ZipInfo(filename, tstamp)
        fileinfo.external_attr = 0666 << 16L
        self._archive.writestr(fileinfo, contents, zipfile.ZIP_DEFLATED)

    def _add_spider(self, file_path, templates, extractors):
        """
        Add a spider or template to the archive. If the slybot version is less
        than 0.10 a spider and all of its templates are added as a single file.
        """
        if self.version > (0, 9):
            data = self.read_file(file_path, deserialize=True)
            added = {file_path}
        else:
            file_path, data, added = self._add_legacy_spider(file_path,
                                                             templates,
                                                             extractors)
        if data.get('deleted'):
            return self._deleted_spider(file_path, data, templates)

        spider_content = json.dumps(data, sort_keys=True, indent=4)
        return file_path, spider_content, added

    def _add_legacy_spider(self, file_path, templates, extractors):
        """
        Build a legacy spider and add all templates to a single spider object
        """
        spider = self._spider_name(file_path)
        file_path = self._spider_path(file_path)
        spider_data = self.read_file(file_path, deserialize=True)
        if spider_data.get('deleted'):
            return file_path, spider_data, {file_path}
        spider_data.pop('template_names', None)
        spider_templates = templates.get(spider, [])
        templates, added = self._spider_templates(spider_templates, extractors)
        added.add(file_path)
        spider_data['templates'] = templates
        return file_path, spider_data, added

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

    def _spider_templates(self, templates, extractors):
        """
        Find all templates for a legacy spider and combine them into a single
        list.
        """
        templates, added = [], set()
        for template_path in templates:
            added.add(template_path)
            existing = {}
            template = self.read_file(template_path, deserialize=True)
            if template is None:
                continue
            template_extractors = template.get('extractors', {})
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

    def _spider_path(self, file_path):
        if len(file_path.split(self.separator)) > 2:
            return 'spiders/%s.json' % self._spider_name(file_path)
        return file_path

    def _paths(self, spiders):
        """
        Build a collection of paths needed to build the archive.
        """
        if spiders is None or spiders == '*':
            all_files = self.list_files()
            return all_files, all_files, self._template_paths(None, all_files)
        if isinstance(spiders, basestring):
            spiders = [spiders]
        spider_paths = set('spiders/%s.json' % spider for spider in spiders)
        all_files = self.list_files()
        template_paths = self._template_paths(spiders, all_files)
        if self.version > (0, 9):
            templates = set(itertools.chain(*template_paths.itervalues()))
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
        raise NotImplementedError

    def read_file(self, filename, deserialize=False):
        raise NotImplementedError


class FileSystemProjectArchiver(ProjectArchiver):
    def __init__(self, project, version=None, required_files=None,
                 base_dir='.'):
        self.base_dir = os.path.join(base_dir, '')
        super(FileSystemProjectArchiver, self).__init__(project, version,
                                                        required_files)
        self.separator = os.path.sep

    def list_files(self):
        file_paths = []
        project_dir = os.path.join(self.base_dir, self.project)
        for dir, _, files in os.walk(project_dir):
            dir = dir.split(project_dir)[1]
            dir = dir[1:] if dir.startswith(os.path.sep) else dir
            for filename in files:
                if filename.endswith(('.json', '.cfg', '.py')):
                    file_paths.append(os.path.join(dir, filename))
        return file_paths

    def read_file(self, filename, deserialize=False):
        file_path = os.path.join(self.base_dir, self.project, filename)
        if not os.path.isfile(file_path):
            return
        with open(file_path, 'r') as f:
            contents = f.read()
            if deserialize and contents:
                return json.loads(contents)
            return contents


class GitProjectArchiver(ProjectArchiver):

    def __init__(self, project, version=None, ignore_deleted=True,
                 required_files=None, branch='master'):
        self.branch = branch
        self.ignore_deleted = ignore_deleted
        super(GitProjectArchiver, self).__init__(project, version,
                                                 required_files)
        self.separator = '/'

    def list_files(self):
        return list(set(self.project.list_files_for_branch('master')) |
                    set(self.project.list_files_for_branch(self.branch)))

    def read_file(self, filename, deserialize=False):
        contents = self.project.file_contents_for_branch(filename, self.branch)
        if contents is None and not self.ignore_deleted:
            contents = json.dumps({'deleted': True})
        if deserialize and contents is not None:
            return json.loads(contents)
        return contents
