from os.path import join, abspath, dirname, exists
from slybot import __version__
from setuptools import setup, find_packages
from setuptools.command.bdist_egg import bdist_egg
from setuptools.command.sdist import sdist


def build_js():
    root = abspath(dirname(__file__))
    base_path = abspath(join(root, '..', 'splash_utils'))
    if not exists(base_path):
        base_path = abspath(join(root, '..', 'slyd', 'splash_utils'))

    files = ('waitAsync.js', 'perform_actions.js')
    fdata = []
    for fname in files:
        try:
            with open(join(base_path, fname)) as f:
                fdata.append(f.read())
        except IOError:
            print(
                'WARNING: Could not find JavaScript files to build splash '
                'scripts. Using pre-built assets if available instead')
            return
    js_file = abspath(join(root, 'slybot', 'splash-script-combined.js'))
    with open(js_file, 'w') as f:
        f.write(';(function(){\n%s\n})();' % '\n'.join(fdata))


class bdist_egg_command(bdist_egg):
    def run(self):
        build_js()
        bdist_egg.run(self)


class sdist_command(sdist):
    def run(self):
        build_js()
        sdist.run(self)


install_requires = ['Scrapy', 'scrapely', 'loginform', 'lxml', 'jsonschema',
                    'dateparser', 'scrapy-splash', 'page_finder', 'six',
                    'chardet']
extras = {
    'tests': ['nose', 'nose-timer', 'doctest-ignore-unicode', 'tox'],
    'clustering': ['page_clustering']
}

setup(name='slybot',
      version=__version__,
      license='BSD',
      description='Slybot crawler',
      author='Scrapy project',
      author_email='info@scrapy.org',
      url='http://github.com/scrapinghub/portia',
      packages=find_packages(exclude=('tests', 'tests.*')),
      platforms=['Any'],
      scripts=['bin/slybot', 'bin/portiacrawl'],
      install_requires=install_requires,
      extras_require=extras,
      package_data={'': ['slybot/splash-script-combined.js']},
      include_package_data=True,

      cmdclass={
          'bdist_egg': bdist_egg_command,
          'sdist': sdist_command
      },

      classifiers=[
          'Development Status :: 4 - Beta',
          'License :: OSI Approved :: BSD License',
          'Operating System :: OS Independent',
          'Programming Language :: Python',
          'Programming Language :: Python :: 2',
          'Programming Language :: Python :: 2.7',
          'Programming Language :: Python :: 3',
          'Programming Language :: Python :: 3.4',
      ])
