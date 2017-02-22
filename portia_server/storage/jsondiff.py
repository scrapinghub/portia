import difflib

from collections import namedtuple
from six.moves import zip_longest

_BLANK = object()


class Conflict(object):
    def __init__(self, mine, other, base):
        self.mine = [mine] if mine is not _BLANK else None
        self.other = [other] if other is not _BLANK else None
        self.base = [base] if base is not _BLANK else None

    @classmethod
    def from_prepared(cls, mine, other, base):
        m = mine[0] if mine else _BLANK
        o = other[0] if other else _BLANK
        b = base[0] if base else _BLANK
        conflict = cls(m, o, b)
        for m, o, b in zip_longest(mine[1:], other[1:], base[1:],
                                   fillvalue=_BLANK):
            conflict.update(m, o, b)
        return conflict

    @classmethod
    def resolve_sub_conflict(cls, mine, other):
        c = cls.from_prepared(mine, other, [])
        return c.resolve_conflict() or []

    def update(self, m, o, b):
        if m is not _BLANK:
            self.mine.append(m)
        if o is not _BLANK:
            self.other.append(o)
        if b is not _BLANK:
            self.base.append(b)

    def resolve_conflict(self):
        if self.mine is None and self.other is not None:
            return self.other
        if self.other is None and self.mine is not None:
            return self.mine
        if self.other == self.mine:
            return self.mine
        combined = set(self.mine or []) | set(self.other or [])
        if (self.base is not None and
                not any(i in combined for i in self.base)):
            return [self]
        mine = self.mine if self.mine else []
        other = self.other if self.other else []
        i_mine, i_other = iter(mine), iter(other)
        result, new_mine, new_other = [], [], []
        for diff in difflib.Differ().compare([str(i) for i in other],
                                             [str(i) for i in mine]):
            if ((diff.startswith('+') and (new_other or result)) or
                    (diff.startswith('-') and (new_mine or result)) or
                    (result and (new_other or new_mine))):
                if new_mine or new_other:
                    result.insert(0, Conflict.from_prepared(new_mine,
                                                            new_other,
                                                            []))
                result.extend(Conflict.resolve_sub_conflict(
                              [i for i in i_mine],
                              [i for i in i_other]))
                break
            elif diff.startswith('-'):
                new_other.append(next(i_other))
            elif diff.startswith('+'):
                new_mine.append(next(i_mine))
            elif diff.startswith(' '):
                next(i_other)
                result.append(next(i_mine))
        return result

    def _asdict(self):
        return {
            'my_op': 'CHANGED',
            'my_val': self.mine,
            'other_op': 'CHANGED',
            'other_val': self.other,
            'base_val': self.base
        }

    def __eq__(self, other):
        return (self.mine == other.mine and self.other == other.other and
                self.base == other.base)

    def __str__(self):
        return 'Conflict{}'.format(str((self.mine, self.other, self.base)))

    def __repr__(self):
        return str(self)


def merge_lists(base, mine, other):
    if mine == other:
        return mine
    if other == base:
        return mine
    if mine == base:
        return other
    result = []
    last_conflict = False
    for i, (m, o, b) in enumerate(zip_longest(mine, other, base,
                                              fillvalue=_BLANK)):
        if (m == o and _BLANK not in (m, o) or
                isinstance(m, dict) and isinstance(o, dict)):
            result.append(m)
        else:  # Conflict
            if last_conflict:
                c = result[-1]
                c.update(m, o, b)
            else:
                c = Conflict(m, o, b)
                result.append(c)
            last_conflict = True
            continue
        last_conflict = False
    offset = 0
    for i, r in enumerate(result[:]):
        if isinstance(r, Conflict):
            c = r.resolve_conflict() or []
            result = result[:i + offset] + c + result[i + offset + 1:]
            offset += len(c) - 1
    return result


