FROM scrapinghub/base:12.04

RUN echo deb http://nginx.org/packages/ubuntu/ precise nginx > /etc/apt/sources.list.d/nginx.list && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62

RUN apt-get update && \
    apt-get -y install python-software-properties nginx

# Install splash requirements
ADD docker/splash.sh /splash.sh
RUN /splash.sh

# Install python stuff.
ADD requirements.txt /requirements.txt
RUN apt-get install -y python-dev && \
    pip install --no-cache-dir -r /requirements.txt && \
    apt-get remove -y --purge python-dev && \
    apt-get clean -y && \
    apt-get autoremove -y

EXPOSE 9001

ADD . /app

RUN ln -sf /app/nginx/nginx.conf /etc/nginx/nginx.conf

RUN pip install -e /app/slybot

WORKDIR /app/slyd
# TODO(dangra): fix handling of nginx service, it won't be restarted in case if crashed.
CMD service nginx start; bin/slyd
