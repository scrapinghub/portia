"""
Crawler Spec

Manages definitions of the crawler specifications

This will save, validate, potentially cache, etc. Right now it just
loads data from the filesystem.
"""
import json, re, shutil, errno
from os import listdir
from os.path import join, exists, splitext
from twisted.web import http
from twisted.web.error import Error
from twisted.web.resource import NoResource, ForbiddenResource
from slybot.utils import open_project_from_dir
from slybot.validation.schema import get_schema_validator
from .resource import SlydJsonResource


def create_crawler_spec_resource(settings, spec_manager):
    return SpecResource(spec_manager)

# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_SPIDER_RE = re.compile('[^A-Za-z0-9._]|^\.*$')

def allowed_spider_name(name):
    return not _INVALID_SPIDER_RE.search(name)

class SpecResource(SlydJsonResource):
    isLeaf = True

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
        else:
            project_spec.writejson(request, *rpath)
        return '\n'

    def render_POST(self, request):
        # get_schema_validator(name)
        pass


class CrawlerSpecManager(object):

    def __init__(self, basedir):
        self.basedir = basedir

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
            for fname in listdir(join(self.projectdir, "spiders")):
                if fname.endswith(".json"):
                    yield splitext(fname)[0]
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def writejson(self, outf, *resource):
        """Write json for the resource specified

        Multiple arguments are joined (e.g. spider, spidername).

        If the file does not exist, an empty dict is written
        """
        filename = join(self.projectdir, *resource) + '.json'
        try:
            shutil.copyfileobj(open(filename), outf)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                outf.write('{}')
            else:
                raise

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

