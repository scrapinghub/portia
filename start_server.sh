#!/bin/bash

echo "Starting slyd service"
echo "====================="
sudo /etc/init.d/nginx restart
sudo /etc/init.d/start_stop start
exit 0
