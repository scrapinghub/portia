FROM scrapinghub/base:12.04

RUN apt-get update -qq &&\
    apt-get install -qy python-software-properties nginx

# nodejs
RUN apt-add-repository ppa:chris-lea/node.js &&\
    apt-get update -qq &&\
    apt-get install -qy nodejs

# Install python stuff.
ADD slyd/requirements.txt /requirements-slyd.txt
RUN pip install -r /requirements-slyd.txt
ADD slybot/requirements.txt /requirements-slybot.txt
RUN pip install -r/requirements-slybot.txt

ENV PYTHONPATH /app/portia/slybot:/app/portia/slyd
EXPOSE 9001

ADD . /app

RUN ln -sf /app/nginx/nginx.conf /etc/nginx/nginx.conf

WORKDIR /app/slyd
# TODO(dangra): fix handling of nginx service, it won't be restarted in case if crashed.
CMD service nginx start; twistd --pidfile=/tmp/twistd.pid -n slyd -p 9002
