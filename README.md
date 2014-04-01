portia
======
Visual scraping for Scrapy.


Overview
========

Portia is a tool for visually scraping web sites without any programming knowledge. Just annotate web pages with a point and click editor to indicate what data you want to extract, and portia will learn how to scrape similar pages
from the site.

Portia has a web based UI served by a [Twisted] server, so you can install it on almost any modern platform.

Requirements
============

* Python 2.7
* Works on Linux, Windows, Mac OSX, BSD
* Supported browsers: Latest versions of Chrome (recommended) or Firefox


Repository structure
====================

There are two main components in this repository, __slyd__ and __slybot__:

###slyd

The visual editor used to create your scraping projects.

###slybot

The Python web crawler that performs the actual site scraping. It's implemented on top of the [Scrapy] web crawling
framework and the [Scrapely] extraction library. It uses projects created with __slyd__ as input.


How to install portia
=============================

The recommended way to install dependencies is to use __virtualenv__ and then do:

	cd slyd
	pip install -r requirements.txt

As __slybot__ is a __slyd__ dependency, it will also get installed.

Running portia
==============

First, you need to start the ui and create a project. Run __slyd__ using:

	cd slyd
	twistd -n slyd

and point your browser to: `http://localhost:9001/static/main.html`

Choose the site you want to scrape and create a project. Every project is created with a default spider named after the domain of the site you are scraping. When you are ready, you can run your project with __slybot__ to do the actual crawling/extraction.

Projects created with __slyd__ can be found at:

	slyd/data/projects

To run one of those projects use:

	portiacrawl project_path spidername

Where `spidername` should be one of the project spiders. If you don't remember the name of the spider, just use:

	portiacrawl project_path

and you will get the list of spiders for that project.


[Twisted]: https://twistedmatrix.com
[Scrapely]: https://github.com/scrapy/scrapely
[Scrapy]: http://scrapy.org
