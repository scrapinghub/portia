from slybot import __version__
try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(name='slybot',
      version=__version__,
      license='BSD',
      description='Slybot crawler',
      author='Scrapy project',
      author_email='info@scrapy.org',
      url='http://github.com/scrapy/slybot',
      packages=['slybot', 'slybot.fieldtypes', 'slybot.tests'],
      platforms = ['Any'],
      install_requires = ['Scrapy', 'scrapely', 'loginform', 'lxml'],
      classifiers = ['Development Status :: 4 - Beta',
                     'License :: OSI Approved :: BSD License',
                     'Operating System :: OS Independent',
                     'Programming Language :: Python']
)
