#!/bin/bash

# Run as root only.
myWHOAMI=$(whoami)
if [ "$myWHOAMI" != "root" ]
  then
    echo "Need to run as root ..."
    exit
fi

myCYBERPOTYMLFILE="/opt/cyberpot/etc/cyberpot.yml"

function fuGENERIC () {
echo
echo "You chose generic, please provide all the details of the broker"
echo
myENABLE="true"
read -p "Host URL: " myHOST
read -p "Port: " myPORT
read -p "Channel: " myCHANNEL
echo "For generic providers set this to 'false'"
echo "If you received a CA certficate mount it into the ewsposter container by modifying $myCYBERPOTYMLFILE"
read -p "TLS - 'false' or path to CA in container: " myCERT
read -p "Ident: " myIDENT
read -p "Secret: " mySECRET
read -p "Format ews (xml) or json: " myFORMAT
}

function fuOPTOUT () {
echo
while [ 1 != 2 ]
  do
    read -s -n 1 -p "You chose to opt out (y/n)? " mySELECT
      echo $mySELECT
      case "$mySELECT" in
        [y,Y])
          echo "Opt out."
          break
          ;;
        [n,N])
          echo "Aborted."
          exit
          ;;
      esac
done
myENABLE="false"
myHOST="host"
myPORT="port"
myCHANNEL="channels"
myCERT="false"
myIDENT="user"
mySECRET="secret"
myFORMAT="json"
}

function fuWRITETOFILE () {
if [ -f '/data/ews/conf/hpfeeds.cfg' ]; then
  echo "Creating backup of current config in /data/ews/conf/hpfeeds.cfg.old"
  mv /data/ews/conf/hpfeeds.cfg /data/ews/conf/hpfeeds.cfg.old
fi
echo "Storing new config in /data/ews/conf/hpfeeds.cfg"
cat >> /data/ews/conf/hpfeeds.cfg <<EOF
myENABLE=$myENABLE
myHOST=$myHOST
myPORT=$myPORT
myCHANNEL=$myCHANNEL
myCERT=$myCERT
myIDENT=$myIDENT
mySECRET=$mySECRET
myFORMAT=$myFORMAT
EOF
}

function fuAPPLY () {
echo "Now stopping CyberPot ..."
systemctl stop cyberpot
echo "Applying your settings to cyberpot.yml ... "
sed --follow-symlinks -i "s/EWS_HPFEEDS_ENABLE.*/EWS_HPFEEDS_ENABLE=${myENABLE}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_HOST.*/EWS_HPFEEDS_HOST=${myHOST}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_PORT.*/EWS_HPFEEDS_PORT=${myPORT}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_CHANNELS.*/EWS_HPFEEDS_CHANNELS=${myCHANNEL}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s#EWS_HPFEEDS_TLSCERT.*#EWS_HPFEEDS_TLSCERT=${myCERT}#g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_IDENT.*/EWS_HPFEEDS_IDENT=${myIDENT}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_SECRET.*/EWS_HPFEEDS_SECRET=${mySECRET}/g" "$myCYBERPOTYMLFILE"
sed --follow-symlinks -i "s/EWS_HPFEEDS_FORMAT.*/EWS_HPFEEDS_FORMAT=${myFORMAT}/g" "$myCYBERPOTYMLFILE"
echo "Now starting CyberPot ..."
systemctl start cyberpot
echo "You can always change or review your settings in /data/ews/conf/hpfeeds.cfg and apply changes by"
echo "running \"./hpfeeds_optin.sh --conf=/data/ews/conf/hpfeeds.cfg\""
echo "Done."
}

# Check for cmdline argument and parse config file
filename=$(echo $@ | cut -d= -f2)
if [ $# == 1 ] && echo $@ | grep '\-\-conf=' > /dev/null && [ ! -z $filename ] && [ -f $filename ]
  then
    source $filename
else

# Proceed with interactive setup when no config file is found
echo "HPFEEDS Delivery Opt-In for CyberPot"
echo "---------------------------------"
echo "By running this script you agree to share your data with a 3rd party and agree to their corresponding sharing terms."
echo
echo
echo "Please choose your broker"
echo "---------------------------"
echo "[1] - Generic (enter details manually)"
echo "[0] - Opt out of HPFEEDS"
echo "[q] - Do not agree end exit"
echo
while [ 1 != 2 ]
  do
    read -s -n 1 -p "Your choice: " mySELECT
      echo $mySELECT
      case "$mySELECT" in
        [1])
	  fuGENERIC
          break
          ;;
        [0])
	  fuOPTOUT
          break
          ;;
        [q,Q])
	  echo "Aborted."
          exit
          ;;
      esac
done

fi
fuWRITETOFILE
fuAPPLY
