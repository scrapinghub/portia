FROM ubuntu:12.04
RUN apt-get update
RUN apt-get install -y --force-yes python-dev libxml2-dev libxslt1-dev libffi-dev libssl-dev
RUN apt-get install -y python-pip
RUN apt-get install -y git
ADD . /
WORKDIR /slyd
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install mysql-connector-python --allow-external mysql-connector-python
CMD twistd -n slyd -g -u frankie
EXPOSE 9001
