from collections import OrderedDict
from datetime import datetime
from itertools import chain, product

from scrapy.utils.spider import arg_to_iter

import six

try:
    from itertools import izip_longest
except ImportError:
    from itertools import zip_longest as izip_longest
from six.moves.urllib.parse import urlencode


class IdentityGenerator():
    def __call__(self, spec):
        return spec


class UrlGenerator(object):
    def __init__(self, settings=None, spider_args=None):
        self._processors = {
            'date': self._process_date,
            'default': self._process_default,
            'options': self._process_option,
            'range': self._process_range,
            'settings': self._process_setting,
            'spider_args': self._process_args
        }
        self.settings = settings
        self.spider_args = spider_args

    def _process_date(self, values):
        now = datetime.now()
        return [now.strftime(v) for v in values]

    def _process_default(self, values):
        return [str(values[0])]

    def _process_option(self, values):
        return [str(v) for v in values]

    def _process_range(self, values):
        if len(values) > 3:
            return []
        return six.moves.range(*values)

    def _process_setting(self, values):
        if self.settings is None:
            return []
        results = []
        for value in values:
            results.extend(self.settings.getlist(value))
        return results

    def _process_args(self, values):
        if self.spider_args is None:
            return []
        results = []
        for value in values:
            results.extend(arg_to_iter(self.spider_args.get(value, [])))
        return results

    def _build_section(self, descriptor, params=False):
        if 'type' not in descriptor or 'values' not in descriptor:
            return []  # Malformed descriptor
        processor = self._processors.get(descriptor['type'])
        if processor is None:
            return []
        processed = processor(descriptor['values'])
        if not params:
            return processed
        if 'name' not in descriptor:
            return []
        return izip_longest([], processed, fillvalue=descriptor['name'])

    def _generate_urls(self, template, paths, params_template, params):
        path_length = len(paths)
        if params and not paths:
            components = product(*params)
        else:
            components = product(*chain(paths, params))
        for values in components:
            url = template.format(*values[:path_length])
            params = values[path_length:]
            if params_template or params:
                url_params = OrderedDict(params_template)
                for name, value in params:
                    url_params[name] = value
                url_params = urlencode(url_params)
                yield '{}?{}'.format(url, url_params)
            else:
                yield url

    def __call__(self, spec):
        template = spec['template']
        param = spec.get('params_template', {})
        paths = [self._build_section(d) for d in spec.get('paths', [])]
        params = [self._build_section(d, True) for d in spec.get('params', [])]
        url_generator = self._generate_urls(template, paths, param, params)
        return url_generator


generator = UrlGenerator()
