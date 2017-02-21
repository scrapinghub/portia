from collections import OrderedDict as ODict
from itertools import chain, product

from scrapy.utils.spider import arg_to_iter

import six
from six.moves.urllib_parse import urlparse

from .feed_generator import FeedGenerator
from .fragment_generator import FragmentGenerator
from .generated_url import GeneratedUrl
from .generator import IdentityGenerator, UrlGenerator


class StartUrlCollection(object):
    def __init__(self, start_urls, generators=None):
        self.generators = generators or []
        self.start_urls = [self._from_type(url) for url in start_urls]

    def __iter__(self):
        generated = (self._generate_urls(url) for url in self.start_urls)
        for url in chain(*(arg_to_iter(g) for g in generated)):
            yield url

    def uniq(self):
        return list(ODict([(s.key, s.spec) for s in self.start_urls]).values())

    @property
    def allowed_domains(self):
        domains = [start_url.allowed_domains for start_url in self.start_urls]
        return list(set(chain(*domains)))

    def normalize(self):
        return [start_url.normalized for start_url in self.start_urls]

    def _generate_urls(self, start_url):
        generator = self.generators[start_url.generator_type]
        return generator(start_url.generator_value)

    def _from_type(self, start_url):
        if isinstance(start_url, six.string_types):
            return StringUrl(start_url)
        if start_url.get('paths') or start_url.get('template'):
            return GeneratedUrl(start_url)
        return StartUrl(start_url, self.generators)


class StartUrl(object):
    def __init__(self, spec, generators):
        self.spec = spec
        self.generators = generators
        self.generator_type = spec['type']
        self.generator_value = self.spec if self._has_fragments else self.spec['url']

    @property
    def key(self):
        fragments = self.spec.get('fragments', [])
        fragment_values = [fragment['value'] for fragment in fragments]
        return self.spec['url'] + ''.join(fragment_values)

    @property
    def allowed_domains(self):
        if self._has_fragments:
            return self._find_fragment_domains()
        return [self.spec['url']]

    @property
    def normalized(self):
        return self.spec

    def _find_fragment_domains(self):
        generator = self.generators[self.generator_type]
        fragment_lists = list(generator.process_fragments(self.spec))

        while len(fragment_lists) > 0:
            fragment_list = fragment_lists.pop(0)

            if all(self._has_domain(fragment) for fragment in fragment_list):
                return fragment_list
            if len(fragment_lists) == 0:
                return []

            augmented_first_fragments = product(fragment_list, fragment_lists[0])
            fragment_lists[0] = self._join_fragments(augmented_first_fragments)
        return []

    def _join_fragments(self, fragments):
        return [''.join([f, g]) for (f, g) in fragments]

    def _has_domain(self, url):
        parsed_url = urlparse(url)
        methods = ['path', 'params', 'query', 'fragment']
        return any(getattr(parsed_url, method) != '' for method in methods)

    @property
    def _has_fragments(self):
        return self.spec.get('fragments')


class StringUrl(object):
    def __init__(self, spec):
        self.key = spec
        self.spec = spec
        self.generator_value = spec
        self.generator_type = 'start_urls'

    @property
    def allowed_domains(self):
        return [self.spec]

    @property
    def normalized(self):
        return {'url': self.spec, 'type': 'url'}
