from slybot import __version__
try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

install_requires = ['Scrapy', 'scrapely', 'loginform', 'lxml']
tests_requires = ['jsonschema'] + install_requires

setup(name='slybot',
      version=__version__,
      license='BSD',
      description='Slybot crawler',
      author='Scrapy project',
      author_email='info@scrapy.org',
      url='http://github.com/scrapy/slybot',
      packages=['slybot', 'slybot.fieldtypes', 'slybot.tests', 'slybot.linkextractor'],
      platforms = ['Any'],
      scripts = ['bin/slybot'],
      install_requires = install_requires,
      tests_requires = tests_requires,
      classifiers = ['Development Status :: 4 - Beta',
                     'License :: OSI Approved :: BSD License',
                     'Operating System :: OS Independent',
                     'Programming Language :: Python']
)
