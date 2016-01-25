#!/bin/bash
cd slyd
npm install --cache-min 999999
bower install
ember build -e production