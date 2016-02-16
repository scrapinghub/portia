Portia
======

Portia is a tool that allows you to visually scrape websites without any programming knowledge required. With Portia you can annotate a web page to identify the data you wish to extract, and Portia will understand based on these annotations how to scrape data from similar pages.

# Running Portia

The easiest way to run Portia is using Docker.

Clone the repository:

    git clone https://github.com/scrapinghub/portia

Then inside the Portia directory, run:

    docker build -t portia .

Create a Docker [volume](https://docs.docker.com/engine/userguide/dockervolumes/) for the Portia project data:

    docker create --name portia-data -v /app/slyd/data:rw portia

Run portia:

     docker run -i -t --rm \
     	-v portia-data:/app/slyd/data:rw \
     	-p 9001:9001 \
     	--name portia \
     	portia

Portia will now be running on port 9001 and you can access it at:

    http://localhost:9001/static/index.html   (http://192.168.99.100:9001 if using boot2docker-windows)

Projects will be stored in the project folder that you mount at:

    portia-data


For more detailed instructions, and alternatives such as Vagrant, see the [Installation](http://portia.readthedocs.org/en/latest/installation.html) docs.

# Documentation

Documentation can be found [here](http://portia.readthedocs.org/en/latest/index.html). Source files can be found in the ``docs`` directory.

