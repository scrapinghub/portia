FROM ubuntu:16.04
WORKDIR /app/slyd

COPY provision.sh /app/provision.sh
COPY slybot/requirements.txt /app/slybot/requirements.txt
COPY slyd/requirements.txt /app/slyd/requirements.txt
COPY portia_server/requirements.txt /app/portia_server/requirements.txt
RUN /app/provision.sh prepare_install
RUN /app/provision.sh install_deps
RUN /app/provision.sh install_qtwebkit_deps
ENV PATH="/opt/qt59/5.9.1/gcc_64/bin:${PATH}"
ENV DEBIAN_FRONTEND noninteractive
COPY docker/qt_install.qs /app/script.qs
RUN /app/provision.sh download_official_qt
RUN /app/provision.sh install_official_qt
RUN /app/provision.sh install_qtwebkit
RUN /app/provision.sh install_pyqt5
RUN /app/provision.sh install_python_deps
RUN /app/provision.sh install_flash
RUN /app/provision.sh install_msfonts
RUN /app/provision.sh install_extra_fonts

ADD nginx /etc/nginx
ADD . /app
RUN pip install -e /app/slyd && \
    pip install -e /app/slybot
RUN python3 /app/portia_server/manage.py migrate

EXPOSE 9001
ENTRYPOINT ["/app/docker/entry"]
