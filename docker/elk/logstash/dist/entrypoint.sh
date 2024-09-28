#!/bin/bash

# Let's ensure normal operation on exit or if interrupted ...
function fuCLEANUP {
  exit 0
}
trap fuCLEANUP EXIT

# Source ENVs from file ...
if [ -f "/data/cyberpot/etc/compose/elk_environment" ];
  then
    echo "Found .env, now exporting ..."
    set -o allexport
    source "/data/cyberpot/etc/compose/elk_environment"
    LS_SSL_VERIFICATION="${LS_SSL_VERIFICATION:-full}"
    set +o allexport
fi

# Check internet availability 
function fuCHECKINET () {
mySITES=$1
error=0
for i in $mySITES;
  do
    curl --connect-timeout 5 -Is $i 2>&1 > /dev/null
      if [ $? -ne 0 ];
        then
          let error+=1
      fi;
  done;
  echo $error
}

# Check for connectivity and download latest translation maps
myCHECK=$(fuCHECKINET "listbot.sicherheitstacho.eu")
if [ "$myCHECK" == "0" ];
  then
    echo "Connection to Listbot looks good, now downloading latest translation maps."
    cd /etc/listbot 
    aria2c -s16 -x 16 https://listbot.sicherheitstacho.eu/cve.yaml.bz2 && \
    aria2c -s16 -x 16 https://listbot.sicherheitstacho.eu/iprep.yaml.bz2 && \
    bunzip2 -f *.bz2
    cd /
  else
    echo "Cannot reach Listbot, starting Logstash without latest translation maps."
fi

# Distributed CyberPot installation needs a different pipeline config 
if [ "$CYBERPOT_TYPE" == "SENSOR" ];
  then
    echo
    echo "Distributed CyberPot setup, sending CyberPot logs to $CYBERPOT_HIVE_IP."
    echo
    echo "CyberPot type: $CYBERPOT_TYPE"
    echo "Hive IP: $CYBERPOT_HIVE_IP"
    echo "SSL verification: $LS_SSL_VERIFICATION"
    echo
   # Ensure correct file permissions for private keyfile or SSH will ask for password
    cp /usr/share/logstash/config/pipelines_sensor.yml /usr/share/logstash/config/pipelines.yml
fi

if [ "$CYBERPOT_TYPE" != "SENSOR" ];
  then
    echo
    echo "This is a CyberPot STANDARD / HIVE installation."
    echo
    echo "CyberPot type: $CYBERPOT_TYPE"
    echo

    # Index Management is happening through ILM, but we need to put CyberPot ILM setting on ES.
    myCYBERPOTILM=$(curl -s -XGET "http://elasticsearch:9200/_ilm/policy/cyberpot" | grep "Lifecycle policy not found: cyberpot" -c)
    if [ "$myCYBERPOTILM" == "1" ];
      then
        echo "CyberPot ILM template not found on ES, putting it on ES now."
        curl -XPUT "http://elasticsearch:9200/_ilm/policy/cyberpot" -H 'Content-Type: application/json' -d'
        {
          "policy": {
            "phases": {
              "hot": {
                "min_age": "0ms",
                "actions": {}
              },
              "delete": {
                "min_age": "30d",
                "actions": {
                  "delete": {
                    "delete_searchable_snapshot": true
                  }
                }
              }
            },
            "_meta": {
              "managed": true,
              "description": "CyberPot ILM policy with a retention of 30 days"
            }
          }
        }'
      else
        echo "CyberPot ILM already configured or ES not available."
    fi
fi
echo

exec /usr/share/logstash/bin/logstash --config.reload.automatic
