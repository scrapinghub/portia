#!/bin/bash

echo "Starting slyd service"
echo "====================="
sudo /etc/init.d/nginx restart
cd /home/ubuntu/portia/slyd && bin/slyd -p 9002 > /dev/null 2>&1 &
exit 0
