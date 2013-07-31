==============
Slybot crawler
==============

Slybot is a Python web crawler for doing web scraping. It's implemented on top of the
`Scrapy`_ web crawling framework and the `Scrapely`_ extraction library.

Requirements
============

* `Scrapy`_
* `Scrapely`_

Quick Usage
===========

Change your working directory to the slybot base module folder (where you can find ``settings.py`` file), create a directory called
``slybot-project``, place your slybot project specs there, and run::

    scrapy list

for listing the spiders in your project, or::

    scrapy crawl <spider name>

for running a specific spider.

Configuration
=============

In order to run `Scrapy`_ with the slybot spider, you need just to have slybot library in your python path,
and pass the appropiate settings. In ``slybot/settings.py`` you can find a sample settings file::

    SPIDER_MANAGER_CLASS = 'slybot.spidermanager.SlybotSpiderManager'
    EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
    ITEM_PIPELINES = ['slybot.dupefilter.DupeFilterPipeline']
    SLYDUPEFILTER_ENABLED = True
    PROJECT_DIR = 'slybot-project'

    try:
        from local_slybot_settings import *
    except ImportError:
        pass

The first line::

    SPIDER_MANAGER_CLASS = 'slybot.spidermanager.SlybotSpiderManager'

is where the magic starts. It says to scrapy to use the slybot spider manager, which is required in order to load and
run the project specifications and the slybot spider. You can also use the alternative spider manager ``slybot.spidermanager.ZipfileSlybotSpiderManager``,
which also admits project specifications gives as a zipfile (see below).

The line::
    
    EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
    
is optional, but recommended. As slybot spiders are not absolutely customizable as a common scrapy spider, it
can face some unexpected and uncontrollable situations that leads them to a neverending crawling. The
specified extension is a safe measure in order to avoid that. It works by checking each fixed period of time, that
a minimal number of items has been scraped along the same period. Refer to ``slybot/closespider.py`` for details

The also optional ``DupeFilterPipeline``, which is enabled with the lines::

    ITEM_PIPELINES = ['slybot.dupefilter.DupeFilterPipeline']
    SLYDUPEFILTER_ENABLED = True

filters out duplicate items based on the item version, which is calculated using the version
fields of the item definition. It maintains a set of the version of each item issued by the spider,
and if the version of a new item is already in the set, it is dropped.

The setting ``PROJECT_DIR`` defines where the slybot spider can find the project
specifications (item definitions, extractors, spiders). It is a string that defines the path of a folder
in your filesystem, with a folder structure that we will define below in this doc.

If you know how to use scrapy, you already know the alternatives to pass those and every custom settings to the crawler:
either use your customized settings module with all the settings you need, and indicate it on the command line using the environment
variable ``SCRAPY_SETTINGS_MODULE``, or use the ``slybot.settings`` module and give the remaining
settings in a ``local_slybot_settings.py`` file somewhere in your python path, or pass the additional settings in command
line. You can right now do a test with our test project in ``slybot/tests/data/SampleProject``, by running, inside the current folder::

    scrapy list -s PROJECT_DIR=slybot/tests/data/SampleProject

and then use the scrapy ``crawl`` command for run one of the available spiders that provides the list. 

If you setup the alternative ``slybot.spidermanager.ZipfileSlybotSpiderManager`` instead, you can pass the alternative setting
``PROJECT_ZIPFILE`` with the name of the zip archive which contains your project specifications.

For convenience, with the package comes the script ``bin/ascrawl.py``, which allows to easily setup and run a slybot spider.

.. _Scrapy: https://github.com/scrapy/scrapy
.. _Scrapely: https://github.com/scrapy/scrapely

