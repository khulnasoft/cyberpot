#!/bin/bash
# CyberPot Container Data Cleaner & Log Rotator
# Set colors
myRED="[0;31m"
myGREEN="[0;32m"
myWHITE="[0;0m"

# Set pigz
myPIGZ=$(which pigz)

# Set persistence
myPERSISTENCE=$1

# Let's create a function to check if folder is empty
fuEMPTY () {
  local myFOLDER=$1

echo $(ls $myFOLDER | wc -l)
}

# Let's create a function to rotate and compress logs
fuLOGROTATE () {
  local mySTATUS="/data/cyberpot/etc/logrotate/status"
  local myCONF="/opt/cyberpot/etc/logrotate/logrotate.conf"
  local myADBHONEYTGZ="/data/adbhoney/downloads.tgz"
  local myADBHONEYDL="/data/adbhoney/downloads/"
  local myCOWRIETTYLOGS="/data/cowrie/log/tty/"
  local myCOWRIETTYTGZ="/data/cowrie/log/ttylogs.tgz"
  local myCOWRIEDL="/data/cowrie/downloads/"
  local myCOWRIEDLTGZ="/data/cowrie/downloads.tgz"
  local myDIONAEABI="/data/dionaea/bistreams/"
  local myDIONAEABITGZ="/data/dionaea/bistreams.tgz"
  local myDIONAEABIN="/data/dionaea/binaries/"
  local myDIONAEABINTGZ="/data/dionaea/binaries.tgz"
  local myHONEYTRAPATTACKS="/data/honeytrap/attacks/"
  local myHONEYTRAPATTACKSTGZ="/data/honeytrap/attacks.tgz"
  local myHONEYTRAPDL="/data/honeytrap/downloads/"
  local myHONEYTRAPDLTGZ="/data/honeytrap/downloads.tgz"
  local myTANNERF="/data/tanner/files/"
  local myTANNERFTGZ="/data/tanner/files.tgz"

# Ensure correct permissions and ownerships for logrotate to run without issues
chmod 770 /data/ -R
chown cyberpot:cyberpot /data -R
chmod 774 /data/nginx/conf -R
chmod 774 /data/nginx/cert -R

# Run logrotate with force (-f) first, so the status file can be written and race conditions (with tar) be avoided
logrotate -f -s $mySTATUS $myCONF

# Compressing some folders first and rotate them later
if [ "$(fuEMPTY $myADBHONEYDL)" != "0" ]; then tar -I $myPIGZ -cvf $myADBHONEYTGZ $myADBHONEYDL; fi
if [ "$(fuEMPTY $myCOWRIETTYLOGS)" != "0" ]; then tar -I $myPIGZ -cvf $myCOWRIETTYTGZ $myCOWRIETTYLOGS; fi
if [ "$(fuEMPTY $myCOWRIEDL)" != "0" ]; then tar -I $myPIGZ -cvf $myCOWRIEDLTGZ $myCOWRIEDL; fi
if [ "$(fuEMPTY $myDIONAEABI)" != "0" ]; then tar -I $myPIGZ -cvf $myDIONAEABITGZ $myDIONAEABI; fi
if [ "$(fuEMPTY $myDIONAEABIN)" != "0" ]; then tar -I $myPIGZ -cvf $myDIONAEABINTGZ $myDIONAEABIN; fi
if [ "$(fuEMPTY $myHONEYTRAPATTACKS)" != "0" ]; then tar -I $myPIGZ -cvf $myHONEYTRAPATTACKSTGZ $myHONEYTRAPATTACKS; fi
if [ "$(fuEMPTY $myHONEYTRAPDL)" != "0" ]; then tar -I $myPIGZ -cvf $myHONEYTRAPDLTGZ $myHONEYTRAPDL; fi
if [ "$(fuEMPTY $myTANNERF)" != "0" ]; then tar -I $myPIGZ -cvf $myTANNERFTGZ $myTANNERF; fi

# Ensure correct permissions and ownership for previously created archives
chmod 770 $myADBHONEYTGZ $myCOWRIETTYTGZ $myCOWRIEDLTGZ $myDIONAEABITGZ $myDIONAEABINTGZ $myHONEYTRAPATTACKSTGZ $myHONEYTRAPDLTGZ $myTANNERFTGZ
chown cyberpot:cyberpot $myADBHONEYTGZ $myCOWRIETTYTGZ $myCOWRIEDLTGZ $myDIONAEABITGZ $myDIONAEABINTGZ $myHONEYTRAPATTACKSTGZ $myHONEYTRAPDLTGZ $myTANNERFTGZ

# Need to remove subfolders since too many files cause rm to exit with errors
rm -rf $myADBHONEYDL $myCOWRIETTYLOGS $myCOWRIEDL $myDIONAEABI $myDIONAEABIN $myHONEYTRAPATTACKS $myHONEYTRAPDL $myTANNERF

# Recreate subfolders with correct permissions and ownership
mkdir -p $myADBHONEYDL $myCOWRIETTYLOGS $myCOWRIEDL $myDIONAEABI $myDIONAEABIN $myHONEYTRAPATTACKS $myHONEYTRAPDL $myTANNERF
chmod 770 $myADBHONEYDL $myCOWRIETTYLOGS $myCOWRIEDL $myDIONAEABI $myDIONAEABIN $myHONEYTRAPATTACKS $myHONEYTRAPDL $myTANNERF
chown cyberpot:cyberpot $myADBHONEYDL $myCOWRIETTYLOGS $myCOWRIEDL $myDIONAEABI $myDIONAEABIN $myHONEYTRAPATTACKS $myHONEYTRAPDL $myTANNERF

# Run logrotate again to account for previously created archives - DO NOT FORCE HERE!
logrotate -s $mySTATUS $myCONF
}

