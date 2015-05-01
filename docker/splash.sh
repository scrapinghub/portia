# Add required packages for splash
add-apt-repository -y ppa:pi-rho/security
apt-get update -qq
apt-get install -qy --no-install-recommends netbase \
                    ca-certificates \
                    xvfb \
                    pkg-config \
                    libqt4-webkit \
                    python-qt4 \
                    libre2 libre2-dev \
                    libicu48 \
                    zlib1g zlib1g-dev \
                    liblua5.2 liblua5.2-dev

# Install python dependencies
pip install --no-cache-dir \
        Twisted==15.1.0 \
        qt4reactor==1.6 \
        psutil==2.2.1 \
        adblockparser==0.4 \
        https://github.com/axiak/pyre2/archive/master.zip#egg=re2 \
        xvfbwrapper==0.2.4 \
        lupa==1.1 \
        funcparserlib==0.3.6 \
        Pillow==2.8.1

# Remove additional installed packages and files to reduce container size
# apt-get remove -y --purge \
#         libre2-dev \
#         liblua5.2-dev \
#         zlib1g-dev \
#         perl && \
#     apt-get autoremove -y && \
#     apt-get clean -y && \
# rm -rf /usr/share/perl \
#        /usr/share/perl5 \
#        /usr/share/man \
#        /usr/share/info \
#        /usr/share/doc