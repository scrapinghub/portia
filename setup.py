try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(name='slybot',
      version='0.9',
      license='BSD',
      description='Slybot crawler',
      author='Scrapy project',
      author_email='info@scrapy.org',
      url='http://github.com/scrapy/slybot',
      packages=['slybot', 'slybot.fieldtypes', 'slybot.tests'],
      platforms = ['Any'],
      install_requires = ['Scrapy', 'scrapely'],
      classifiers = ['Development Status :: 4 - Beta',
                     'License :: OSI Approved :: BSD License',
                     'Operating System :: OS Independent',
                     'Programming Language :: Python']
)
