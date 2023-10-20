#!/bin/ash

# Source ENVs from file ...
if [ -f "/data/cyberpot/etc/compose/elk_environment" ];
  then
    echo "Found .env, now exporting ..."
    set -o allexport && source "/data/cyberpot/etc/compose/elk_environment" && set +o allexport
fi

exec /usr/bin/python3 -u /opt/ewsposter/ews.py -l $(shuf -i 10-60 -n 1)
