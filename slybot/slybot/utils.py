from six.moves.urllib_parse import urlparse
import chardet
import itertools
import json
import os
import re
import six

from collections import OrderedDict
from itertools import chain

from scrapely.htmlpage import HtmlPage, HtmlTagType
from scrapy.utils.misc import load_object
from w3lib.encoding import html_body_declared_encoding


TAGID = u"data-tagid"
GENERATEDTAGID = u"data-genid"
OPEN_TAG = HtmlTagType.OPEN_TAG
CLOSE_TAG = HtmlTagType.CLOSE_TAG
UNPAIRED_TAG = HtmlTagType.UNPAIRED_TAG
# Encodings: https://w3techs.com/technologies/overview/character_encoding/all
ENCODINGS = ['UTF-8', 'ISO-8859-1', 'Windows-1251', 'Shift JIS',
             'Windows-1252', 'GB2312', 'EUC-KR', 'EUC-JP', 'GBK', 'ISO-8859-2',
             'Windows-1250', 'ISO-8859-15', 'Windows-1256', 'ISO-8859-9',
             'Big5', 'Windows-1254', 'Windows-874']


def encode(html, default=None):
    if isinstance(html, six.binary_type):
        return html
    return _encode_or_decode_string(html, type(html).encode, default)


def decode(html, default=None):
    if isinstance(html, six.text_type):
        return html
    return _encode_or_decode_string(html, type(html).decode, default)


def _encode_or_decode_string(html, method, default):
    if not default:
        encoding = html_body_declared_encoding(html)
        if encoding:
            default = [encoding]
        else:
            default = []
    elif isinstance(default, six.string_types):
        default = [default]
    for encoding in itertools.chain(default, ENCODINGS):
        try:
            return method(html, encoding)
        except (UnicodeDecodeError, UnicodeEncodeError, LookupError):
            pass
        except AttributeError:
            return html
    encoding = chardet.detect(html).get('encoding')
    return method(html, encoding)


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
    storage = Storage(project_dir)
    specs = {"spiders": SpiderLoader(storage)}
    for name in ['project', 'items', 'extractors']:
        try:
            specs[name] = storage.open('{}.json'.format(name))
        except IOError:
            specs[name] = {}
    return specs


def read(fp, encoding='utf-8'):
    content = fp.read()
    if hasattr(content, 'decode'):
        content = content.decode('utf-8')
    return content


def _build_sample(sample, legacy=False):
    from slybot.plugins.scrapely_annotations.builder import Annotations
    Annotations(sample, legacy=legacy).build()
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
    return (hasattr(element, 'tag_type') and
            hasattr(element, 'tag') and
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
    return _modify_tagids(source, True)


def remove_tagids(source):
    """remove from the given page, all tagids previously added by add_tagids()
    """
    return _modify_tagids(source, False)


class Storage(object):
    def __init__(self, base_path):
        self.base_path = os.path.abspath(base_path)

    def rel_path(self, *args):
        return os.sep.join(args)

    def _path(self, *args):
        return os.path.join(self.base_path, self.rel_path(*args))

    def isdir(self, *args, **kwargs):
        return os.path.isdir(self._path(*args), **kwargs)

    def listdir(self, *args, **kwargs):
        return os.listdir(self._path(*args), **kwargs)

    def open(self, *args, **kwargs):
        """Open files from filesystem."""
        raw = kwargs.pop('raw', False)
        with open(self._path(*args)) as f:
            return decode(f.read()) if raw else json.load(f)


class SpiderLoader(object):
    def __init__(self, storage):
        if isinstance(storage, six.string_types):
            self.storage = Storage(storage)
        else:
            fsattrs = ['isdir', 'listdir', 'open', 'rel_path']
            if any(not hasattr(storage, attr) for attr in fsattrs):
                raise TypeError('Storage class must have "{}" methods'.format(
                    '", "'.join(fsattrs)))
            self.storage = storage
        self.spider_dir = self.storage.rel_path('spiders')
        self.spider_names = {
            s[:-len('.json')] for s in self.storage.listdir(self.spider_dir)
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
        spec = self.storage.open(self.spider_dir,
                                 '{}.json'.format(spider_name))
        try:
            if spec.get('templates'):
                templates = []
                for template in spec.get('templates', []):
                    if template.get('version', '') < '0.13.0':
                        templates.append(template)
                    else:
                        templates.append(_build_sample(template))
                spec['templates'] = templates
            else:
                templates = self.load_external_templates(self.spider_dir,
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

    def load_external_templates(self, spec_base, spider_name):
        """A generator yielding the content of all passed `template_names` for
        `spider_name`.
        """
        spider_dir = self.storage.rel_path('spiders', spider_name)
        if not self.storage.isdir(spider_dir):
            raise StopIteration
        for name in self.storage.listdir(spider_dir):
            if not name.endswith('.json'):
                continue
            path = self.storage.rel_path(spider_dir, name)
            sample = self.storage.open(path)
            sample_dir = path[:-len('.json')]
            if self.storage.isdir(sample_dir):
                for fname in self.storage.listdir(sample_dir):
                    if fname.endswith('.html'):
                        attr = fname[:-len('.html')]
                        html = self.storage.open(sample_dir, fname, raw=1)
                        sample[attr] = html
            if 'original_body' not in sample:
                sample['original_body'] = u'<html></html>'
            version = sample.get('version', '')
            yield _build_sample(sample, legacy=version < '0.13.0')
