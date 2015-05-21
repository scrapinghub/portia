from slybot import __version__
from setuptools import setup, find_packages

install_requires = ['Scrapy', 'scrapely', 'loginform', 'lxml', 'jsonschema',
                    'dateparser', 'rfc3987']
extras = {
    'tests': ['nose']
}

setup(name='slybot',
      version=__version__,
      license='BSD',
      description='Slybot crawler',
      author='Scrapy project',
      author_email='info@scrapy.org',
      url='http://github.com/scrapy/slybot',
      packages=find_packages(exclude=('tests', 'tests.*')),
      platforms=['Any'],
      scripts=['bin/slybot', 'bin/portiacrawl'],
      install_requires=install_requires,
      extras_require=extras,
      classifiers=[
          'Development Status :: 4 - Beta',
          'License :: OSI Approved :: BSD License',
          'Operating System :: OS Independent',
          'Programming Language :: Python',
          'Programming Language :: Python :: 2',
          'Programming Language :: Python :: 2.7'
      ])
