#!/bin/bash
# this assumes portia is installed over './portia' folder
source portia/bin/activate
cd portia/portia/slyd
twistd -n slyd
