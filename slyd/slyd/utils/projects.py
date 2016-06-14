import errno
import re

from collections import OrderedDict as ODict

from slybot.starturls import StartUrlCollection
from slybot.validation.schema import get_schema_validator

from slyd.utils import short_guid
# stick to alphanum . and _. Do not allow only .'s (so safe for FS path)
_INVALID_FILE_RE = re.compile('[^A-Za-z0-9._\-~]|^\.*$')


def ctx(manager, **kwargs):
    kwargs.update({'project_id': manager.project_name})
    return kwargs


def allowed_file_name(name):
    return not _INVALID_FILE_RE.search(name)


def gen_id(disallow=None):
    if disallow is not None:
        disallow = set(disallow)
    else:
        disallow = []
    _id = short_guid()
    while _id in disallow:
        _id = short_guid()
    return _id


def unique_name(base_name, disallow=(), initial_suffix=''):
    disallow = set(disallow)
    suffix = initial_suffix
    while True:
        name = u'{}{}'.format(base_name, suffix)
        if name not in disallow:
            break
        try:
            suffix += 1
        except TypeError:
            suffix = 1
    return name


def init_project(manager):
    if hasattr(manager.pm, 'edit_project'):
        manager.pm.edit_project(manager.project_name, 'master')
    if hasattr(manager, 'add_tag') and hasattr(manager.pm, '_has_tag'):
        if not manager.pm._has_tag(manager.project_name, 'portia_2.0'):
            manager.add_tag('portia_2.0')


def clean_spider(obj):
    """Removes incomplete data from the spider"""
    if 'init_requests' in obj:
        if obj['init_requests'] is None:
            obj['init_requests'] = []
        required_fields = ('type', 'loginurl', 'username', 'password')
        obj['init_requests'] = [req for req in obj['init_requests']
                                if all(f in req for f in required_fields)]
    if 'start_urls' in obj:
        obj['start_urls'] = StartUrlCollection(obj['start_urls']).uniq()
    # XXX: Need id to keep track of renames for deploy and export
    if 'id' not in obj:
        obj['id'] = obj.get('name') or short_guid()


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


class ProjectModifier:
    def verify_data(self, path=None, obj=None, project_spec=None):
        if not path or obj is None or project_spec is None:
            raise self.errors.BadRequest('No path received')
        resource = path[0]
        if path[0] == 'spiders':
            resource = 'spider'
            if len(path) == 1 or not path[1]:
                return self.handle_spider_command(project_spec, obj)
            elif len(path) == 2:
                clean_spider(obj)
            elif len(path) == 3:
                resource = 'template'
                if obj.get('original_body') is None:
                    templ = project_spec.template_json(path[1], path[2])
                    obj['original_body'] = templ.get('original_body', '')
                obj = add_plugin_data(obj, project_spec.plugins)
        get_schema_validator(resource).validate(obj)
        return obj

    def handle_spider_command(self, project_spec, command_spec):
        command = command_spec.get('cmd')
        dispatch_func = project_spec.spider_commands.get(command)
        if dispatch_func is None:
            raise self.errors.BadRequest(
                "unrecognised cmd arg %s, available commands: %s" %
                (command, ', '.join(project_spec.spider_commands.keys())))
        args = map(str, command_spec.get('args', []))
        for name in args:
            if not allowed_file_name(name):
                raise self.errors.BadRequest('invalid name %s' % name)
        try:
            retval = dispatch_func(*args)
        except TypeError:
            raise self.errors.BadRequest("incorrect args for %s" % command)
        except OSError as ex:
            if ex.errno == errno.ENOENT:
                raise self.errors.NotFound("No such resource")
            raise
        else:
            return retval or ''
        return ''
