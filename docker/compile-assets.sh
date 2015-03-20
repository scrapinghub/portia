#!/bin/bash
cd slyd
npm install --cache-min 999999
bower install --allow-root
ember build -e production