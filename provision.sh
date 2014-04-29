#!/bin/bash
echo "Updating apt-get"
echo "================"
sudo apt-get update
echo "Installing python stuff"
echo "======================="
sudo apt-get install -y --force-yes python-dev libxml2-dev libxslt1-dev libffi-dev libssl-dev
echo "Installing python pip"
echo "====================="
sudo apt-get install -y --force-yes python-pip
echo "Installing git"
echo "=============="
sudo apt-get install -y --force-yes git
echo "Installing portia dependencies"
echo "=============================="
cd /vagrant/slyd
pip install -r requirements.txt
echo "Installing slyd as a Upstart service"
echo "===================================="
sudo cp /vagrant/slyd.conf /etc/init
echo "Starting slyd service"
echo "====================="
sudo start slyd




