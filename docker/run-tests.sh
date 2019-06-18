#!/bin/bash

export PYTHONPATH=`pwd`/slybot:`pwd`/slyd
pip install tox

cd /app/slyd
python2.7 tests/testserver/server.py 2>&1 | grep -v 'HTTP/1.1" 200' &
sleep 3

cd /app/slybot
tox
cd /app/portia_server
./manage.py test portia_orm.tests
./manage.py test portia_api.tests
