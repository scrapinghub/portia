apt install python-dev python3-dev
pip3.5 install tox
cd /app/slybot
tox
cd /app/portia_server
python3.5 manage.py test portia_api.tests
python3.5 manage.py test portia_orm.tests
