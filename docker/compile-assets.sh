#!/bin/bash
cd portiaui
npm install
bower install
ember build -e production
