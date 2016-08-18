#!/bin/bash

aws s3 sync /home/ubuntu/portia/slyd/slyd/data s3://alc-rm-categorization-engine-portia-projects/$CATEGORIZATION_ENGINE_ENV
