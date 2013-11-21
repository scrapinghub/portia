"""
Crawler Spec

Manages definitions of the crawler specifications

This will save, validate, potentially cache, etc. Right now it just
loads data from the filesystem.
"""
import json, re, shutil, errno
from os import listdir
from os.path import join, exists, splitext
from twisted.web import error
from twisted.web.resource import Resource, NoResource
from slybot.utils import open_project_from_dir
from slybot.validation.schema import get_schema_validator


def create_crawler_spec_resource(settings, spec_manager):
    project = ProjectSpecResource(spec_manager)
    for resource in ProjectSpec.resources:
        spec_resource = SpecResource(resource, spec_manager)
        project.putChild(resource, spec_resource)
    spider_resource = SpiderSpecResource(spec_manager)
    project.putChild('spiders', spider_resource)
    return project


class SpecResourceBase(Resource):
    def __init__(self, spec_manager):
        Resource.__init__(self)
        self.spec_manager = spec_manager

    def get_spec(self, request):
        """overridden to get the spec for the current object"""
        pass

    def render(self, response):
        try:
            return Resource.render(self, response)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return NoResource().render(response)
            else:
                raise

    def render_GET(self, request):
        request.setHeader('Content-Type', 'application/json')
        self.get_spec(request).json(request)
        return '\n'

class ProjectSpecResource(SpecResourceBase):

    def get_spec(self, request):
        return self.spec_manager.project_spec(request.project)


class SpecResource(SpecResourceBase):

    def __init__(self, name, spec_manager):
        SpecResourceBase.__init__(self, spec_manager)
        self.name = name
        self.schema_validator = get_schema_validator(name)

    def get_spec(self, request):
        project_spec = self.spec_manager.project_spec(request.project)
        return project_spec.resource_spec(self.name)


class SpiderSpecResource(SpecResourceBase):
    isLeaf = True

    def get_spec(self, request):
        spider = request.postpath[0] if request.postpath else ''
        project_spec = self.spec_manager.project_spec(request.project)
        return project_spec.spider_spec(spider)


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

    def resource_spec(self, resource):
        return Spec.from_name(self.projectdir, resource)

    def list_spiders(self):
        for fname in listdir(join(self.projectdir, "spiders")):
            if fname.endswith(".json"):
                yield splitext(fname)[0]

    def spider_spec(self, spidername):
        specfile = join(self.projectdir, "spiders", spidername + '.json')
        return Spec(specfile)

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
            specf = self.resource_spec if mtype == 'SPEC' else self.spider_spec
            specf(resource).json(out)
            last = match.end()
        out.write(json_template[last:])


class Spec(object):

    def __init__(self, jsonfile):
        self.jsonfile = jsonfile

    def save(self, newobj):
        # validate first, then save
        pass

    def load(self):
        return json.load(open(self.jsonfile))

    def json(self, out):
        shutil.copyfileobj(open(self.jsonfile), out)

    @classmethod
    def from_name(cls, dirpath, name):
        fname = join(dirpath, name) + '.json'
        return Spec(fname)
