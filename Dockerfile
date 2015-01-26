FROM ubuntu:12.04
ENV DEBIAN_FRONTEND noninteractive
RUN sed 's/main$/main universe/' -i /etc/apt/sources.list && \    
    apt-get update -q && \    
    apt-get install -y netbase ca-certificates python apt-transport-https
ADD https://raw.github.com/pypa/pip/master/contrib/get-pip.py /get-pip.py    
ENV PIP_TIMEOUT 180
ENV PYTHONUNBUFFERED yes
RUN python /get-pip.py && pip install -U wheel

# building lxml needs python-dev, libxml2-dev and libxslt1-dev
# building MySQL requires libmysqlclient-dev
# building pyOpenSSL requires libffi-dev libssl-dev
RUN apt-get update -qq &&\
    apt-get install -qy \
        build-essential python-dev libxml2-dev libssl-dev \
        libxslt1-dev libmysqlclient-dev libffi-dev \
        python-software-properties nginx

# nodejs
RUN apt-add-repository ppa:chris-lea/node.js &&\
    apt-get update -qq &&\
    apt-get install -qy nodejs
RUN npm install grunt-cli -g

# Install python stuff.
ADD requirements.txt /requirements.txt
RUN pip install -r /requirements.txt
ADD . /app
RUN ln -sf /app/nginx/nginx.conf /etc/nginx/nginx.conf 
RUN pip install -e /app/slybot

# Concatenate, optimize & obfuscate javascript.
WORKDIR /app/slyd
RUN npm install
RUN grunt optimize

EXPOSE 9001
# TODO(dangra): fix handling of nginx service, it won't be restarted in case if crashed.
CMD service nginx start; twistd --pidfile=/tmp/twistd.pid -n slyd -p 9002

