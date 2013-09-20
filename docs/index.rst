==============================
Slybot |version| documentation
==============================

Slybot is a Python web crawler for doing web scraping. It's implemented on top of the
`Scrapy`_ web crawling framework and the `Scrapely`_ extraction library.

Requirements
============

* `Scrapy`_
* `Scrapely`_
* `loginform`_
* lxml

Installation
============

To install the last development version::

    pip install git+https://github.com/scrapy/slybot.git

To install the last stable version::

    pip install slybot

Quick Usage
===========

Create a directory called ``slybot-project``, place your slybot project (JSON
files) there.

To get a list of all spiders::

    slybot list

To run a specific specific spider::

    slybot crawl <spider_name>

For those familiar with Scrapy, ``slybot`` is a thin wrapper for the ``scrapy``
command, that just instructs Scrapy to use Slybot settings
(``slybot.settings``). All commands and arguments supported by the ``scrapy``
command are also supported by the ``slybot`` command, although a few of them
don't apply.

Slybot projects
===============

Slybot projects are configured through a collection of JSON files which are
documented in :doc:`project`.

Example project
===============

There is a working slybot project example in `slybot/tests/data/SampleProject`_
that is used for tests and hence use most of the available features.

User interfaces
===============

Here is a list of known UIs to create Slybot templates:

* `Scrapely tool`_ (command line interface)
* `Scrapinghub Autoscraping`_ (visual, web-based)

Advanced configuration
======================

Slybot is a `Scrapy`_ project, so it can be tuned and configured using `Scrapy
settings`_. For more information see: :doc:`config`.

Spiderlets
==========

The behaviour of Slybot spiders can also be tuned with small (Python) code
snippets called spiderlets. For more information see :doc:`spiderlets`.

Table of contents
=================

.. toctree::
   :maxdepth: 2

   project
   config
   spiderlets

.. _Scrapy: https://github.com/scrapy/scrapy
.. _Scrapely: https://github.com/scrapy/scrapely
.. _loginform: https://github.com/scrapy/loginform
.. _slybot/tests/data/SampleProject: https://github.com/scrapy/slybot/tree/master/slybot/tests/data/SampleProject
.. _Scrapy settings: http://doc.scrapy.org/en/latest/topics/settings.html
.. _Scrapely tool: https://github.com/scrapy/scrapely#usage-command-line-tool
.. _Scrapinghub Autoscraping: http://scrapinghub.com/autoscraping.html
