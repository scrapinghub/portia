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

Prerequisites
=============

You might need to run the following commands to install the required tools & libraries before building portia:

    apt-get install python-pip python-dev libxml2-dev libxslt1-dev libffi-dev libssl-dev
    pip install virtualenv

Installation
============

The recommended way to install dependencies is to use __virtualenv__:

    virtualenv YOUR_ENV_NAME --no-site-packages

and then do:

    source YOUR_ENV_NAME/bin/activate
    cd slyd
    pip install -r requirements.txt

As `slybot` is a `slyd` dependency, it will also get installed.

**Note:** you may need to use `sudo` or `pip --user` if you get permissions problems while installing.

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

	slybot/bin/portiacrawl project_path spidername -o output_data.json

Where `spidername` should be one of the project spiders. If you don't remember the name of the spider, just use:

	slybot/bin/portiacrawl project_path

and you will get the list of spiders for that project.

To get the full list of portiacrawl options, run:

	slybot/bin/portiacrawl -h

Portia spiders are ultimately [Scrapy] spiders. You can pass __scrapy__ spider arguments when running them with ```portiacrawl``` by using the ```-a``` command line option. A custom settings module may also be specified using the ```--settings``` command line option. Please refer to the [scrapy documentation] for details on arguments and settings.

Deploy with [scrapyd]
=====================

Portia spiders can be deployed to [scrapyd] just like a scrapy spider: change directory to ``slyd/projects/your_project_name`` and run:

	scrapyd-deploy your_scrapyd_target -p project_name

and then schedule your spider with:

    curl http://your_scrapyd_host:6800/schedule.json -d project=your_project_name -d spider=your_spider_name

you can find more documents from [scrapyd].

Running portia with [vagrant]
=============================

This is probably the easiest way to install and run portia.

First, you need to get:

* Vagrant: http://www.vagrantup.com/downloads.html
* VirtualBox: https://www.virtualbox.org/wiki/Downloads

After that ```cd``` into the repo directory and run:

    vagrant up

This will setup and start an ubuntu virtual machine, build portia and launch the ```slyd``` server for you. Just point your browser to `http://localhost:8000/static/main.html` after vagrant has finished the whole process (you should see ```default: slyd start/running, process XXXX``` in your console) and you can start using portia. You can stop the server with ```vagrant suspend``` or ```vagrant halt```.

The repository directory is shared with the VM, so you don't need to do anything special to keep it in sync. You can __ssh__ into the virtual machine by running ```vagrant ssh```. The repo dir will be mounted at ```/vagrant``` in the VM. Please note that you __need to ssh into the VM to run the ```portiacrawl``` script__.

Repository structure
====================

There are two main components in this repository, __slyd__ and __slybot__:

### slyd

The visual editor used to create your scraping projects.

### slybot

The Python web crawler that performs the actual site scraping. It's implemented on top of the [Scrapy] web crawling
framework and the [Scrapely] extraction library. It uses projects created with __slyd__ as input.


[Twisted]: https://twistedmatrix.com
[Scrapely]: https://github.com/scrapy/scrapely
[Scrapy]: http://scrapy.org
[scrapy documentation]: http://doc.scrapy.org/en/latest
[vagrant]: http://www.vagrantup.com
[scrapyd]: http://scrapyd.readthedocs.org/en/latest/
