import operator

from collections import namedtuple
from itertools import groupby
from operator import itemgetter
Region = namedtuple('Region', ['score', 'start_index', 'end_index'])


def element_from_page_index(page, index):
    token_index = page.token_page_indexes[index]
    return page.htmlpage.parsed_body[token_index]


def container_id(x):
    return x.annotation.metadata.get('container_id')


def _int_cmp(a, op, b):
    op = getattr(operator, op)
    a = -float('inf') if a is None else a
    b = -float('inf') if b is None else b
    return op(a, b)


def group_tree(tree, container_annotations):
    result = {}
    get_first = itemgetter(0)
    for name, value in groupby(sorted(tree, key=get_first), get_first):
        value = list(value)
        if len(value) <= 1:
            result[name] = container_annotations.get(name)
        else:
            result[name] = group_tree([l[1:] for l in value if len(l) > 1],
                                      container_annotations)
    return result


def _count_annotations(extractor):

    def count(extractors):
        result = 0
        for ex in extractors:
            while (hasattr(ex, 'extractors') and
                   hasattr(ex, 'modifiers')):
                return count(ex.extractors)
            result += len(ex.extractors)
        return result
    return count(extractor.extractors)
