from __future__ import absolute_import

import getpass
import json
import re

import requests

from os.path import join, splitext

from scrapy.http import HtmlResponse
from .html import html4annotation
from .errors import BaseHTTPError, BadRequest
from storage.backends import ContentFile, FsStorage


def convert_template(template):
    """Converts the template annotated body for being used in the UI."""
    template['annotated_body'] = html4annotation(
        template['annotated_body'], template['url'], proxy_resources=True)


class ProjectSpec(object):

    resources = ('project', 'items', 'extractors')
    base_dir = '.'
    plugins = []

    @classmethod
    def setup(cls, location, **kwargs):
        cls.base_dir = location
        cls.SCHEDULE_URL = kwargs.get(
            'schedule_url', 'http://localhost:6800/schedule.json')

    def __init__(self, project_name, auth_info):
        self.project_dir = join(self.base_dir, project_name)
        self.project_name = project_name
        self.auth_info = auth_info
        self.user = auth_info['username']
        self.spider_commands = {
            'mv': self.rename_spider,
            'rm': self.remove_spider,
            'mvt': self.rename_template,
            'rmt': self.remove_template,
        }

    def run(self, callback, **kwargs):
        return callback(**kwargs)

    def list_spiders(self):
        _, files = self.storage.listdir(join(self.project_dir, "spiders"))
        for fname in files:
            if fname.endswith(".json"):
                yield splitext(fname)[0]

    def spider_with_templates(self, spider):
        spider_spec = self.resource('spiders', spider)
        templates = []
        for template in spider_spec.get('template_names', []):
            try:
                templates.append(self.resource('spiders', spider, template))
            except IOError:
                self.remove_template(spider, template)
        spider_spec['templates'] = templates
        return spider_spec

    def spider_json(self, name):
        """Loads the spider spec for the given spider name."""
        return self.resource('spiders', name)

    def template_json(self, spider_name, template_name):
        """Loads the given template.

        Also converts the annotated body of the template to be used by
        the annotation UI."""
        template = self.resource('spiders', spider_name, template_name)
        convert_template(template)
        return template

    def rename_spider(self, from_name, to_name):
        if to_name == from_name:
            return
        # TODO: Make optional
        if not re.match('^[a-zA-Z0-9][a-zA-Z0-9_\.-]*$', to_name):
            raise BadRequest('Bad Request', 'Invalid spider name')
        if to_name in self.list_spiders():
            raise IOError('Can\'t rename spider as a spider with the name, '
                          '"%s", already exists for this project.' % to_name)
        self.storage.move(self._rfilename('spiders', from_name),
                          self._rfilename('spiders', to_name))

        dirname = self._rdirname('spiders', from_name)
        if self.storage.isdir(dirname):
            self.storage.move(dirname, self._rdirname('spiders', to_name))

    def remove_spider(self, name):
        filename = self._rfilename('spiders', name)
        assert filename.endswith('.json')
        dirname = filename[:-len('.json')]

        self.storage.delete(filename)
        try:
            self.storage.rmtree(dirname)
        except IOError:
            pass

    def rename_template(self, spider_name, from_name, to_name):
        template = self.resource('spiders', spider_name, from_name)
        template['name'] = to_name
        self.savejson(template, ['spiders', spider_name, to_name])
        self.remove_template(spider_name, from_name)
        spider = self.spider_json(spider_name)
        spider['template_names'].append(to_name)
        self.savejson(spider, ['spiders', spider_name])

    def remove_template(self, spider_name, name):
        try:
            self.storage.delete(self._rfilename('spiders', spider_name, name))
        except IOError:
            pass
        spider = self.spider_json(spider_name)
        try:
            spider['template_names'].remove(name)
        except ValueError:
            pass
        self.savejson(spider, ['spiders', spider_name])

    def _rfilename(self, *resources):
        return join(self.project_dir, *resources) + '.json'

    def _rdirname(self, *resources):
        return join(self.project_dir, *resources[:-1])

    def _process_extraction_urls(self, urls):
        if hasattr(urls, 'get'):
            urls = urls.get('urls', [])
        if isinstance(urls, dict):
            return urls.items()
        return urls

    def _process_extraction_response(self, url, html):
        return [(url, HtmlResponse(url, body=html))]

    def extract_data(self, spider_name, url_info, request):
        pass

    def resource(self, *resources):
        return json.load(self.storage.open(self._rfilename(*resources)))

    def savejson(self, obj, resources):
        # convert to json in a way that will make sense in diffs
        fname = self._rfilename(*resources)
        self.storage.save(fname, ContentFile(
            json.dumps(obj, sort_keys=True, indent=4), fname))

    def schedule(self, spider, args):
        if spider not in set(self.list_spiders()):
            raise BadRequest('"%s" does not exist in this project' % spider)
        schedule_data = self._schedule_data(spider, args)
        req = requests.post(self.SCHEDULE_URL, data=schedule_data)
        if req.status_code != 200:
            raise BaseHTTPError(req.status_code, req.content)
        return req.json()

    def _schedule_data(self, spider, args):
        return {
            'project': self.project_name,
            'spider': spider
        }

    def commit_changes(self):
        if getattr(self, 'storage', None):
            self.storage.commit()

    def __repr__(self):
        return '%s(%s)' % (self.__class__.__name__, str(self))

    def __str__(self):
        return '%s, %s' % (self.project_name, self.user)


class FileSystemProjectSpec(ProjectSpec):
    storage_class = FsStorage

    def __init__(self, project_name, auth_info):
        super(FileSystemProjectSpec, self).__init__(project_name, auth_info)
        self.storage = self.storage_class(project_name,
                                          author=getpass.getuser())
