Portia
======

Portia is a tool that allows you to visually scrape websites without any programming knowledge required. With Portia you can annotate a web page to identify the data you wish to extract, and Portia will understand based on these annotations how to scrape data from similar pages.

# Try it out

To try Portia for free without needing to install anything sign up for an account at [scrapinghub](https://portia.scrapinghub.com/) and you can use our hosted version.

# Running Portia

The easiest way to run Portia is using Docker.

You can run Portia using docker by running:

    docker run -v ~/portia_projects:/app/data/projects:rw -p 9001:9001 scrapinghub/portia

For more detailed instructions, and alternatives to using Docker, see the [Installation](http://portia.readthedocs.org/en/latest/installation.html) docs.

# Documentation

Documentation can be found [here](http://portia.readthedocs.org/en/latest/index.html). Source files can be found in the ``docs`` directory.

