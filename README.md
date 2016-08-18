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

# EC2 Initialization Script
Script:
  #!/bin/bash
  apt-get -y update
  apt-get -y install awscli
  apt-get -y install ruby2.0
  cd /home/ubuntu
  mkdir portia_logs
  mkdir portia_configs
  chown -R ubuntu:ubuntu portia_logs
  chown -R ubuntu:ubuntu portia_configs
  echo "export CATEGORIZATION_ENGINE_ENV=<env>" >> /home/ubuntu/.profile
  aws s3 cp s3://aws-codedeploy-us-east-1/latest/install . --region us-east-1
  chmod +x ./install
  ./install auto

 env = staging or production
  
  

