FROM base:12.04

RUN apt-get -qy install python-software-properties
RUN apt-add-repository ppa:chris-lea/node.js
RUN apt-get update -qq && \
	apt-get -qy install python-dev libxml2-dev libxslt1-dev libffi-dev libssl-dev python-pip git python-software-properties nodejs

RUN npm install grunt-cli -g

RUN pip install --upgrade pip

ADD slybot /slybot
ADD slyd/requirements.txt /requirements.txt
RUN pip install -r requirements.txt

ADD . /app
WORKDIR /app/slyd
RUN npm install
RUN grunt optimize
CMD twistd --pidfile=/tmp/twistd.pid -n slyd
EXPOSE 9001
