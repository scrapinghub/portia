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

The are two main components in this repo, __slyd__ and __slybot__:

###slyd

The visual editor used to create your scraping projects.

###slybot

The Python web crawler that performs the actual site scraping. It's implemented on top of the [Scrapy] web crawling
framework and the [Scrapely] extraction library. It uses projects created with __slyd__ as input.


How to install and run slyd
===========================

The recommended way to install dependencies is to use __virtualenv__ and then do:

	cd slyd
	pip install -r requirements.txt

Run the server using:

	twistd -n slyd

and point your browser to: `http://localhost:9001/static/main.html`

The projects created with __slyd__ can be found in:

	slyd/data/projects

How to install and run slybot
=============================

Again, using __virtualenv__:

	cd slybot
	pip install slybot

Choose the __slyd__ created project you want to run and copy its contents to a directory called `slybot-project`, `cd` into it and run:

	slybot crawl spidername

Where `spidername` is one of the project's spiders.

[Twisted]: https://twistedmatrix.com
[Scrapely]: https://github.com/scrapy/scrapely
[Scrapy]: http://scrapy.org


