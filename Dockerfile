FROM ubuntu:14.04

RUN echo deb http://nginx.org/packages/ubuntu/ trusty nginx > /etc/apt/sources.list.d/nginx.list && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62 && \
    apt-get update && \
    apt-get -y install \
        curl \
        libxml2-dev \
        libxslt-dev \
        nginx python-dev \
        python-numpy \
        python-openssl \
        python-pip \
        python-software-properties && \
    \
    echo Installing splash && \
    cd /tmp && \
    curl -L -o splash.tar.gz 'https://github.com/scrapinghub/splash/archive/master.tar.gz' && \
    tar -xvf splash.tar.gz --keep-newer-files && \
    cd splash-* && \
    SPLASH_PYTHON_VERSION=2 dockerfiles/splash/provision.sh \
    prepare_install \
    install_builddeps \
    install_deps \
    install_pyqt5

RUN cd /tmp/splash-* && pip install .

# Install python stuff.
ADD slyd/requirements.txt /requirements-slyd.txt
RUN pip install -r /requirements-slyd.txt
ADD slybot/requirements.txt /requirements-slybot.txt
RUN pip install -r/requirements-slybot.txt
RUN cd /tmp/splash-* && SPLASH_PYTHON_VERSION=2 dockerfiles/splash/provision.sh \
    remove_builddeps
ADD . /app

ENV PYTHONPATH /app/slybot:/app/slyd
EXPOSE 9001

RUN ln -sf /app/nginx/nginx.conf /etc/nginx/nginx.conf

RUN pip install -e /app/slybot /app/slyd

WORKDIR /app/slyd
# TODO(dangra): fix handling of nginx service, it won't be restarted in case if crashed.
CMD service nginx start; bin/slyd -p 9002 -r /app/slyd/dist
