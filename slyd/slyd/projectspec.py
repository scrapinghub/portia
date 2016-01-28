from __future__ import absolute_import
import json, re, shutil, errno, os

import slyd.errors

from os.path import join, splitext
from scrapy.http import HtmlResponse
from twisted.web.resource import NoResource, ForbiddenResource
from twisted.web.server import NOT_DONE_YET
from jsonschema.exceptions import ValidationError
from .resource import SlydJsonObjectResource
from .html import html4annotation
from .errors import BaseHTTPError
from .utils.projects import allowed_file_name, ProjectModifier
from .utils.extraction import extract_items


def create_project_resource(spec_manager):
    return ProjectResource(spec_manager)


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

    def __init__(self, project_name, auth_info):
        self.project_dir = join(ProjectSpec.base_dir, project_name)
        self.project_name = project_name
        self.auth_info = auth_info
        self.user = auth_info['username']
        self.spider_commands = {
            'mv': self.rename_spider,
            'rm': self.remove_spider,
            'mvt': self.rename_template,
            'rmt': self.remove_template,
        }

    def list_spiders(self):
        for fname in os.listdir(join(self.project_dir, "spiders")):
            if fname.endswith(".json"):
                yield splitext(fname)[0]

    def spider_with_templates(self, spider):
        spider_spec = self.resource('spiders', spider)
        templates = []
        for template in spider_spec.get('template_names', []):
            try:
                templates.append(self.resource('spiders', spider, template))
            except TypeError:
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
        if to_name in self.list_spiders():
            raise IOError('Can\'t rename spider as a spider with the name, '
                          '"%s", already exists for this project.' % to_name)
        os.rename(self._rfilename('spiders', from_name),
                  self._rfilename('spiders', to_name))

        dirname = self._rdirname('spiders', from_name)
        if os.path.isdir(dirname):
            os.rename(dirname, self._rdirname('spiders', to_name))

    def remove_spider(self, name):
        os.remove(self._rfilename('spiders', name))

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
            os.remove(self._rfilename('spiders', spider_name, name))
        except OSError:
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
        return join(self.project_dir, *resources[0][:-1])

    def _rfile(self, resources, mode='rb'):
        return open(self._rfilename(*resources), mode)

    def _process_extraction_urls(self, urls):
        if hasattr(urls, 'get'):
            urls = urls.get('urls', [])
        if isinstance(urls, dict):
            return urls.items()
        return urls

    def _process_extraction_response(self, url, html):
        return [(url, HtmlResponse(url, body=html))]

    def extract_data(self, spider_name, url_info, request):
        urls = self._process_extraction_urls(url_info)
        extract_items(self, spider_name, urls, request)

    def resource(self, *resources):
        print "for resource", resources, 'filename', self._rfilename(*resources)
        with self._rfile(resources) as f:
            print f.read()
        with self._rfile(resources) as f:
            return json.load(f)

    def writejson(self, outf, *resources):
        """Write json for the resource specified

        Multiple arguments are joined (e.g. spider, spidername).

        If the file does not exist, an empty dict is written
        """
        shutil.copyfileobj(self._rfile(resources), outf)

    def savejson(self, obj, *resources):
        # convert to json in a way that will make sense in diffs
        try:
            os.makedirs(self._rdirname(*resources))
        except OSError:
            pass
        with self._rfile(*resources, mode='wb') as ouf:
            json.dump(obj, ouf, sort_keys=True, indent=4)

    def json(self, out):
        """Write spec as json to the file-like object

        This uses the file contents and avoids converting to python types
        """
        # assumes " is not allowed in spider names
        template_dict = {r: 'SPEC:%s' % r for r in self.resources}
        template_dict['spiders'] = {s: 'SPIDER:%s' % s
                                    for s in self.list_spiders()}
        json_template = json.dumps(template_dict)
        last = 0
        for match in re.finditer('"(SPEC|SPIDER):([^"]+)"', json_template):
            out.write(json_template[last:match.start()])
            mtype, resource = match.groups()
            if mtype == 'SPEC':
                self.writejson(out, resource)
            else:
                self.writejson(out, 'spiders', resource)
            last = match.end()
        out.write(json_template[last:])


class ProjectResource(SlydJsonObjectResource, ProjectModifier):
    isLeaf = True
    errors = slyd.errors

    def __init__(self, spec_manager):
        SlydJsonObjectResource.__init__(self)
        self.spec_manager = spec_manager

    def render(self, request):
        # make sure the path is safe
        for pathelement in request.postpath:
            if pathelement and not allowed_file_name(pathelement):
                resource_class = NoResource if request.method == 'GET' \
                    else ForbiddenResource
                resource = resource_class("Bad path element %r." % pathelement)
                return resource.render(request)
        return SlydJsonObjectResource.render(self, request)

    def render_GET(self, request):
        project_spec = self.spec_manager.project_spec(
            request.project, request.auth_info)
        rpath = request.postpath
        if not rpath:
            project_spec.json(request)
        elif len(rpath) == 1 and rpath[0] == 'spiders':
            spiders = project_spec.list_spiders()
            return {"spiders": list(spiders)}
        else:
            try:
                if rpath[0] == 'spiders' and len(rpath) == 2:
                    spider = project_spec.spider_json(rpath[1])
                    return {'spider': spider}
                elif rpath[0] == 'spiders' and len(rpath) == 3:
                    template = project_spec.template_json(rpath[1], rpath[2])
                    template['original_body'] = ''
                    return {'sample': template}
                elif len(rpath) == 1 and rpath[0] in project_spec.resources:
                    return {rpath[0]: project_spec.resource(*rpath)}
            # Trying to access non existent path
            except (KeyError, IndexError, TypeError):
                self.not_found()
        self.not_found()

    def render_POST(self, request, merge=False):
        obj = self.read_json(request)
        project_spec = self.spec_manager.project_spec(
            request.project, request.auth_info)
        resource = None
        rpath = request.postpath
        if rpath and rpath[0] == 'extract':
            project_spec.extract_data(rpath[1], obj, request)
            return NOT_DONE_YET
        try:
            # validate the request path and data
            obj = self.verify_data(request.postpath, obj, project_spec)
        except (KeyError, IndexError):
            self.not_found()
        except (AssertionError, ValidationError) as ex:
            self.bad_request(
                "The %s data was not valid. Validation failed with the error: %s."
                % (resource or 'input', ex.message))
        except BaseHTTPError as ex:
            self.error(ex.status, ex.title, ex.body)
        else:
            project_spec.savejson(obj, request.postpath)
            return ''
