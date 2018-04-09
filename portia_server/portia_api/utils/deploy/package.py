import os
import textwrap
import zipfile

from datetime import datetime
from distutils.dist import DistributionMetadata
from io import StringIO


class EggInfo(object):
    def __init__(self, project, archive):
        self.project = project
        self.archive = archive
        self.tstamp = datetime.now().timetuple()[:6]

    def write(self):
        self._write_file('PKG-INFO', self.build_pkg_info())
        self._write_file('SOURCES.txt', self.build_sources())
        self._write_file('dependency_links.txt', self.build_dependency())
        self._write_file('entry_points.txt', self.build_entry_points())
        self._write_file('top_level.txt', self.build_top_level())
        self._write_file('zip-safe', self.build_zip_safe())

    def _write_file(self, filename, contents):
        filepath = os.path.join('EGG-INFO', filename)
        fileinfo = zipfile.ZipInfo(filepath, self.tstamp)
        fileinfo.external_attr = 0o666 << 16
        self.archive.writestr(fileinfo, contents, zipfile.ZIP_DEFLATED)

    def build_pkg_info(self):
        meta = DistributionMetadata()
        meta.name = self.project.name
        meta.version = self.project.version
        file = StringIO()
        meta.write_pkg_file(file)
        file.seek(0)
        return file.read()

    def build_sources(self):
        return '\n'.join(sorted(f.filename for f in self.archive.filelist))

    def build_top_level(self):
        return '\n'.join(sorted({
            fn.split('/', 1)[0] for fn in (
                fn for fn in (
                    f.filename for f in self.archive.filelist))
            if fn.endswith('.py')
        }))

    def build_dependency(self):
        return '\n'

    def build_entry_points(self):
        return textwrap.dedent("""\
            [scrapy]
            settings = spiders.settings
        """)

    def build_zip_safe(self):
        return ''
