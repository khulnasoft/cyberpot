#!/bin/bash

# Run as root only.
myWHOAMI=$(whoami)
if [ "$myWHOAMI" != "root" ]
  then
    echo "Need to run as root ..."
    exit
fi

# set backtitle, get filename
myBACKTITLE="CyberPot Edition Selection Tool"
myYMLS=$(cd /opt/cyberpot/etc/compose/ && ls -1 *.yml)
myLINK="/opt/cyberpot/etc/cyberpot.yml"

# Let's load docker images in parallel
function fuPULLIMAGES {
local myCYBERPOTCOMPOSE="/opt/cyberpot/etc/cyberpot.yml"
for name in $(cat $myCYBERPOTCOMPOSE | grep -v '#' | grep image | cut -d'"' -f2 | uniq)
  do
    docker pull $name &
  done
wait
echo
}

# setup menu
for i in $myYMLS;
  do
    myITEMS+="$i $(echo $i | cut -d "." -f1 | tr [:lower:] [:upper:]) " 
done
myEDITION=$(dialog --backtitle "$myBACKTITLE" --menu "Select CyberPot Edition" 18 50 1 $myITEMS 3>&1 1>&2 2>&3 3>&-)
if [ "$myEDITION" == "" ];
  then
    echo "Have a nice day!"
    exit
fi
dialog --backtitle "$myBACKTITLE" --title "[ Activate now? ]" --yesno "\n$myEDITION" 7 50
myOK=$?
if [ "$myOK" == "0" ];
  then
    echo "OK - Activating and downloading latest images."
    systemctl stop cyberpot
    if [ "$(docker ps -aq)" != "" ];
      then
        docker stop $(docker ps -aq)
        docker rm $(docker ps -aq)
    fi
    rm -f $myLINK
    ln -s /opt/cyberpot/etc/compose/$myEDITION $myLINK
    fuPULLIMAGES
    systemctl start cyberpot
    echo "Done. Use \"dps.sh\" for monitoring"
  else 
    echo "Have a nice day!"
fi
