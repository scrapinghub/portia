FROM scrapinghub/base:12.04

RUN echo deb http://nginx.org/packages/ubuntu/ precise nginx > /etc/apt/sources.list.d/nginx.list && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62

RUN apt-get update && \
    apt-get -y install python-software-properties nginx python-dev

# Install splash requirements
ADD docker/splash.sh /splash.sh
RUN /splash.sh

# Install python stuff.
ADD slyd/requirements.txt /requirements-slyd.txt
RUN pip install -r /requirements-slyd.txt
ADD slybot/requirements.txt /requirements-slybot.txt
RUN pip install -r/requirements-slybot.txt

ENV PYTHONPATH /app/portia/slybot:/app/portia/slyd
EXPOSE 9001

ADD . /app
RUN mkdir -p /app/slyd/splash_utils/filters
ADD https://easylist-downloads.adblockplus.org/easylist.txt \
    /app/slyd/splash_utils/filters/easylist.txt

RUN ln -sf /app/nginx/nginx.conf /etc/nginx/nginx.conf

RUN pip install -e /app/slybot /app/slyd

WORKDIR /app/slyd
# TODO(dangra): fix handling of nginx service, it won't be restarted in case if crashed.
CMD service nginx start; bin/slyd
