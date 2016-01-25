#!/usr/bin/env python
import os
from datetime import datetime
_BASE_PATH = os.path.abspath(os.path.dirname(__file__))
VERSION_FILE = os.path.abspath(os.path.join(_BASE_PATH, '../VERSION'))


def next_version(version_file):
    now = datetime.now()
    this_month = datetime(now.year, now.month, 1)
    with open(version_file, 'r') as f:
        version = f.read().strip().split('.')
        release_month = datetime.strptime('.'.join(version[:-1]), '%y.%m')
        release_number = int(version[-1]) + 1
        if this_month != release_month:
            release_number = 1
        release_number =  max(1, release_number)
        return '{:%y.%m}.{}'.format(this_month, release_number).decode('utf-8')


def bump_version_file(filename=None):
    if filename is None:
        filename = VERSION_FILE
    next_version_string = next_version(filename)
    with open(filename, 'w') as f:
        f.write(next_version_string)


if __name__ == '__main__':
    bump_version_file()

