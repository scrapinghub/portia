"""
Crawler Spec

Manages definitions of the crawler specifications

This will save, validate, potentially cache, etc. Right now it just
loads data from the filesystem.
"""
import json, re, shutil, errno, os
from os.path import join, splitext, split
from twisted.web.resource import NoResource, ForbiddenResource
from jsonschema.exceptions import ValidationError
from slybot.utils import open_project_from_dir
from slybot.validation.schema import get_schema_validator
from .resource import SlydJsonResource
from .annotations import apply_annotations
from .html import html4annotation
from .repoman import Repoman


def create_crawler_spec_resource(spec_manager):
    return SpecResource(spec_manager)

# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_SPIDER_RE = re.compile('[^A-Za-z0-9._\-~]|^\.*$')


def allowed_spider_name(name):
    return not _INVALID_SPIDER_RE.search(name)


def convert_spider_templates(spider):
    """Converts the spider templates annotated body for being used in the UI"""
    for template in spider['templates']:
            template['annotated_body'] = html4annotation(
                template['annotated_body'], template['url'])


def annotate_templates(spider):
    "Applies the annotations into the templates original body"
    if spider.get('templates', None):
        for template in spider['templates']:
            template['annotated_body'] = apply_annotations(
                template['annotated_body'], template['original_body'])


class CrawlerSpecManager(object):

    def __init__(self, settings, user='default', use_git_storage=False):
        self.settings = settings
        self.use_git = use_git_storage
        settings_key = self.use_git and 'GIT_SPEC_DATA_DIR' or 'SPEC_DATA_DIR'
        self.basedir = self.settings[settings_key]
        self.user = user

    def project_spec_class(self):
        return self.use_git and GitProjectSpec or ProjectSpec

    def project_spec(self, project, user=None):
        spec = GitProjectSpec(str(project)) if self.use_git else ProjectSpec(join(self.basedir, str(project)))
        spec.user = user or self.user
        return spec


class ProjectSpec(object):

    resources = ('project', 'items', 'extractors')

    def __init__(self, projectdir):
        self.projectdir = projectdir

    def list_spiders(self):
        try:
            for fname in os.listdir(join(self.projectdir, "spiders")):
                if fname.endswith(".json"):
                    yield splitext(fname)[0]
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def spider_json(self, name):
        """Loads the spider spec for the give spider name

        Also converts the annotated body of the templates to be used by
        the annotation UI"""
        try:
            spider = self.resource('spiders', name)
            convert_spider_templates(spider)
            return spider
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return({})
            else:
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


class GitProjectSpec(ProjectSpec):

    def __init__(self, project_name):
        self.projectdir = ''
        self.project_name = project_name
        self.user = None

    def _open_repo(self):
        return Repoman.open_repo(self.project_name)

    def list_spiders(self):
        files = self._open_repo().list_files_for_branch(self.user)
        return [splitext(split(f)[1])[0] for f in files
            if f.startswith("spiders/") and f.endswith(".json")]
            
    def rename_spider(self, from_name, to_name):
        self._open_repo().rename_file(self._rfilename('spiders', from_name),
            self._rfilename('spiders', to_name), self.user)

    def remove_spider(self, name):
        self._open_repo().delete_file(
            self._rfilename('spiders', name), self.user)

    def _rfile_contents(self, resources):
        return self._open_repo().file_contents_for_branch(
            self._rfilename(*resources), self.user)

    def resource(self, *resources):
        return json.loads(self._rfile_contents(resources))

    def writejson(self, outf, *resources):
        outf.write(self._rfile_contents(resources))

    def savejson(self, obj, resources):
        self._open_repo().save_file(self._rfilename(*resources),
            json.dumps(obj, sort_keys=True, indent=4), self.user)


class SpecResource(SlydJsonResource):
    isLeaf = True

    def __init__(self, spec_manager):
        SlydJsonResource.__init__(self)
        self.spec_manager = spec_manager
        self.spider_commands = {
            'mv': spec_manager.project_spec_class().rename_spider,
            'rm': spec_manager.project_spec_class().remove_spider
        }

    def render(self, request):
        if hasattr(request, 'keystone_token_info'):
            self.user = request.keystone_token_info['token']['user']['name']
        elif hasattr(request, 'auth_info'):
            self.user = request.auth_info['username']
        # make sure the path is safe
        for pathelement in request.postpath:
            if pathelement and not allowed_spider_name(pathelement):
                resource_class = NoResource if request.method == 'GET' \
                    else ForbiddenResource
                resource = resource_class("Bad path element %r" % pathelement)
                return resource.render(request)
        return SlydJsonResource.render(self, request)

    def render_GET(self, request):
        project_spec = self.spec_manager.project_spec(request.project,
            self.user)
        rpath = request.postpath
        if not rpath:
            project_spec.json(request)
        elif len(rpath) == 1 and rpath[0] == 'spiders':
            spiders = project_spec.list_spiders()
            request.write(json.dumps(list(spiders)))
        else:
            if rpath[0] == 'spiders' and len(rpath) == 2:
                spider = project_spec.spider_json(rpath[1])
                request.write(json.dumps(spider))
            else:
                project_spec.writejson(request, *rpath)
        return '\n'

    def render_POST(self, request):
        obj = self.read_json(request)
        project_spec = self.spec_manager.project_spec(request.project,
            self.user)
        try:
            # validate the request path and data
            resource = request.postpath[0]
            if resource == 'spiders':
                if len(request.postpath) == 1 or not request.postpath[1]:
                    return self.handle_spider_command(project_spec, obj)
                annotate_templates(obj)
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
        args = map(str, command_spec.get('args', []))
        for spider in args:
            if not allowed_spider_name(spider):
                self.bad_request('invalid spider name %s' % spider)
        try:
            retval = dispatch_func(project_spec, *args)
        except TypeError:
            self.bad_request("incorrect args for %s" % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                self.error(404, "Not Found", "No such resource")
            raise
        return retval or ''
