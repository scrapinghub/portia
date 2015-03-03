#!/bin/bash
echo "Updating apt-get"
echo "================"
apt-get update -qq
echo "Installing git"
echo "=============="
apt-get install -qq --force-yes git
echo "Installing python build requirements"
echo "===================================="
apt-get install -qq --force-yes build-essential python python-dev libxml2-dev \
    libxslt1-dev libmysqlclient-dev libevent-dev libffi-dev libssl-dev \
    netbase ca-certificates apt-transport-https
echo "Installing python pip"
echo "====================="
wget -nv -O - https://bootstrap.pypa.io/get-pip.py | python
echo "Installing portia dependencies"
echo "=============================="
cd /vagrant
pip install -qr requirements.txt
pip install -e /vagrant/slybot
echo "Installing slyd as a Upstart service"
echo "===================================="
cp /vagrant/slyd.conf /etc/init
echo "Starting slyd service"
echo "====================="
start slyd
