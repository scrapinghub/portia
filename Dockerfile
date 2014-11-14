FROM base:12.04

# Install native libraries and friends.
RUN apt-get -qy install python-software-properties
RUN apt-add-repository ppa:chris-lea/node.js
RUN apt-get update -qq && \
	apt-get -qy install python-dev libxml2-dev libxslt1-dev libffi-dev \
	libssl-dev python-pip git python-software-properties nodejs nginx

RUN npm install grunt-cli -g

RUN pip install --upgrade pip

# Install python stuff.
ADD slybot /slybot
ADD slyd/requirements.txt /requirements.txt
RUN pip install -r requirements.txt

ADD . /app
WORKDIR /app/slyd

# Concatenate, optimize & obfuscate javascript.
RUN npm install
RUN grunt optimize

# Configure an nginx instance working as a reverse proxy.
RUN rm /etc/nginx/nginx.conf
ADD nginx/nginx.conf /etc/nginx/

EXPOSE 9001
CMD service nginx start; twistd --pidfile=/tmp/twistd.pid -n slyd -p 9002

