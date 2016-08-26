from setuptools import setup, find_packages

install_requires = ['Scrapy', 'scrapely', 'loginform', 'lxml', 'jsonschema',
                    'django', 'parse', 'marshmallow_jsonapi', 'chardet',
                    'autobahn', 'requests', 'service_identity',
                    'ndg-httpsclient']
tests_requires = install_requires

setup(name='slyd',
      license='BSD',
      description='Portia',
      author='Scrapinghub',
      url='http://github.com/scrapinghub/portia',
      packages=find_packages(),
      platforms=['Any'],
      scripts=['bin/sh2sly', 'bin/slyd', 'bin/init_mysql_db'],
      classifiers=[
          'Development Status :: 4 - Beta',
          'License :: OSI Approved :: BSD License',
          'Operating System :: OS Independent',
          'Programming Language :: Python',
          'Programming Language :: Python :: 2',
          'Programming Language :: Python :: 2.7'
      ])
