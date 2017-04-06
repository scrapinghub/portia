Portia
======

Portia is a tool that allows you to visually scrape websites without any programming knowledge required. With Portia you can annotate a web page to identify the data you wish to extract, and Portia will understand based on these annotations how to scrape data from similar pages.

# Try it out

To try Portia for free without needing to install anything sign up for an account at [scrapinghub](https://portia.scrapinghub.com/) and you can use our hosted version.

# Running Portia

The easiest way to run Portia is using Vagrant.

Clone the repository:

    git clone https://github.com/scrapinghub/portia

Then inside the Portia directory, run:

    vagrant up

For more detailed instructions, and alternatives to using Vagrant, see the [Installation](http://portia.readthedocs.org/en/latest/installation.html) docs.

# Documentation

Documentation can be found [here](http://portia.readthedocs.org/en/latest/index.html). Source files can be found in the ``docs`` directory.


Getting started running Portia with docker
==========================================

To run Portia first time using Docker.

First Install Docker
https://docs.docker.com/engine/installation/linux/ubuntu/#install-using-the-repository

```
git clone https://github.com/flyingelephantlab/portia.git

curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g bower
sudo npm install -g ember-cli

cd portia/portiaui
npm install && bower install
cd node_modules/ember-cli && npm install

cd ../../  # (inside portiaui)
ember build [-e production]

cd ../  # (portia)
sudo docker build -t portia .

Then everytime you made a change you need to build ember and run docker

sudo docker run -i -t --rm -v <current-path>/portia/slyd/slyd/data:/app/slyd/slyd/data/projects:rw -v <current-path>/portia/portiaui/dist:/app/portiaui/dist -p 9001:9001 portia
```
