from six.moves.urllib_parse import urlparse
import os
import json
import re

from os.path import isdir, join
from collections import OrderedDict
from itertools import chain

from scrapely.htmlpage import HtmlPage, HtmlTag, HtmlTagType
from scrapy.utils.misc import load_object


TAGID = u"data-tagid"
GENERATEDTAGID = u"data-genid"
OPEN_TAG = HtmlTagType.OPEN_TAG
CLOSE_TAG = HtmlTagType.CLOSE_TAG
UNPAIRED_TAG = HtmlTagType.UNPAIRED_TAG


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
    specs = {"spiders": SpiderLoader(project_dir)}
    try:
        with open(join(project_dir, "project.json")) as f:
            specs["project"] = json.load(f)
    except IOError:
        specs["project"] = {}
    with open(join(project_dir, "items.json")) as f:
        specs["items"] = json.load(f)
    with open(join(project_dir, "extractors.json")) as f:
        specs["extractors"] = json.load(f)
    return specs


def load_external_templates(spec_base, spider_name):
    """A generator yielding the content of all passed `template_names` for
    `spider_name`.
    """
    spider_dir = join(spec_base, spider_name)
    if not isdir(spider_dir):
        raise StopIteration
    for name in os.listdir(spider_dir):
        if not name.endswith('.json'):
            continue
        path = join(spider_dir, name)
        with open(path) as f:
            sample = json.load(f)
            sample_dir = path[:-len('.json')]
            if isdir(sample_dir):
                for fname in os.listdir(sample_dir):
                    if fname.endswith('.html'):
                        with open(join(sample_dir, fname)) as f:
                            attr = fname[:-len('.html')]
                            sample[attr] = read(f)
                version = sample.get('version', '')
                yield _build_sample(sample, legacy=version < '0.13.0')


def read(fp, encoding='utf-8'):
    content = fp.read()
    if hasattr(content, 'decode'):
        content = content.decode('utf-8')
    return content


def _build_sample(sample, legacy=False):
    from slybot.plugins.scrapely_annotations.builder import Annotations
    data = sample.get('plugins', {}).get('annotations-plugin')
    if data:
        Annotations().save_extraction_data(data, sample, legacy=legacy)
    sample['page_id'] = sample.get('page_id') or sample.get('id') or ""
    sample['annotated'] = True
    return sample


def htmlpage_from_response(response, _add_tagids=False):
    body = response.body_as_unicode()
    if _add_tagids:
        body = add_tagids(body)
    return HtmlPage(response.url, response.headers, body,
                    encoding=response.encoding)


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


def include_exclude_filter(include_patterns, exclude_patterns):
    filterf = None
    includef = None
    if include_patterns:
        pattern = include_patterns[0] if len(include_patterns) == 1 else \
            "(?:%s)" % '|'.join(include_patterns)
        includef = re.compile(pattern).search
        filterf = includef
    if exclude_patterns:
        pattern = exclude_patterns[0] if len(exclude_patterns) == 1 else \
            "(?:%s)" % '|'.join(exclude_patterns)
        excludef = re.compile(pattern).search
        if not includef:
            filterf = lambda x: not excludef(x)
        else:
            filterf = lambda x: includef(x) and not excludef(x)
    return filterf if filterf else bool


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


def _quotify(mystr):
    """
    quotifies an html tag attribute value.
    Assumes then, that any ocurrence of ' or " in the
    string is escaped if original string was quoted
    with it.
    So this function does not altere the original string
    except for quotation at both ends, and is limited just
    to guess if string must be quoted with '"' or "'"
    """
    quote = '"'
    l = len(mystr)
    for i in range(l):
        if mystr[i] == "\\" and i + 1 < l and mystr[i + 1] == "'":
            quote = "'"
            break
        elif mystr[i] == "\\" and i + 1 < l and mystr[i + 1] == '"':
            quote = '"'
            break
        elif mystr[i] == "'":
            quote = '"'
            break
        elif mystr[i] == '"':
            quote = "'"
            break
    return quote + mystr + quote


def serialize_tag(tag):
    """
    Converts a tag into a string when a slice [tag.start:tag.end]
    over the source can't be used because tag has been modified
    """
    out = "<"
    if tag.tag_type == HtmlTagType.CLOSE_TAG:
        out += "/"
    out += tag.tag

    attributes = []
    for key, val in tag.attributes.items():
        aout = key
        if val is not None:
            aout += "=" + _quotify(val)
        attributes.append(aout)
    if attributes:
        out += " " + " ".join(attributes)

    if tag.tag_type == HtmlTagType.UNPAIRED_TAG:
        out += "/"
    return out + ">"


def _must_add_tagid(element):
    return (isinstance(element, HtmlTag) and
            element.tag_type != CLOSE_TAG and
            element.tag != 'ins')


def _modify_tagids(source, add=True):
    """Add or remove tags ids to/from HTML document"""
    output = []
    tagcount = 0
    if not isinstance(source, HtmlPage):
        source = HtmlPage(body=source)
    for element in source.parsed_body:
        if _must_add_tagid(element):
            if add:
                element.attributes[TAGID] = str(tagcount)
                tagcount += 1
            else:  # Remove previously added tagid
                element.attributes.pop(TAGID, None)
            output.append(serialize_tag(element))
        else:
            output.append(source.body[element.start:element.end])
    return u''.join(output)


def add_tagids(source):
    """
    Applies a unique attribute code number for each tag element in order to be
    identified later in the process of apply annotation"""
    return _modify_tagids(source)


def remove_tagids(source):
    """remove from the given page, all tagids previously added by add_tagids()
    """
    return _modify_tagids(source, False)


class SpiderLoader(object):
    def __init__(self, base):
        self.spider_dir = join(base, "spiders")
        self.spider_names = {
            s[:-len('.json')] for s in os.listdir(self.spider_dir)
            if s.endswith('.json')
        }
        self._spiders = {}

    def __getitem__(self, key):
        if key not in self.spider_names:
            raise KeyError('The spider "{}" does not exist'.format(key))
        if key not in self._spiders:
            self._spiders[key] = self.load_spider(key)
        return self._spiders[key]

    def load_spider(self, spider_name):
        with open(join(self.spider_dir, '%s.json' % spider_name)) as f:
            try:
                spec = json.load(f)
                if spec.get('templates'):
                    templates = []
                    for template in spec.get('templates', []):
                        if template.get('version', '') < '0.13.0':
                            templates.append(template)
                        else:
                            templates.append(_build_sample(template))
                    spec['templates'] = templates
                else:
                    templates = load_external_templates(self.spider_dir,
                                                        spider_name)
                    spec.setdefault("templates", []).extend(templates)
                return spec
            except ValueError as e:
                raise ValueError(
                    "Error parsing spider (invalid JSON): %s: %s" %
                    (spider_name, e)
                )

    def keys(self):
        for spider_name in self.spider_names:
            yield spider_name

    def items(self):
        spiders = chain(self._spiders, self.spider_names - set(self._spiders))
        for spider_name in spiders:
            yield spider_name, self[spider_name]

    def values(self):
        for _, spider in self.items():
            yield spider
