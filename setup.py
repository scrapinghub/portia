try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(name='slybot',
      version='0.9',
      license='BSD',
      description='Slybot crawler',
      author='Scrapinghub',
      author_email='info@scrapinghub.com',
      url='http://github.com/scrapinghub/slybot',
      packages=['slybot', 'slybot.fieldtypes', 'slybot.tests'],
      platforms = ['Any'],
      install_requires = ['Scrapy', 'scrapely'],
      classifiers = ['Development Status :: 4 - Beta',
                     'License :: OSI Approved :: BSD License',
                     'Operating System :: OS Independent',
                     'Programming Language :: Python']
)
