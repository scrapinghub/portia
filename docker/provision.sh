#!/bin/bash
set -e

if [ "x$APP_ROOT" = x ]
then
    for dir in "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" /app /vagrant $(pwd)
    do
        if [ -d "$dir" ] && [ -d "$dir/slyd" ]
        then
            APP_ROOT="$dir"
            break
        fi
    done
fi

if [ "x$APP_ROOT" = x ]
then
    echo "Could not determine app directory"
    exit 1
fi

echo "APP_ROOT=$APP_ROOT"

usage() {
    cat <<EOF
Portia provisioner.

Usage: $0 COMMAND [ COMMAND ... ]

Available commands:
usage -- print this message
prepare_install -- prepare image for installation
install_deps -- install general system-level dependencies
install_qtwebkit_deps -- install Qt and WebKit dependencies
install_official_qt -- install Qt using official installer
install_qtwebkit -- install updated WebKit for QT
install_pyqt5 -- install PyQT5 from sources
install_python_deps -- install python packages
install_msfonts -- agree with EULA and install Microsoft fonts
install_extra_fonts -- install extra fonts
install_flash -- install flash plugin
remove_builddeps -- WARNING: only for Docker! Remove build-dependencies.
remove_extra -- WARNING: only for Docker! Eemove files that are not necessary to run Splash.
configure_initctl -- installs initctl configuration
configure_nginx -- installs nginx configuration

EOF
}

SPLASH_SIP_VERSION=${SPLASH_SIP_VERSION:-"4.19.3"}
SPLASH_PYQT_VERSION=${SPLASH_PYQT_VERSION:-"5.9"}
SPLASH_BUILD_PARALLEL_JOBS=${SPLASH_BUILD_PARALLEL_JOBS:-"2"}
QT_MIRROR=${QT_MIRROR:-"http://ftp.fau.de/qtproject/official_releases/qt/5.9/5.9.1/qt-opensource-linux-x64-5.9.1.run"}
export PATH=/opt/qt59/5.9.1/gcc_64/bin:$PATH

# '2' is not supported by this script; allowed values are "3" and "venv" (?).
SPLASH_PYTHON_VERSION=${SPLASH_PYTHON_VERSION:-"3"}

if [[ ${SPLASH_PYTHON_VERSION} == "venv" ]]; then
    _PYTHON=python
else
    _PYTHON=python${SPLASH_PYTHON_VERSION}
fi

_activate_venv () {
    if [[ ${SPLASH_PYTHON_VERSION} == "venv" ]]; then
        source ${VIRTUAL_ENV}/bin/activate
    fi
}

prepare_install () {
    # Prepare docker image for installation of packages, docker images are
    # usually stripped and apt-get doesn't work immediately.
    #
    # python-software-properties contains "add-apt-repository" command for PPA conf
    sed 's/main$/main universe/' -i /etc/apt/sources.list
    apt-get update
    apt-get install -y --no-install-recommends \
        curl \
        software-properties-common \
        apt-transport-https \
        python3-software-properties
}

install_deps () {
    # Get more recent node install
    echo deb http://nginx.org/packages/ubuntu/ trusty nginx > /etc/apt/sources.list.d/nginx.list
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62
    wget -O - https://deb.nodesource.com/setup_8.x | bash -
    # Install system dependencies for Qt, Python packages, etc.
    # ppa:pi-rho/security is a repo for libre2-dev
    add-apt-repository -y ppa:pi-rho/security && \
    apt-get update -q && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-dev \
        python3-pip \
        build-essential \
        libre2-dev \
        liblua5.2-dev \
        libsqlite3-dev \
        zlib1g \
        zlib1g-dev \
        netbase \
        ca-certificates \
        pkg-config \
        nodejs \
        libmysqlclient-dev \
        python-mysql.connector \
        python-numpy \
        python-openssl \
        python-pip \
        nginx
}

install_qtwebkit_deps () {
    apt-get install -y --no-install-recommends \
        xvfb \
        libjpeg-turbo8-dev \
        libgl1-mesa-dev \
        libglu1-mesa-dev \
        mesa-common-dev \
        libfontconfig1-dev \
        libicu-dev \
        libpng12-dev \
        libxslt1-dev \
        libxml2-dev \
        libhyphen-dev \
        libgbm1 \
        libxcb-image0 \
        libxcb-icccm4 \
        libxcb-keysyms1 \
        libxcb-render-util0 \
        libxi6 \
        libxcomposite-dev \
        libxrender-dev \
        libgstreamer1.0-dev \
        libgstreamer-plugins-base1.0-dev \
        libgstreamer-plugins-good1.0-dev \
        gstreamer1.0-plugins-good \
        gstreamer1.0-x \
        gstreamer1.0-libav \
        webp \
        rsync
}

