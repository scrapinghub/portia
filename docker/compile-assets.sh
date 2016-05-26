#!/bin/bash
cd slyd
npm install
bower install
ember build -e production
