from six.moves.urllib_parse import urlparse
import os
import json

from collections import OrderedDict

from scrapy.utils.misc import load_object

from scrapely.htmlpage import HtmlPage


def iter_unique_scheme_hostname(urls):
    """Return an iterator of tuples (scheme, hostname) over the given urls,
    filtering dupes
    """
    scheme_hostname = set()
    for x in urls:
        p = urlparse(x)
        scheme_hostname.add((p.scheme, p.hostname))
    return list(scheme_hostname)


def open_project_from_dir(project_dir):
    specs = {"spiders": {}}
    with open(os.path.join(project_dir, "project.json")) as f:
        specs["project"] = json.load(f)
    with open(os.path.join(project_dir, "items.json")) as f:
        specs["items"] = json.load(f)
    with open(os.path.join(project_dir, "extractors.json")) as f:
        specs["extractors"] = json.load(f)

    spec_base = os.path.join(project_dir, "spiders")
    for fname in os.listdir(spec_base):
        if fname.endswith(".json"):
            spider_name = os.path.splitext(fname)[0]
            with open(os.path.join(spec_base, fname)) as f:
                try:
                    spec = json.load(f)
                    template_names = spec.get("template_names")
                    if template_names:
                        templates = load_external_templates(spec_base,
                                                            spider_name,
                                                            template_names)
                        spec.setdefault("templates", []).extend(templates)
                    specs["spiders"][spider_name] = spec
                except ValueError as e:
                    raise ValueError(
                        "Error parsing spider (invalid JSON): %s: %s" %
                        (fname, e)
                    )
    return specs


def load_external_templates(spec_base, spider_name, template_names):
    """A generator yielding the content of all passed `template_names` for
    `spider_name`.
    """
    for name in template_names:
        with open(os.path.join(spec_base, spider_name, name + ".json")) as f:
            yield json.load(f)


def htmlpage_from_response(response):
    return HtmlPage(response.url, response.headers,
                    response.body_as_unicode(), encoding=response.encoding)


def load_plugins(settings):
    if settings.get('LOADED_PLUGINS', None):
        return settings.get('LOADED_PLUGINS', None)
    plugins = settings['PLUGINS']
    if plugins:
        return [load_object(p) if isinstance(p, str) else p for p in plugins]
    else:
        from slybot.plugins.scrapely_annotations import Annotations
        return [Annotations]


def load_plugin_names(settings):
    """
    Generate a unique name for a plugin based on the class name module name
    and path

    >>> settings = {'PLUGINS': ['a', 'b.c', 'a.c']}
    >>> load_plugin_names(settings)
    ['a', 'c', 'a.c']
    """
    seen = set()

    def generate_name(path, maxsplit=0, splits=None):
        if splits is None:
            splits = len(path.split('.')) - 1
        name = '.'.join(path.split('.', splits - maxsplit)[-1].rsplit('.',
                        maxsplit))
        if name not in seen or maxsplit >= splits:
            seen.add(name)
            return name
        return generate_name(path, maxsplit + 1, splits)

    if settings['PLUGINS']:
        return [generate_name(path) for path in settings['PLUGINS']]
    else:
        return ['Annotations']


class IndexedDict(OrderedDict):
    """
    Ordered dictionary where values can also be obtained by their index as if
    they were in a list

    >>> idd = IndexedDict([('spam', 1), ('eggs', 2), ('bacon', 3)])
    >>> idd['spam']
    1
    >>> idd[0]
    1
    >>> idd['bacon']
    3
    >>> idd[2]
    3
    >>> idd[2] = 'ham'
    Traceback (most recent call last):
        ...
    TypeError: keys must not be an integers
    >>> idd[3]
    Traceback (most recent call last):
        ...
    IndexError: index out of range
    """
    def __setitem__(self, key, value):
        if isinstance(key, int):
            raise TypeError("keys must not be an integers")
        super(IndexedDict, self).__setitem__(key, value)

    def __getitem__(self, key):
        if isinstance(key, int):
            if key >= len(self):
                raise IndexError('index out of range')
            for i, k in enumerate(self):
                if i == key:
                    key = k
                    break
        return super(IndexedDict, self).__getitem__(key)
