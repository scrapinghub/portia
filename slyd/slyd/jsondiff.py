from collections import namedtuple


class JsonDiff(object):
    """
    Compares two json objects and stores the differences.
    Only the outermost objects are considered, the comparison does not recurse
    into nested objects.
    """
    def __init__(self, old, new):
        set_new, set_old = set(new.keys()), set(old.keys())
        common = set_new.intersection(set_old)
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
        all_fields = set(base.keys() + mine.keys() + other.keys())
        merge_dict = {}
        for k in all_fields:
            base_val, my_val, other_val = (
                base.get(k, None), mine.get(k, None), other.get(k, None))
            if isinstance(my_val, dict) and isinstance(other_val, dict):
                merge_dict[k] = build_merge_dict(base_val, my_val, other_val)
            else:
                merge_dict[k] = FieldDiff(base_val=base.get(k, None),
                                          my_val=my_val,
                                          my_op=my_diff.op_for_field(k),
                                          other_val=other_val,
                                          other_op=other_diff.op_for_field(k))
        return merge_dict

    def eq_vals(diff):
        return diff.other_val == diff.my_val

    def conflict(diff):
        return { '__CONFLICT': diff._asdict() }

    def resolve_json(merge_dict):
        out_json = {}
        had_conflict = False
        for key, diff in merge_dict.iteritems():
            if isinstance(diff, dict):
                out_json[key], rconflict = resolve_json(diff)
                had_conflict = had_conflict or rconflict
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
