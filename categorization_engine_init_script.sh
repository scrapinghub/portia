#!/bin/sh

# Quick start-stop-daemon example, derived from Debian /etc/init.d/ssh
set -e

# Must be a valid filename
NAME=slyd
PIDFILE=/home/ubuntu/portia/$NAME.pid
echo $PIDFILE
#This is the command to be run, give the full pathname
DAEMON=/home/ubuntu/portia/slyd/bin/slyd
DAEMON_OPTS="-p=9002 -r=/home/ubuntu/portia/slyd/dist"

export PATH="${PATH:+$PATH:}/usr/sbin:/sbin"

case "$1" in
  start)
        echo -n "Starting daemon: "$NAME
        start-stop-daemon --start --quiet --make-pidfile --pidfile $PIDFILE --background --exec $DAEMON -- $DAEMON_OPTS > /var/log/slyd.log 2>&1
        echo "."
        ;;
  stop)
        echo -n "Stopping daemon: "$NAME
        start-stop-daemon --stop --quiet --oknodo --pidfile $PIDFILE
        echo "."
        ;;
  restart)
        echo -n "Restarting daemon: "$NAME
        start-stop-daemon --stop --quiet --oknodo --retry 30 --pidfile $PIDFILE
        start-stop-daemon --start --quiet --pidfile $PIDFILE --exec $DAEMON -- $DAEMON_OPTS
        echo "."
        ;;

  *)
        echo "Usage: "$1" {start|stop|restart}"
        exit 1
esac

exit 0
