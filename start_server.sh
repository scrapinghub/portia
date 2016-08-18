#!/bin/bash

echo "Starting slyd service"
echo "====================="
cd /home/ubuntu/portia/slyd && nohup bin/slyd -p 9002 &
sudo /etc/init.d/nginx restart
exit 0
