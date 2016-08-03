from datetime import datetime
from itertools import product

import six


class FragmentGenerator(object):
    def _process_fixed(self, fragment):
        return [fragment]

    def _process_list(self, fragment):
        return fragment.split(' ')

    def _process_date(self, fragment):
        now = datetime.now()
        return [now.strftime(fragment)]

    def _process_range(self, fragment):
        a, b = map(int, fragment.split('-'))
        return (str(i) for i in six.moves.range(a, b + 1))

    def _process_fragment(self, fragment):
        processor = getattr(self, '_process_{}'.format(fragment['type']))
        return processor(fragment['value'])

    def process_fragments(self, spec):
        return map(self._process_fragment, spec['fragments'])

    def __call__(self, spec):
        generated = product(*self.process_fragments(spec))
        for fragment_list in generated:
            yield ''.join(fragment_list)
