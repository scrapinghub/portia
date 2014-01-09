"""
Crawler Spec

Manages definitions of the crawler specifications

This will save, validate, potentially cache, etc. Right now it just
loads data from the filesystem.
"""
import json, re, shutil, errno, os
from os.path import join, splitext
from twisted.web.resource import NoResource, ForbiddenResource
from jsonschema.exceptions import ValidationError
from slybot.utils import open_project_from_dir
from slybot.validation.schema import get_schema_validator
from .resource import SlydJsonResource


def create_crawler_spec_resource(spec_manager):
    return SpecResource(spec_manager)

# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_SPIDER_RE = re.compile('[^A-Za-z0-9._]|^\.*$')


def allowed_spider_name(name):
    return not _INVALID_SPIDER_RE.search(name)

class CrawlerSpecManager(object):

    def __init__(self, settings):
        self.settings = settings
        self.basedir = self.settings['SPEC_DATA_DIR']

    def project_spec(self, project):
        return ProjectSpec(join(self.basedir, str(project)))


class ProjectSpec(object):

    resources = ('project', 'items', 'extractors')

    def __init__(self, projectdir):
        self.projectdir = projectdir

    def load_slybot_spec(self, project):
        """load the spec for a given project"""
        return open_project_from_dir(self.projectdir)

    def list_spiders(self):
        try:
            for fname in os.listdir(join(self.projectdir, "spiders")):
                if fname.endswith(".json"):
                    yield splitext(fname)[0]
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def rename_spider(self, from_name, to_name):
        os.rename(self._rfilename('spiders', from_name),
            self._rfilename('spiders', to_name))

    def remove_spider(self, name):
        os.remove(self._rfilename('spiders', name))

    def _rfilename(self, *resources):
        return join(self.projectdir, *resources) + '.json'

    def _rfile(self, resources, mode='rb'):
        return open(self._rfilename(*resources), mode)

    def resource(self, *resources):
        return json.load(self._rfile(resources))

    def writejson(self, outf, *resources):
        """Write json for the resource specified

        Multiple arguments are joined (e.g. spider, spidername).

        If the file does not exist, an empty dict is written
        """
        try:
            shutil.copyfileobj(self._rfile(resources), outf)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                outf.write('{}')
            else:
                raise

    def savejson(self, obj, *resources):
        # convert to json in a way that will make sense in diffs
        ouf = self._rfile(*resources, mode='wb')
        json.dump(obj, ouf, sort_keys=True, indent=4)

    def json(self, out):
        """Write spec as json to the file-like object

        This uses the file contents and avoids converting to python types
        """
        # assumes " is not allowed in spider names
        template_dict = {r: 'SPEC:%s' % r for r in self.resources}
        template_dict['spiders'] = {s: 'SPIDER:%s' % s for s in self.list_spiders()}
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


class SpecResource(SlydJsonResource):
    isLeaf = True

    spider_commands = {
        'mv': ProjectSpec.rename_spider,
        'rm': ProjectSpec.remove_spider
    }

    def __init__(self, spec_manager):
        SlydJsonResource.__init__(self)
        self.spec_manager = spec_manager

    def render(self, request):
        # make sure the path is safe
        for pathelement in request.postpath:
            if pathelement and not allowed_spider_name(pathelement):
                resource_class = NoResource if request.method == 'GET' \
                    else ForbiddenResource
                resource = resource_class("Bad path element %r" % pathelement)
                return resource.render(request)
        return SlydJsonResource.render(self, request)

    def render_GET(self, request):
        project_spec = self.spec_manager.project_spec(request.project)
        rpath = request.postpath
        if not rpath:
            project_spec.json(request)
        elif len(rpath) == 1 and rpath[0] == 'spiders':
            spiders = project_spec.list_spiders()
            request.write(json.dumps(list(spiders)))
        else:
            project_spec.writejson(request, *rpath)
        return '\n'

    def render_POST(self, request):
        obj = self.read_json(request)
        project_spec = self.spec_manager.project_spec(request.project)
        try:
            # validate the request path and data
            resource = request.postpath[0]
            if resource == 'spiders':
                if len(request.postpath) == 1 or not request.postpath[1]:
                    return self.handle_spider_command(project_spec, obj)
                resource = 'spider'
            get_schema_validator(resource).validate(obj)
        except (KeyError, IndexError) as _ex:
            self.error(404, "Not Found", "No such resource")
        except ValidationError as ex:
            self.bad_request("Json failed validation: %s" % ex.message)
        project_spec.savejson(obj, request.postpath)
        return ''

    def handle_spider_command(self, project_spec, command_spec):
        command = command_spec.get('cmd')
        dispatch_func = self.spider_commands.get(command)
        if dispatch_func is None:
            self.bad_request(
                "unrecognised cmd arg %s, available commands: %s" %
                (command, ', '.join(self.spider_commands.keys())))
        args = command_spec.get('args', [])
        for spider in args:
            if not allowed_spider_name(spider):
                self.bad_request('invlalid spider name %s' % spider)
        try:
            retval = dispatch_func(project_spec, *args)
        except TypeError:
            self.bad_request("incorrect args for %s" % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                self.error(404, "Not Found", "No such resource")
            raise
        return retval or ''
