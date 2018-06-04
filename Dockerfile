FROM ubuntu:16.04
WORKDIR /app/slyd

ENV PATH="/opt/qt59/5.9.1/gcc_64/bin:${PATH}"
ENV DEBIAN_FRONTEND noninteractive
ENV QT_MIRROR http://ftp.fau.de/qtproject/official_releases/qt/5.9/5.9.1/qt-opensource-linux-x64-5.9.1.run

COPY docker/portia.conf /app/portia.conf
COPY docker/qt_install.qs /app/script.qs
COPY docker/provision.sh /app/provision.sh
COPY slybot/requirements.txt /app/slybot/requirements.txt
COPY slyd/requirements.txt /app/slyd/requirements.txt
COPY portia_server/requirements.txt /app/portia_server/requirements.txt

RUN /app/provision.sh prepare_install && \
    /app/provision.sh install_deps && \
    /app/provision.sh install_qtwebkit_deps && \
    /app/provision.sh download_official_qt && \
    /app/provision.sh install_official_qt && \
    /app/provision.sh install_qtwebkit && \
    /app/provision.sh install_pyqt5 && \
    /app/provision.sh install_python_deps && \
    /app/provision.sh install_flash && \
    /app/provision.sh install_msfonts && \
    /app/provision.sh install_extra_fonts && \
    /app/provision.sh remove_builddeps && \
    /app/provision.sh remove_extra

ADD docker/nginx /etc/nginx
ADD . /app
RUN pip install -e /app/slyd && \
    pip install -e /app/slybot
RUN python3 /app/portia_server/manage.py migrate

EXPOSE 9001
ENTRYPOINT ["/app/docker/entry"]