class JsonDiff(object):
    """
    Compares two json objects and stores the differences.
    Only the outermost objects are considered, the comparison does not recurse
    into nested objects.
    """
    def __init__(self, old, new):
        set_new, set_old = set(new), set(old)
        common = set_new & set_old
        self.added = list(set_new - common)
        self.removed = list(set_old - common)
        self.changed = [k for k in common if new[k] != old[k]]
        self.unchanged = [k for k in common if new[k] == old[k]]

    def op_for_field(self, field_name):
        for operation in ('ADDED', 'UNCHANGED', 'CHANGED', 'REMOVED'):
            if field_name in getattr(self, operation.lower()):
                return operation
        return None


FieldDiff = namedtuple(
    'DiffOp', ['my_op', 'my_val', 'other_op', 'other_val', 'base_val'])


def merge_jsons(base, mine, other):
    """
    Performs a 3-way merge of mine and other using base as the common ancestor.

    Some conflicts are automatically resolved, e.g. mine and other both delete
    the same field.
    Conflicts that can't be automatically resolved (e.g. mine and other assign
    different values to the same field) are serialized into the merged json in
    a way that can be used for a later manual resolve:

        field: { __CONFLICT:
                    base_val: X,  # the original value of the field
                    my_val: Y,    # the value assigned by mine json
                    my_op: Z,     # the operation performed by mine json
                    other_val: U, # the value assigned by other json
                    other_op: W,  # the operation performed by other json
                }

        my_op and other_op can take any of this values: 'ADDED', 'REMOVED',
        'CHANGED', 'UNCHAGED'. If my_op == 'DELETED' then my_value == None
        (the same applies to other_op and other_val respectively).

    The merge recurses into dictionaries but considers lists as atomic values.
    Returns a tuple of the form (merged, had_conflict).
    """
    def build_merge_dict(base, mine, other):
        my_diff = JsonDiff(base, mine)
        other_diff = JsonDiff(base, other)
        base, mine, other = (j if isinstance(j, dict) else {}
                             for j in (base, mine, other))
        all_fields = set(base.keys()).union(mine.keys()).union(other.keys())
        merge_dict = {}
        for k in all_fields:
            base_val, my_val, other_val = (
                base.get(k, {}), mine.get(k), other.get(k))
            if isinstance(my_val, dict) and isinstance(other_val, dict):
                merge_dict[k] = build_merge_dict(base_val, my_val, other_val)
            if isinstance(my_val, list) and isinstance(other_val, list):
                merge_dict[k] = merge_lists(base_val, my_val, other_val)
            else:
                merge_dict[k] = FieldDiff(base_val=base.get(k),
                                          my_val=my_val,
                                          my_op=my_diff.op_for_field(k),
                                          other_val=other_val,
                                          other_op=other_diff.op_for_field(k))
        return merge_dict

    def eq_vals(diff):
        return diff.other_val == diff.my_val

    def conflict(diff):
        return {'__CONFLICT': diff._asdict()}

    def resolve_json(merge_dict):
        out_json = {}
        had_conflict = False
        for key, diff in merge_dict.items():
            if isinstance(diff, dict):
                out_json[key], rconflict = resolve_json(diff)
                had_conflict = had_conflict or rconflict
            if isinstance(diff, list):
                for i, item in enumerate(diff):
                    if isinstance(item, Conflict):
                        if (item.mine and isinstance(item.mine[0], dict) and
                                '__CONFLICT' in item.mine[0]):
                            diff[i] = item.mine[0]
                        else:
                            diff[i] = conflict(item)
                        had_conflict = True
                out_json[key] = diff
            elif diff.my_op in ('UNCHANGED', None):
                if diff.other_op != 'REMOVED':
                    out_json[key] = diff.other_val
            elif diff.my_op == 'ADDED':
                if diff.other_op != 'ADDED' or eq_vals(diff):
                    out_json[key] = diff.my_val
                else:
                    out_json[key] = conflict(diff)
                    had_conflict = True
            elif diff.my_op == 'REMOVED':
                if diff.other_op == 'CHANGED':
                    out_json[key] = conflict(diff)
                    had_conflict = True
            elif diff.my_op == 'CHANGED':
                if diff.other_op == 'UNCHANGED' or eq_vals(diff):
                    out_json[key] = diff.my_val
                else:
                    out_json[key] = conflict(diff)
                    had_conflict = True
        return out_json, had_conflict

    return resolve_json(build_merge_dict(base, mine, other))
