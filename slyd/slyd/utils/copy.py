from __future__ import absolute_import
import os
import json
import six


class CopyError(Exception):
    pass


class SpiderCopier(object):
    """
    Utility for copying spiders and items from one project to another.

    :source: read data from source project in read_file
    :destination: read and write to destination project in read_file and
                  save_files
    """
    def __init__(self, source, destination):
        self.source = source
        self.source_files = set(self.list_files(source))
        self.destination = destination
        self.destination_files = set(self.list_files(destination))

    def _spider_path(self, spider):
        return 'spiders/%s.json' % spider

    def copy(self, spiders, items=None):
        """
        Copies the provided spiders and items from the source project to the
        destination project. If spiders have name collisions the copied spider
        will be renamed. In the event of item name collisions a merge will be
        attempted.

        :list spiders: List of spiders to copy from the source to the
                       destination
        :list items: optional: List of items to copy that may not be scraped
                               by the provided spiders
        raises CopyError
        """
        if items is None:
            items = []
        spider_paths = set(self._spider_path(s) for s in spiders)
        self._check_missing(spider_paths)
        templates = self._load_templates(spiders)
        combined_items, renamed_items = \
            self._build_combined_items(templates, items)
        spider_data, renamed_spiders = self._load_spiders(spider_paths)
        templates = self._update_templates(templates, renamed_items,
                                           renamed_spiders)
        extractors = self._build_combined_extractors(templates)
        self._save_data({
            'items.json': combined_items,
            'extractors.json': extractors,
            'spiders': spider_data,
            'templates': templates,
        })
        return self._build_summary(spider_paths, items,
                                   renamed_spiders, renamed_items)

    def _refresh_destination_files(self):
        self.destination_files = set(self.list_files(self.destination))

    def _check_missing(self, spider_paths):
        """
        Check if any of the provided spiders don't exist.
        """
        missing = spider_paths - self.source_files
        if missing:
            raise CopyError('Unable to copy spiders as the following spiders '
                            'do not exist in the source project: "%s"' %
                            '", "'.join(missing))

    def _load_templates(self, spiders):
        templates = {}
        template_startswith = ['spiders/%s/' % spider for spider in spiders]
        for file_path in self.source_files:
            if any(file_path.startswith(ts) for ts in template_startswith):
                templates[file_path] = self.read_file(self.source, file_path)
        return templates

    def _update_templates(self, templates, renamed_items, renamed_spiders):
        """
        Handle renamed items during copy.
        """
        updated_templates = {}
        for file_path, template in templates.items():
            scrapes = template['scrapes']
            if scrapes in renamed_items:
                template['scrapes'] = renamed_items[scrapes]

            spider = file_path.split('/')[1]
            if spider in renamed_spiders:
                template_name = file_path.split('/')[-1]
                spider = renamed_spiders[spider]
                file_path = os.path.join('spiders', spider, template_name)
            updated_templates[file_path] = template

        return updated_templates

    def _load_spiders(self, spider_paths):
        spiders = {p: self.read_file(self.source, p) for p in spider_paths}
        renamed_spiders = {}
        for spider_path in spiders.keys():
            if spider_path in self.destination_files:
                spider_name = spider_path[8:-5]
                moved_spider = self._rename(spider_name,
                                            self.destination_files)
                self._refresh_destination_files()
                spiders[moved_spider] = spiders.pop(spider_path)
                if spider_name != moved_spider:
                    renamed_spiders[spider_name] = moved_spider[8:-5]

        return spiders, renamed_spiders

    def _rename(self, name, dest_values, base='spiders/%s_%s%s.json'):
        new_name = base % (name, 'copy', '')
        start = 1
        while new_name in dest_values:
            new_name = base % (name, 'copy', start)
            start += 1
        return new_name

    def _build_combined_items(self, templates, items):
        """
        Compare items from both source and destination. Merge compatible files,
        copy files that exist in the source and not the destination,
        rename incompatible files.
        """
        source_items = self.read_file(self.source, 'items.json')
        dest_items = self.read_file(self.destination, 'items.json')
        renamed_items = {}
        copy_items = set(t['scrapes'] for t in templates.values()
                         if 'scrapes' in t)
        for item in items:
            copy_items.add(item)
        for name, item in source_items.items():
            if name not in copy_items:
                continue
            if name in dest_items:
                new_name, item = self._merge_items(name, item,
                                                   dest_items[name],
                                                   list(dest_items.keys()))
                if new_name != name:
                    renamed_items[name] = new_name
                    name = new_name
            dest_items[name] = item
        return dest_items, renamed_items

    def _merge_items(self, name, source, dest, existing):
        source_fields = set(source['fields'])
        dest_fields = set(dest['fields'])
        intersection = source_fields & dest_fields
        if intersection:
            for field in intersection:
                s_field = source['fields'].get(field)
                d_field = dest['fields'].get(field)
                if s_field is None:
                    continue
                elif d_field is None and s_field['required']:
                    return self._rename(name, existing, '%s_%s%s'), source
                if any(s_field[p] != d_field[p] for p in ('required', 'type')):
                    return self._rename(name, existing, '%s_%s%s'), source
        for field in source_fields - dest_fields:
            dest['fields'][field] = source['fields'][field]
        return name, dest

    def _build_combined_extractors(self, templates):
        """
        Take all extractors needed by the spiders that are being copied and
        add them to the extractors at the destination
        """
        source_extractors = self.read_file(self.source, 'extractors.json')
        dest_extractors = self.read_file(self.destination, 'extractors.json')
        for spider in templates.values():
            for extractor in spider.get('extractors', []):
                if (extractor in source_extractors and
                        extractor not in dest_extractors):
                    dest_extractors[extractor] = source_extractors[extractor]
        return dest_extractors

    def _build_summary(self, spider_paths, items, renamed_spiders,
                       renamed_items):
        """
        Build a summary of copied spiders and items
        """
        spiders = [sp[8:-5] for sp in spider_paths]
        items = list(set(items) | set(renamed_items.keys()))
        return {
            'copied_spiders': spiders,
            'renamed_spiders': renamed_spiders,
            'copied_items': items,
            'renamed_items': renamed_items,
        }

    def _save_data(self, data):
        files_data = {}
        for path in data.keys():
            if isinstance(path, six.text_type):
                path = path.encode('utf-8')
            if path.endswith('.json'):
                files_data[path] = json.dumps(data.pop(path),
                                              sort_keys=True, indent=4)
            else:
                sub_directories = data.pop(path)
                for path in sub_directories.keys():
                    if isinstance(path, six.text_type):
                        path = path.encode('utf-8')
                    files_data[path] = json.dumps(sub_directories.pop(path),
                                                  sort_keys=True, indent=4)
        self.save_files(self.destination, files_data)

    def read_file(self, location, filename):
        raise NotImplementedError

    def list_files(self, location):
        raise NotImplementedError

    def save_files(self, location, files):
        raise NotImplementedError


