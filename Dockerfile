FROM ubuntu:14.04
WORKDIR /app/slyd

RUN mkdir /root/.ssh
RUN chmod 700 /root/.ssh
COPY portia.private.key /root/.ssh/id_rsa
RUN chmod 600 ~/.ssh/id_rsa

COPY provision.sh /app/provision.sh
RUN /app/provision.sh install_deps
RUN /app/provision.sh install_splash
RUN /app/provision.sh clone_kipp_config

COPY slybot/requirements.txt /app/slybot/requirements.txt
RUN pip install -r /app/slybot/requirements.txt
COPY slyd/requirements.txt /app/slyd/requirements.txt
RUN pip install -r /app/slyd/requirements.txt

COPY portia_server/requirements.txt /app/portia_server/requirements.txt
RUN pip install -r /app/portia_server/requirements.txt

ADD slyd /app/slyd
RUN pip install -e /app/slyd

ADD slybot /app/slybot
RUN pip install -e /app/slybot

RUN /app/provision.sh cleanup

ADD nginx /etc/nginx
ADD . /app

EXPOSE 9001
ENTRYPOINT ["/app/docker/entry"]
