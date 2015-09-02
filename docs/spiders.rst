.. _spiders:

Spiders
=======

Spiders are web crawlers that consist of one or more :ref:`templates <templates>`.

Configuration
-------------

The configuration of a spider is split into three sections:

* **Initialization**
* **Crawling**
* **Extraction**

The **Initialization** section is used to set up the spider when it's first launched. Here you can define the start URLs and login credentials.

The **Crawling** section is used to configure how the spider will behave when it encounters URLs. You can choose how links are followed and whether to respect `nofollow <http://en.wikipedia.org/wiki/nofollow>`_. You can visualise the effects of the crawling rules using the **Overlay blocked links** option; this will highlight links that will be followed in green, links that will only be followed if JavaScript is enabled in dark green, and links that won't be followed in red.

You can enable JavaScript by checking the 'Enable JS' checkbox. Here you can set the patterns to match against for links that should have JavaScript enabled, as well as those that should have it disabled. Note that when deploying you will need to set the `SPLASH_URL` Scrapy setting to match your Splash endpoint URL in order for JavaScript to work during the crawl.

The **Extraction** section lists the templates for this spider.

.. _running-spider:

Running a spider
----------------

Projects you have created in Portia will reside in ``slyd/data/projects``. You can use ``portiacrawl`` to run a spider from one of your projects::

    portiacrawl PROJECT_PATH SPIDER_NAME

where ``PROJECT_PATH`` is the path of the project and ``SPIDER_NAME`` is a spider that exists within that project. You can list the spiders for a project with the following::

    portiacrawl PROJECT_PATH

Portia spiders are ultimately `Scrapy <http://scrapy.org>`_ spiders. You can pass Scrapy arguments when running with ``portiacrawl`` using the ``-a`` option. You can also specify a custom settings module using the ``--settings`` option. The `Scrapy documentation <http://doc.scrapy.org/en/latest>`_ contains full details on available options and settings.

