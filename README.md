Portia
======

Portia is a tool that allows you to visually scrape websites without any programming knowledge required. With Portia you can annotate a web page to identify the data you wish to extract, and Portia will understand based on these annotations how to scrape data from similar pages.

# Running Portia

The easiest way to run Portia is using [Docker]:

You can run Portia using Docker & official Portia-image by running:

    docker run -v ~/portia_projects:/app/data/projects:rw -p 9001:9001 scrapinghub/portia

You can also set up a local instance with [Docker-compose] by cloning this repo & running from the root of the folder:

    docker-compose up

For more detailed instructions, and alternatives to using Docker, see the [Installation] docs.

# Documentation

Documentation can be found from [Read the docs]. Source files can be found in the ``docs`` directory.

[Docker]: https://www.docker.com/
[Docker-compose]:https://docs.docker.com/compose
[Installation]: http://portia.readthedocs.org/en/latest/installation.html
[Read the docs]: http://portia.readthedocs.org/en/latest/index.html
[Scrapinghub]: https://portia.scrapinghub.com/
