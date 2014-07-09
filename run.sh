#!/bin/bash
# this assumes portia is installed under ~/scrapinghub
cd ~/scrapinghub
virtualenv portia
source portia/bin/activate
cd portia/portia/slyd
twistd -n slyd