class FileSystemSpiderCopier(SpiderCopier):
    def __init__(self, source, destination, base_dir='.'):
        self.base_dir = os.path.join(base_dir, '')
        super(FileSystemSpiderCopier, self).__init__(source, destination)

    def read_file(self, location, filename):
        with open(os.path.join(self.base_dir, location, filename), 'r') as f:
            return json.loads(f.read())

    def list_files(self, location):
        file_paths = []
        project_dir = os.path.join(self.base_dir, location)
        for dir, _, files in os.walk(project_dir):
            dir = dir.split(project_dir)[1]
            dir = dir[1:] if dir.startswith(os.path.sep) else dir
            for filename in files:
                if filename.endswith('.json'):
                    file_paths.append(os.path.join(dir, filename))
        return file_paths

    def save_files(self, location, files):
        for filename, data in files.items():
            file_path = os.path.join(self.base_dir, location, filename)
            with open(file_path, 'w') as f:
                f.write(data)


class GitSpiderCopier(SpiderCopier):

    def __init__(self, source, destination, branch):
        self.branch = branch
        super(GitSpiderCopier, self).__init__(source, destination)

    def read_file(self, location, filename):
        f = location.file_contents_for_branch(filename, self.branch)
        if f:
            return json.loads(f)
        else:
            return {}

    def list_files(self, location):
        try:
            return location.list_files_for_branch(self.branch)
        except KeyError:
            return location.list_files_for_branch('master')

    def save_files(self, location, files):
        return location.save_files(files, self.branch)
