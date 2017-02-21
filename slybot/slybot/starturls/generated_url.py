from itertools import chain


class GeneratedUrl(object):
    def __init__(self, spec):
        self.key = spec
        self.spec = spec
        self.generator_value = spec
        self.generator_type = 'generated_urls'

    @property
    def allowed_domains(self):
        return [self.spec['template']]

    @property
    def normalized(self):
        return {
            'url': self.normalized_url,
            'type': 'generated',
            'fragments': self.normalized_fragments,
        }

    @property
    def normalized_url(self):
        paths = [normalize_url_path(path) for path in self.spec['paths']]
        try:
            base_url = self.spec['template'].format(*paths)
        except IndexError:
            # Fix templates that have more sections than path pieces
            template = self.spec['template']
            while '{}' in template:
                template = template.rsplit('{}', 1)[0]
                try:
                    base_url = template.format(*paths)
                    break
                except IndexError:
                    continue

        query_params = [normalize_url_query_param(path, is_first=(i == 0))
                        for i, path in enumerate(self._query_params)]
        return base_url + ''.join(query_params)

    @property
    def normalized_fragments(self):
        fixed, path = self._fixed_fragments, self._path_fragments
        fragments = list(zip(fixed, path))

        # Missed last fixed fragment when using zip
        if len(fixed) == len(path) + 1:
            fragments.append([fixed[-1]])

        return list(chain.from_iterable(fragments)) + self._query_fragments

    @property
    def _path_fragments(self):
        return [normalize_path(path) for path in self.spec['paths']]

    @property
    def _fixed_fragments(self):
        return [{'type': 'fixed', 'value': fragment} for fragment in
                self.spec['template'].split('{}') if fragment]

    @property
    def _query_fragments(self):
        if len(self._query_params) == 0:
            return []

        fragments = [normalize_query_param(query_param, is_first=(i == 0))
                     for i, query_param in enumerate(self._query_params)]
        return list(chain(*fragments))

    @property
    def _query_params(self):
        params = self.spec['params']
        template_params = self.spec['params_template']

        query_params = []
        param_names = {p['name'] for p in params}
        for query, value in template_params:
            if query not in param_names:
                query_params.append({
                    'name': query,
                    'type': 'default',
                    'values': [value]
                })
        return query_params + params


def normalize_path(path):
    if path['type'] == 'options':
        return {
            'type': 'list',
            'value': ' '.join(path['values']),
        }
    if path['type'] == 'default':
        return {
            'type': 'fixed',
            'value': normalize_default(path)
        }
    if path['type'] == 'date':
        return {
            'type': 'date',
            'value': normalize_default(path)
        }
    if path['type'] == 'range':
        return {
            'type': 'range',
            'value': normalize_range(path)
            }
    return None


def normalize_url_path(path):
    if path['type'] == 'default':
        return normalize_default(path)
    if path['type'] == 'range':
        return normalize_range(path)
    return '[...]'


def normalize_url_query_param(x, is_first=False):
    prefix = query_params_prefix(is_first).format(x['name'])
    return prefix + normalize_url_path(x)


def normalize_query_param(x, is_first=False):
    first_fragment = {
        'type': 'fixed',
        'value': query_params_prefix(is_first).format(x['name'])
    }
    return [first_fragment, normalize_path(x)]


def normalize_default(x):
    return str(x['values'][0])


def normalize_range(x):
    a, b = x['values'][0:2]
    b_inclusive = str(int(b) - 1)
    return '{}-{}'.format(a, b_inclusive)


def query_params_prefix(is_first):
    return '?{}=' if is_first else '&{}='
