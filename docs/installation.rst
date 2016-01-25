.. _installation:

Installation
============

Vagrant (recommended)
---------------------

Checkout the repository::

    $ git clone https://github.com/scrapinghub/portia

You will need both `Vagrant <http://www.vagrantup.com/downloads.html>`_ and `VirtualBox <https://www.virtualbox.org/wiki/Downloads>`_ installed.

Run the following in Portia's directory::

    vagrant up

This will launch an Ubuntu virtual machine, build Portia and start the ``slyd`` server. You'll then be able to access Portia at ``http://localhost:9001``. You can stop the ``slyd`` server using ``vagrant suspend`` or ``vagrant halt``. To run ``portiacrawl`` you will need to SSH into the virtual machine by running ``vagrant ssh``.

Docker
------

Checkout the repository::

    git clone https://github.com/scrapinghub/portia

If you are on a Linux machine you will need `Docker <https://docs.docker.com/installation/>`_ installed or if you are using a `Windows <https://docs.docker.com/installation/windows/>`_ or `Mac OS X <https://docs.docker.com/installation/mac/>`_ machine you will need `boot2docker <http://boot2docker.io/>`_.

After following the appropriate instructions above the Portia image can be built using the command below::

    docker build -t portia .

Portia can be run using the command below::

    docker run -i -t --rm -v <PROJECT_FOLDER>/data:/app/slyd/data:rw -p 9001:9001 --name portia portia

Portia will now be running on port 9001 and you can access it at ``http://localhost:9001/static/index.html``.
Projects will be stored in the project folder that you mount to docker.

To run `portiacrawl` add `/app/slybot/bin/portiacrawl <PROJECT_PATH> [SPIDER] [OPTIONS]` to the command above.

.. warning:: For Windows the `<PROJECT_FOLDER>` path must be of the form `/<DRIVE_LETTER/<PATH>`

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

Install splash and the required packages::

    sudo ./provision.sh install_splash install_python_deps

To run Portia start slyd::

    cd slyd
    bin/slyd

Portia should now be running on port 9001 and you can access it at ``http://localhost:9001``.

