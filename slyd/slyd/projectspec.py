import json, re, shutil, errno, os
from os.path import join, splitext
from twisted.web.resource import NoResource, ForbiddenResource
from jsonschema.exceptions import ValidationError
from slybot.validation.schema import get_schema_validator
from .resource import SlydJsonResource
from .html import html4annotation
from .errors import BaseHTTPError
from .utils import short_guid


def create_project_resource(spec_manager):
    return ProjectResource(spec_manager)

# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_FILE_RE = re.compile('[^A-Za-z0-9._\-~]|^\.*$')


def allowed_file_name(name):
    return not _INVALID_FILE_RE.search(name)


def convert_template(template):
    """Converts the template annotated body for being used in the UI."""
    template['annotated_body'] = html4annotation(
        template['annotated_body'], template['url'])


def clean_spider(obj):
    """Removes incomplete data from the spider"""
    if 'init_requests' in obj:
        required_fields = ('type', 'login_url', 'login_user', 'login_password')
        obj['init_requests'] = [req for req in obj['init_requests']
                                if all(f in req for f in required_fields)]
    if 'start_urls' in obj:
        obj['start_urls'] = list(set(obj['start_urls']))
    # XXX: Need id to keep track of renames for deploy and export
    if 'id' not in obj:
        obj['id'] = short_guid()


def add_plugin_data(obj, plugins):
    try:
        plugin_data = obj['plugins']
    except KeyError:
        plugin_data = {}
        obj['plugins'] = plugin_data
    for plugin, opts in plugins:
        plugin_name = opts['name']
        try:
            data = plugin_data[plugin_name]
        except KeyError:
            data = {}
            plugin_data[plugin_name] = {}
        result = plugin().save_extraction_data(data, obj, opts)
        obj['plugins'][plugin_name] = result
    return obj


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
        try:
            for fname in os.listdir(join(self.project_dir, "spiders")):
                if fname.endswith(".json"):
                    yield splitext(fname)[0]
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise

    def spider_json(self, name):
        """Loads the spider spec for the given spider name."""
        try:
            return self.resource('spiders', name)
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return({})
            else:
                raise

    def template_json(self, spider_name, template_name):
        """Loads the given template.

        Also converts the annotated body of the template to be used by
        the annotation UI."""
        try:
            template = self.resource('spiders', spider_name, template_name)
            convert_template(template)
            return template
        except IOError as ex:
            if ex.errno == errno.ENOENT:
                return({})
            else:
                raise

    def rename_spider(self, from_name, to_name):
        if to_name == from_name:
            return
        if to_name in self.list_spiders():
            raise IOError('Can\'t rename spider as a spider with the name, '
                          '"%s", already exists for this project.' % to_name)
        os.rename(self._rfilename('spiders', from_name),
                  self._rfilename('spiders', to_name))
        os.rename(join('spiders', from_name),
                  join('spiders', to_name))

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
        try:
            os.makedirs(self._rdirname(*resources))
        except OSError:
            pass
        ouf = self._rfile(*resources, mode='wb')
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


class ProjectResource(SlydJsonResource):
    isLeaf = True

    def __init__(self, spec_manager):
        SlydJsonResource.__init__(self)
        self.spec_manager = spec_manager

    def render(self, request):
        # make sure the path is safe
        for pathelement in request.postpath:
            if pathelement and not allowed_file_name(pathelement):
                resource_class = NoResource if request.method == 'GET' \
                    else ForbiddenResource
                resource = resource_class("Bad path element %r" % pathelement)
                return resource.render(request)
        return SlydJsonResource.render(self, request)

    def render_GET(self, request):
        project_spec = self.spec_manager.project_spec(
            request.project, request.auth_info)
        rpath = request.postpath
        if not rpath:
            project_spec.json(request)
        elif len(rpath) == 1 and rpath[0] == 'spiders':
            spiders = project_spec.list_spiders()
            request.write(json.dumps(list(spiders)))
        else:
            try:
                if rpath[0] == 'spiders' and len(rpath) == 2:
                    spider = project_spec.spider_json(rpath[1])
                    request.write(json.dumps(spider))
                elif rpath[0] == 'spiders' and len(rpath) == 3:
                    template = project_spec.template_json(rpath[1], rpath[2])
                    request.write(json.dumps(template))
                else:
                    project_spec.writejson(request, *rpath)
            # Trying to access non existent path
            except (KeyError, IndexError, TypeError):
                self.error(404, "Not Found", "No such resource")
        return '\n'

    def render_POST(self, request, merge=False):
        obj = self.read_json(request)
        project_spec = self.spec_manager.project_spec(
            request.project, request.auth_info)
        try:
            # validate the request path and data
            rpath = request.postpath
            resource = rpath[0]
            if resource == 'spiders':
                resource = 'spider'
                if len(rpath) == 1 or not rpath[1]:
                    return self.handle_spider_command(project_spec, obj)
                elif len(rpath) == 2:
                    clean_spider(obj)
                elif len(rpath) == 3:
                    resource = 'template'
                    if obj.get('original_body') is None:
                        templ = project_spec.template_json(rpath[1], rpath[2])
                        obj['original_body'] = templ.get('original_body', '')
                    obj = add_plugin_data(obj, project_spec.plugins)
            get_schema_validator(resource).validate(obj)
        except (KeyError, IndexError):
            self.error(404, "Not Found", "No such resource")
        except ValidationError as ex:
            self.bad_request("Json failed validation: %s" % ex.message)
        except BaseHTTPError as ex:
            self.error(ex.status, ex.title, ex.body)
        else:
            project_spec.savejson(obj, request.postpath)
            return ''

    def handle_spider_command(self, project_spec, command_spec):
        command = command_spec.get('cmd')
        dispatch_func = project_spec.spider_commands.get(command)
        if dispatch_func is None:
            self.bad_request(
                "unrecognised cmd arg %s, available commands: %s" %
                (command, ', '.join(project_spec.spider_commands.keys())))
        args = map(str, command_spec.get('args', []))
        for name in args:
            if not allowed_file_name(name):
                self.bad_request('invalid name %s' % name)
        try:
            retval = dispatch_func(*args)
        except TypeError:
            self.bad_request("incorrect args for %s" % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                self.error(404, "Not Found", "No such resource")
            raise
        return retval or ''
