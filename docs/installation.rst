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

To run `portiacrawl` add `/app/slybot/bin/portiacrawl <PROJECT_PATH> [SPIDER] [OPTIONS]` to the command above.

To extract data using portia you can run your spider with::

    docker run -i -t --rm -v <PROJECTS_FOLDER>:/app/data/projects:rw <OUPUT_FOLDER>:/mnt:rw -p 9001:9001 scrapinghub/portia \
        portiacrawl /app/data/projects/PROJECT_NAME SPIDER_NAME -o /mnt/SPIDER_NAME.jl

After the crawl finishes you will find your extracted data in the the `OUTPUT_FOLDER`

.. warning:: For Windows the `<PROJECT_FOLDER>` path must be of the form `/<DRIVE_LETTER/<PATH>`


Vagrant
-------

Checkout the repository::

    $ git clone https://github.com/scrapinghub/portia

You will need `Vagrant <http://www.vagrantup.com/downloads.html>`_ , `VirtualBox <https://www.virtualbox.org/wiki/Downloads>`_ `Node.js <https://nodejs.org/en/download/package-manager/>`_, `Bower <https://bower.io/#install-bower>`_ and `ember-cli <https://ember-cli.com/>`_ installed.

Run the following in Portia's directory::

    docker/compile-assets.sh
    vagrant up

This will launch an Ubuntu virtual machine, build Portia and start the ``portia`` server. You'll then be able to access Portia at ``http://localhost:9001``. You can stop the ``portia`` server using ``vagrant suspend`` or ``vagrant halt``. To run ``portiacrawl`` you will need to SSH into the virtual machine by running ``vagrant ssh``.


Debian
------

Running Portia Locally
^^^^^^^^^^^^^^^^^^^^^^

**These instructions are only valid for a Debian based OS**

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

    slyd/bin/slyd -p 9002 -r portiaui/dist && portia_server/manage.py runserver

Portia should now be running on port 9001 and you can access it at ``http://localhost:9001``.

