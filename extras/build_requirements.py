#!/usr/bin/env python
import os


class RequirementsBuilder(object):
    def __init__(self, project_path):
        self.project_path = project_path

    def requirements(self, *args):
        args = [self.project_path] + list(args) + ['requirements.txt']
        return os.path.join(*args)

    def build_requirements(self):
        with open(self.requirements('slybot'), 'r') as slybot, \
                open(self.requirements('slyd'), 'r') as slyd:
            return '\n'.join((slybot.read(), slyd.read()))


def write_requirements(project_path):
    rb = RequirementsBuilder(project_path)
    original_reqs = ''
    new_reqs = ''
    with open(rb.requirements(), 'r') as reqs:
        original_reqs = reqs.read()

    with open(rb.requirements(), 'w') as out:
        new_reqs = rb.build_requirements()
        out.write(new_reqs)

    return new_reqs == original_reqs


if __name__ == '__main__':
    import sys
    path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    if path.endswith('.git'):
        path = os.path.dirname(path)
    diff = write_requirements(path)