# Let's create a function to clean up and prepare cyberpotinit data
fuCYBERPOTINIT () {
  mkdir -vp /data/ews/conf \
            /data/cyberpot/etc/{compose,logrotate} \
            /tmp/etc/
  chmod 770 /data/ews/ -R
  chmod 770 /data/cyberpot/ -R
  chmod 770 /tmp/etc/ -R
  chown cyberpot:cyberpot /data/ews/ -R
  chown cyberpot:cyberpot /data/cyberpot/ -R
  chown cyberpot:cyberpot /tmp/etc/ -R
}

# Let's create a function to clean up and prepare honeytrap data
fuADBHONEY () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/adbhoney/*; fi
  mkdir -vp /data/adbhoney/{downloads,log}
  chmod 770 /data/adbhoney/ -R
  chown cyberpot:cyberpot /data/adbhoney/ -R
}

# Let's create a function to clean up and prepare ciscoasa data
fuCISCOASA () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/ciscoasa/*; fi
  mkdir -vp /data/ciscoasa/log
  chmod 770 /data/ciscoasa -R
  chown cyberpot:cyberpot /data/ciscoasa -R
}

# Let's create a function to clean up and prepare citrixhoneypot data
fuCITRIXHONEYPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/citrixhoneypot/*; fi
  mkdir -vp /data/citrixhoneypot/log/
  chmod 770 /data/citrixhoneypot/ -R
  chown cyberpot:cyberpot /data/citrixhoneypot/ -R
}

# Let's create a function to clean up and prepare conpot data
fuCONPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/conpot/*; fi
  mkdir -vp /data/conpot/log
  chmod 770 /data/conpot -R
  chown cyberpot:cyberpot /data/conpot -R
}

# Let's create a function to clean up and prepare cowrie data
fuCOWRIE () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/cowrie/*; fi
  mkdir -vp /data/cowrie/{downloads,keys,misc,log,log/tty}
  chmod 770 /data/cowrie -R
  chown cyberpot:cyberpot /data/cowrie -R
}

# Let's create a function to clean up and prepare ddospot data
fuDDOSPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/ddospot/log; fi
  mkdir -vp /data/ddospot/{bl,db,log}
  chmod 770 /data/ddospot -R
  chown cyberpot:cyberpot /data/ddospot -R
}

# Let's create a function to clean up and prepare dicompot data
fuDICOMPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/dicompot/log; fi
  mkdir -vp /data/dicompot/{images,log}
  chmod 770 /data/dicompot -R
  chown cyberpot:cyberpot /data/dicompot -R
}

# Let's create a function to clean up and prepare dionaea data
fuDIONAEA () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/dionaea/*; fi
  mkdir -vp /data/dionaea/{log,bistreams,binaries,rtp,roots,roots/ftp,roots/tftp,roots/www,roots/upnp}
  touch /data/dionaea/dionaea-errors.log
  touch /data/dionaea/sipaccounts.sqlite
  touch /data/dionaea/sipaccounts.sqlite-journal
  touch /data/dionaea/log/dionaea.json
  touch /data/dionaea/log/dionaea.sqlite
  chmod 770 /data/dionaea -R
  chown cyberpot:cyberpot /data/dionaea -R
}

# Let's create a function to clean up and prepare elasticpot data
fuELASTICPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/elasticpot/*; fi
  mkdir -vp /data/elasticpot/log
  chmod 770 /data/elasticpot -R
  chown cyberpot:cyberpot /data/elasticpot -R
}

# Let's create a function to clean up and prepare elk data
fuELK () {
  # ELK data will be kept for <= 90 days, check /etc/crontab for curator modification
  # ELK daemon log files will be removed
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/elk/log/*; fi
  mkdir -vp /data/elk/{data,log}
  chmod 770 /data/elk -R
  chown cyberpot:cyberpot /data/elk -R
}

# Let's create a function to clean up and prepare endlessh data
fuENDLESSH () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/endlessh/log; fi
  mkdir -vp /data/endlessh/log
  chmod 770 /data/endlessh -R
  chown cyberpot:cyberpot /data/endlessh -R
}

# Let's create a function to clean up and prepare fatt data
fuFATT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/fatt/*; fi
  mkdir -vp /data/fatt/log
  chmod 770 -R /data/fatt
  chown cyberpot:cyberpot -R /data/fatt
}

# Let's create a function to clean up and prepare glastopf data
fuGLUTTON () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/glutton/*; fi
  mkdir -vp /data/glutton/{log,payloads}
  chmod 770 /data/glutton -R
  chown cyberpot:cyberpot /data/glutton -R
}

# Let's create a function to clean up and prepare hellpot data
fuHELLPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/hellpot/log; fi
  mkdir -vp /data/hellpot/log
  chmod 770 /data/hellpot -R
  chown cyberpot:cyberpot /data/hellpot -R
}

# Let's create a function to clean up and prepare heralding data
fuHERALDING () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/heralding/*; fi
  mkdir -vp /data/heralding/log
  chmod 770 /data/heralding -R
  chown cyberpot:cyberpot /data/heralding -R
}

# Let's create a function to clean up and prepare honeypots data
fuHONEYPOTS () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/honeypots/*; fi
  mkdir -vp /data/honeypots/log
  chmod 770 /data/honeypots -R
  chown cyberpot:cyberpot /data/honeypots -R
}

# Let's create a function to clean up and prepare honeysap data
fuHONEYSAP () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/honeysap/*; fi
  mkdir -vp /data/honeysap/log
  chmod 770 /data/honeysap -R
  chown cyberpot:cyberpot /data/honeysap -R
}

# Let's create a function to clean up and prepare honeytrap data
fuHONEYTRAP () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/honeytrap/*; fi
  mkdir -vp /data/honeytrap/{log,attacks,downloads}
  chmod 770 /data/honeytrap/ -R
  chown cyberpot:cyberpot /data/honeytrap/ -R
}

# Let's create a function to clean up and prepare ipphoney data
fuIPPHONEY () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/ipphoney/*; fi
  mkdir -vp /data/ipphoney/log
  chmod 770 /data/ipphoney -R
  chown cyberpot:cyberpot /data/ipphoney -R
}

# Let's create a function to clean up and prepare log4pot data
fuLOG4POT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/log4pot/*; fi
  mkdir -vp /data/log4pot/{log,payloads}
  chmod 770 /data/log4pot -R
  chown cyberpot:cyberpot /data/log4pot -R
}

# Let's create a function to clean up and prepare mailoney data
fuMAILONEY () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/mailoney/*; fi
  mkdir -vp /data/mailoney/log/
  chmod 770 /data/mailoney/ -R
  chown cyberpot:cyberpot /data/mailoney/ -R
}

# Let's create a function to clean up and prepare mailoney data
fuMEDPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/medpot/*; fi
  mkdir -vp /data/medpot/log/
  chmod 770 /data/medpot/ -R
  chown cyberpot:cyberpot /data/medpot/ -R
}

# Let's create a function to clean up nginx logs
fuNGINX () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/nginx/log/*; fi
  mkdir -vp /data/nginx/{cert,conf,log}
  touch /data/nginx/log/error.log
  chmod 774 /data/nginx/conf -R
  chmod 774 /data/nginx/cert -R
  chown cyberpot:cyberpot /data/nginx -R
}

# Let's create a function to clean up and prepare redishoneypot data
fuREDISHONEYPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/redishoneypot/log; fi
  mkdir -vp /data/redishoneypot/log
  chmod 770 /data/redishoneypot -R
  chown cyberpot:cyberpot /data/redishoneypot -R
}

# Let's create a function to clean up and prepare sentrypeer data
fuSENTRYPEER () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/sentrypeer/log; fi
  mkdir -vp /data/sentrypeer/log
  chmod 770 /data/sentrypeer -R
  chown cyberpot:cyberpot /data/sentrypeer -R
}

# Let's create a function to prepare spiderfoot db
fuSPIDERFOOT () {
  mkdir -vp /data/spiderfoot
  touch /data/spiderfoot/spiderfoot.db
  chmod 770 -R /data/spiderfoot
  chown cyberpot:cyberpot -R /data/spiderfoot
}

# Let's create a function to clean up and prepare suricata data
fuSURICATA () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/suricata/*; fi
  mkdir -vp /data/suricata/log
  chmod 770 -R /data/suricata
  chown cyberpot:cyberpot -R /data/suricata
}

# Let's create a function to clean up and prepare p0f data
fuP0F () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/p0f/*; fi
  mkdir -vp /data/p0f/log
  chmod 770 -R /data/p0f
  chown cyberpot:cyberpot -R /data/p0f
}

# Let's create a function to clean up and prepare p0f data
fuTANNER () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/tanner/*; fi
  mkdir -vp /data/tanner/{log,files}
  chmod 770 -R /data/tanner
  chown cyberpot:cyberpot -R /data/tanner
}

# Let's create a function to clean up and prepare wordpot data
fuWORDPOT () {
  if [ "$myPERSISTENCE" != "on" ]; then rm -rf /data/wordpot/log; fi
  mkdir -vp /data/wordpot/log
  chmod 770 /data/wordpot -R
  chown cyberpot:cyberpot /data/wordpot -R
}

# Avoid unwanted cleaning
if [ "$myPERSISTENCE" = "" ];
  then
    echo $myRED"!!! WARNING !!! - This will delete ALL honeypot logs. "$myWHITE
    while [ "$myQST" != "y" ] && [ "$myQST" != "n" ];
      do
        read -p "Continue? (y/n) " myQST
    done
    if [ "$myQST" = "n" ];
      then
        echo $myGREEN"Puuh! That was close! Aborting!"$myWHITE
        exit
    fi
fi

# Check persistence, if enabled compress and rotate logs
if [ "$myPERSISTENCE" = "on" ];
  then
    echo "Persistence enabled, now rotating and compressing logs."
    fuLOGROTATE
fi

echo  
echo "Checking and preparing data folders."
fuCYBERPOTINIT
fuADBHONEY
fuCISCOASA
fuCITRIXHONEYPOT
fuCONPOT
fuCOWRIE
fuDDOSPOT
fuDICOMPOT
fuDIONAEA
fuELASTICPOT
fuELK
fuENDLESSH
fuFATT
fuGLUTTON
fuHERALDING
fuHELLPOT
fuHONEYSAP
fuHONEYPOTS
fuHONEYTRAP
fuIPPHONEY
fuLOG4POT
fuMAILONEY
fuMEDPOT
fuNGINX
fuREDISHONEYPOT
fuSENTRYPEER
fuSPIDERFOOT
fuSURICATA
fuP0F
fuTANNER
fuWORDPOT
