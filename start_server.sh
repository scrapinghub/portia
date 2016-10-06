#!/bin/bash

echo "Starting slyd service"
echo "====================="
sudo /etc/init.d/nginx restart
sudo /etc/init.d/categorization_engine start
exit 0