_ensure_folders () {
    mkdir -p /downloads && \
    mkdir -p /builds && \
    chmod a+rw /downloads && \
    chmod a+rw /builds
}

download_official_qt() {
    _ensure_folders && \
    curl -L -o /downloads/qt-installer.run \
               $QT_MIRROR
}

install_official_qt () {
    # XXX: if qt version is changed, Dockerfile should be updated,
    # as well as qt-installer-noninteractive.qs script.
    chmod +x /downloads/qt-installer.run && \
    xvfb-run /downloads/qt-installer.run \
        --script /app/script.qs \
        | egrep -v '\[[0-9]+\] Warning: (Unsupported screen format)|((QPainter|QWidget))' && \
    ls /opt/qt59/ && \
#    cat /opt/qt59/InstallationLog.txt && \
    cat /opt/qt59/components.xml
}


install_qtwebkit () {
    # Install webkit from https://github.com/annulen/webkit
    _ensure_folders && \
    curl -L -o /downloads/qtwebkit.tar.xz https://github.com/annulen/webkit/releases/download/qtwebkit-5.212.0-alpha2/qtwebkit-5.212.0_alpha2-qt59-linux-x64.tar.xz && \
    pushd /builds && \
    tar xvfJ /downloads/qtwebkit.tar.xz --keep-newer-files && \
    rsync -aP /builds/qtwebkit-5.212.0_alpha2-qt59-linux-x64/* `qmake -query QT_INSTALL_PREFIX`
}


install_pyqt5 () {
    _ensure_folders && \
    _activate_venv && \
    ${_PYTHON} --version && \
    curl -L -o /downloads/sip.tar.gz https://sourceforge.net/projects/pyqt/files/sip/sip-${SPLASH_SIP_VERSION}/sip-${SPLASH_SIP_VERSION}.tar.gz && \
    curl -L -o /downloads/pyqt5.tar.gz https://sourceforge.net/projects/pyqt/files/PyQt5/PyQt-${SPLASH_PYQT_VERSION}/PyQt5_gpl-${SPLASH_PYQT_VERSION}.tar.gz && \
#    curl -L -o /downloads/sip.tar.gz https://www.riverbankcomputing.com/static/Downloads/sip/sip-${SPLASH_SIP_VERSION}.tar.gz && \
#    curl -L -o /downloads/pyqt5.tar.gz https://www.riverbankcomputing.com/static/Downloads/PyQt5/PyQt5_gpl-${SPLASH_PYQT_VERSION}.tar.gz && \
    ls -lh /downloads && \
    # TODO: check downloads
    pushd /builds && \
    # SIP
    tar xzf /downloads/sip.tar.gz --keep-newer-files  && \
    pushd sip-${SPLASH_SIP_VERSION}  && \
    ${_PYTHON} configure.py  && \
    make -j ${SPLASH_BUILD_PARALLEL_JOBS} && \
    make install  && \
    popd  && \
    # PyQt5
    tar xzf /downloads/pyqt5.tar.gz --keep-newer-files  && \
    pushd PyQt5_gpl-${SPLASH_PYQT_VERSION}  && \
#        --qmake "${SPLASH_QT_PATH}/bin/qmake" \
    ${_PYTHON} configure.py -c \
        --verbose \
        --confirm-license \
        --no-designer-plugin \
        --no-qml-plugin \
        --no-python-dbus \
        -e QtCore \
        -e QtGui \
        -e QtWidgets \
        -e QtNetwork \
        -e QtWebKit \
        -e QtWebKitWidgets \
        -e QtSvg \
        -e QtPrintSupport && \
    make -j ${SPLASH_BUILD_PARALLEL_JOBS} && \
    make install && \
    popd  && \
    # Builds Complete
    popd
}


install_python_deps(){
    # Install python-level dependencies.
    _activate_venv && \
    ${_PYTHON} -m pip install -U pip setuptools six && \
    ${_PYTHON} -m pip install \
        qt5reactor==0.4 \
        psutil==5.0.0 \
        Twisted==16.1.1 \
        adblockparser==0.7 \
        xvfbwrapper==0.2.9 \
        funcparserlib==0.3.6 \
        Pillow==3.4.2 \
        lupa==1.3 && \
    ${_PYTHON} -m pip install https://github.com/sunu/pyre2/archive/c610be52c3b5379b257d56fc0669d022fd70082a.zip#egg=re2
    ${_PYTHON} -m pip install -r "$APP_ROOT/slybot/requirements.txt"
    ${_PYTHON} -m pip install -r "$APP_ROOT/slyd/requirements.txt"
    ${_PYTHON} -m pip install -r "$APP_ROOT/portia_server/requirements.txt"
}


install_msfonts() {
    # Agree with EULA and install Microsoft fonts
#    apt-add-repository -y "deb http://archive.ubuntu.com/ubuntu xenial multiverse" && \
#    apt-add-repository -y "deb http://archive.ubuntu.com/ubuntu xenial-updates multiverse" && \
#    apt-get update && \
    echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | debconf-set-selections && \
    apt-get install --no-install-recommends -y ttf-mscorefonts-installer
}

install_extra_fonts() {
    # Install extra fonts (Chinese and other)
    apt-get install --no-install-recommends -y \
        fonts-liberation \
        ttf-wqy-zenhei \
        fonts-arphic-gbsn00lp \
        fonts-arphic-bsmi00lp \
        fonts-arphic-gkai00mp \
        fonts-arphic-bkai00mp \
        fonts-beng
}

install_flash () {
    apt-add-repository -y "deb http://archive.ubuntu.com/ubuntu trusty multiverse" && \
    apt-get update && \
    apt-get install -y flashplugin-installer
}

remove_builddeps () {
    # WARNING: only for Docker, don't run blindly!
    # Uninstall build dependencies.
    apt-get remove -y --purge \
        python3-dev \
        libpython3.5-dev \
        libpython3.5 \
        libpython3.5-dev \
        build-essential \
        libre2-dev \
        liblua5.2-dev \
        zlib1g-dev \
        libc-dev \
        libjpeg-turbo8-dev \
        libcurl3 \
        gcc cpp cpp-5 binutils perl rsync && \
    apt-get clean -y
}

remove_extra () {
    # WARNING: only for Docker, don't run blindly!
    # Remove unnecessary files.
    rm -rf \
        /builds \
        /downloads \
        /opt/qt59/Docs \
        /opt/qt59/Tools \
        /opt/qt59/Examples \
        /app/.git \
        /usr/share/man \
        /usr/share/info \
        /usr/share/doc \
        /var/lib/apt/lists/*
}

install_splash(){
    cd /tmp
    curl -L -o splash.tar.gz 'https://github.com/scrapinghub/splash/archive/3.2.x.tar.gz'
    tar -xvf splash.tar.gz --keep-newer-files
    cd splash-*
    _activate_venv
    prepare_install
    install_deps
    install_qtwebkit_deps
    download_official_qt
    install_official_qt
    install_qtwebkit
    install_pyqt5
    install_python_deps
    pip install .
}

configure_nginx(){
    cp -r $APP_ROOT/nginx/* /etc/nginx
    sed 's/\/app\//'""${APP_ROOT//\//\\\/}""'\//g' -i /etc/nginx/nginx.conf
}

configure_initctl(){
    cp "$APP_ROOT/portia.conf" /etc/init
}


migrate_django_db(){
    python /vagrant/portia_server/manage.py migrate
}

start_portia(){
    echo "Starting Nginx"
    echo "=============="
    /etc/init.d/nginx start
    echo "Starting Nginx"
    echo "=============="
    start portia
}

install_frontend_deps() {
    npm install -g bower ember-cli
}

build_assets() {
    cd "$APP_ROOT/portiaui"
    npm install && npm run build
}

if [ \( $# -eq 0 \) -o \( "$1" = "-h" \) -o \( "$1" = "--help" \) ]; then
    usage
    exit 1
fi

UNKNOWN=0
for cmd in "$@"; do
    if [ "$(type -t -- "$cmd")" != "function" ]; then
        echo "Unknown command: $cmd"
        UNKNOWN=1
    fi
done

if [ $UNKNOWN -eq 1 ]; then
    echo "Unknown commands encountered, exiting..."
    exit 1
fi

while [ $# -gt 0 ]; do
    echo "Executing command: $1"
    "$1"
    shift
done

