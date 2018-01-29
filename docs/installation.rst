.. _installation:

Installation
============

Docker (recommended)
--------------------

If you are on a Linux machine you will need `Docker <https://docs.docker.com/installation/>`_ installed or if you are using a `Windows <https://docs.docker.com/installation/windows/>`_ or `Mac OS X <https://docs.docker.com/installation/mac/>`_ machine you will need `boot2docker <http://boot2docker.io/>`_.

You can run Portia with the command below::

    docker run -i -t --rm -v <PROJECTS_FOLDER>:/app/data/projects:rw -p 9001:9001 scrapinghub/portia

Portia will now be running on port 9001 and you can access it at ``http://localhost:9001``.
Projects will be stored in the project folder that you mount to docker.

To extract data using portia you can run your spider with::

    docker run -i -t --rm -v <PROJECTS_FOLDER>:/app/data/projects:rw -v <OUPUT_FOLDER>:/mnt:rw -p 9001:9001 scrapinghub/portia \
        portiacrawl /app/data/projects/PROJECT_NAME SPIDER_NAME -o /mnt/SPIDER_NAME.jl

After the crawl finishes you will find your extracted data in the the `OUTPUT_FOLDER`

.. note:: *<PROJECT_FOLDER>* and *<OUTPUT_FOLDER>* are just paths on your system where your projects and extracted data are stored.
.. warning:: For Windows the *<PROJECT_FOLDER>* path must be of the form */<DRIVE_LETTER/<PATH>*. For example */C/Users/UserName/Documents/PortiaProjects*


Vagrant
-------

Checkout the repository::

    $ git clone https://github.com/scrapinghub/portia

You will need `Vagrant <http://www.vagrantup.com/downloads.html>`_ , `VirtualBox <https://www.virtualbox.org/wiki/Downloads>`_ `Node.js <https://nodejs.org/en/download/package-manager/>`_, `Bower <https://bower.io/#install-bower>`_ and `ember-cli <https://ember-cli.com/>`_ installed.

Run the following in Portia's directory::

    docker/compile-assets.sh
    vagrant up

This will launch an Ubuntu virtual machine, build Portia and start the ``portia`` server. You'll then be able to access Portia at ``http://localhost:9001``. You can stop the ``portia`` server using ``vagrant suspend`` or ``vagrant halt``. To run ``portiacrawl`` you will need to SSH into the virtual machine by running ``vagrant ssh``.


Ubuntu
------

Running Portia Locally
^^^^^^^^^^^^^^^^^^^^^^

**These instructions are only valid for an Ubuntu based OS**

Install the following dependencies::

    sudo ./provision.sh install_deps

If you would like to run Portia locally you should create an environment with virtualenv::

    virtualenv YOUR_ENV_NAME --no-site-packages
    source YOUR_ENV_NAME/bin/activate
    cd ENV_NAME

Now clone this repository into that env::

    git clone https://github.com/scrapinghub/portia.git
    cd portia

Install splash and the required packages::

    sudo ./provision.sh install_deps install_splash install_python_deps

To run Portia start slyd and portia_server::

    PYTHONPATH='/vagrant/portia_server:/vagrant/slyd:/vagrant/slybot'
    slyd/bin/slyd -p 9002 -r portiaui/dist &
    portia_server/manage.py runserver

Portia should now be running on port 9001 and you can access it at ``http://localhost:9001``.


Developing Portia using Docker
------------------------------

To develop Portia using docker you will need `Node.js <https://nodejs.org/en/download/package-manager/>`_, `Bower <https://bower.io/#install-bower>`_ and `ember-cli <https://ember-cli.com/>`_ installed.

To set up Portia for development use the commands below::

    mkdir ~/data
    git clone git@github.com:scrapinghub/portia.git
    cd portia/portiaui
    npm install && bower install
    cd node_modules/ember-cli && npm install && cd ../../
    ember build
    cd ..
    docker build . -t portia

You can run it using::

    docker run -i -t --rm -p 9001:9001 \
        -v ~/data:/app/data/projects:rw \
        -v ~/portia/portiaui/dist:/app/portiaui/dist \
        -v ~/portia/slyd:/app/slyd \
        -v ~/portia/portia_server:/app/portia_server \
        portia

This sets up the ``portia_server`` to restart with every change you make and if you run
``cd ~/portia/portiaui && ember build -w`` in another shell you can rebuild the Portia assets with every change too.
