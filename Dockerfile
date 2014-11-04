FROM ubuntu:12.04
RUN apt-get update
RUN apt-get install -y --force-yes python-dev libxml2-dev libxslt1-dev libffi-dev libssl-dev
RUN apt-get install -y python-pip
RUN apt-get install -y git
RUN pip install --upgrade pip
ADD slybot /slybot
ADD slyd/requirements.txt /requirements.txt
RUN pip install -r requirements.txt
ADD . /app
WORKDIR /app/slyd
CMD twistd --pidfile=/tmp/twistd.pid -n slyd
EXPOSE 9001
