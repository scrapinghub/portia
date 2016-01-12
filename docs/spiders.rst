.. _spiders:

Spiders
=======

Spiders are web crawlers that consist of one or more :ref:`samples <samples>`.

Configuration
-------------

The configuration of a spider is split into three sections:

* **Initialization**
* **Crawling**
* **Extraction**

The **Initialization** section is used to set up the spider when it's first launched. Here you can define the start URLs and login credentials.

The **Crawling** section is used to configure how the spider will behave when it encounters URLs. You can choose how links are followed and whether to respect `nofollow <http://en.wikipedia.org/wiki/nofollow>`_. You can visualise the effects of the crawling rules using the **Overlay blocked links** option; this will highlight links that will be followed in green, links that will only be followed if JavaScript is enabled in dark green, and links that won't be followed in red.

.. tip:: You can enable JavaScript by checking the 'Enable JS' checkbox. Here you can define patterns to filter which pages to enable JavaScript on. Note that you'll need to set the `SPLASH_URL` Scrapy setting to your Splash endpoint URL for JavaScript to work during the crawl.

The **Extraction** section lists the samples for this spider.

.. _page-actions:

Page actions
------------

Page actions let you do things like scroll or click a button on the page. This is useful when scraping websites that have menus or dialogs you need to navigate.

.. important:: You need to enable JavaScript in your spider before you can define page actions.

The following actions are available:

Click
~~~~~

Clicks a button on the page.

======== =================================
Setting  Description
======== =================================
Selector The target button's CSS selector.
======== =================================

Set
~~~

Sets a particular element to a certain value using `CSS selectors <https://developer.mozilla.org/en/docs/Web/Guide/CSS/Getting_started/Selectors>`_.

======== ==================================
Setting  Description
======== ==================================
Selector The target element's CSS selector.
Value    The value you want to set.
======== ==================================

Wait
~~~~

Waits a certain amount of time.

======= ==================================
Setting Description
======= ==================================
Timeout Time to wait in milliseconds.
======= ==================================

Scroll
~~~~~~

Scrolls an element by a certain percentage.

======== ==================================
Setting  Description
======== ==================================
Selector The target element's CSS selector.
Scroll   The percentage at which to scroll.
======== ==================================


You can use the ``Record`` button to record actions you perform on the page, or you can define them manually. To control which pages the actions are performed on, you can set page matching rules for each action using `regular expressions <https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions>`_.

.. _running-spider:

Running a spider
----------------

Projects you have created in Portia will reside in ``slyd/data/projects``. You can use ``portiacrawl`` to run a spider from one of your projects::

    portiacrawl PROJECT_PATH SPIDER_NAME

where ``PROJECT_PATH`` is the path of the project and ``SPIDER_NAME`` is a spider that exists within that project. You can list the spiders for a project with the following::

    portiacrawl PROJECT_PATH

Portia spiders are ultimately `Scrapy <http://scrapy.org>`_ spiders. You can pass Scrapy arguments when running with ``portiacrawl`` using the ``-a`` option. You can also specify a custom settings module using the ``--settings`` option. The `Scrapy documentation <http://doc.scrapy.org/en/latest>`_ contains full details on available options and settings.

Minimum items threshold
-----------------------

To avoid infinite crawling loops, Portia spiders check to see if the number of scraped items meet a minimum threshold over a given period of time. If not, the job is closed with ``slybot_fewitems_scraped`` outcome.

By default, the period of time is 3600 seconds and the threshold is 200 items scraped. This means if less than 200 items were scraped in the last 3600 seconds, the job will close.

You can set the period in seconds with the ``SLYCLOSE_SPIDER_CHECK_PERIOD`` setting, and the threshold number of items with the ``SLYCLOSE_SPIDER_PERIOD_ITEMS`` setting.

