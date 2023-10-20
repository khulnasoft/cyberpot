#!/bin/bash

# Some global vars
myCONFIGFILE="/opt/cyberpot/etc/cyberpot.yml"
myCOMPOSEPATH="/opt/cyberpot/etc/compose"
myLSB_RELEASE=("bullseye" "bookworm")
myRED="[0;31m"
myGREEN="[0;32m"
myWHITE="[0;0m"
myBLUE="[0;34m"

# Check for existing cyberpot.yml
function fuCONFIGCHECK () {
  echo
  echo "### Checking for CyberPot configuration file ..."
  if ! [ -L $myCONFIGFILE ];
    then
      echo -n "###### $myBLUE$myCONFIGFILE$myWHITE "
      myFILE=$(head -n 1 $myCONFIGFILE | tr -d "()" | tr [:upper:] [:lower:] | awk '{ print $3 }')
      myFILE+=".yml"
      echo "[ $myRED""NOT OK""$myWHITE ] - Broken symlink, trying to reset to '$myFILE'."
      rm -rf $myCONFIGFILE
      ln -s $myCOMPOSEPATH/$myFILE $myCONFIGFILE
  fi
  if [ -L $myCONFIGFILE ];
    then
      echo "###### $myBLUE$myCONFIGFILE$myWHITE [ $myGREEN""OK""$myWHITE ]"
    else
      echo "[ $myRED""NOT OK""$myWHITE ] - Broken symlink and / or restore failed."
      echo "Please create a link to your desired config i.e. 'ln -s /opt/cyberpot/etc/compose/standard.yml /opt/cyberpot/etc/cyberpot.yml'."
      exit
  fi
echo
}

# Let's test the internet connection
function fuCHECKINET () {
mySITES=$1
  echo
  echo "### Now checking availability of ..."
  for i in $mySITES;
    do
      echo -n "###### $myBLUE$i$myWHITE "
      curl --connect-timeout 5 -IsS $i 2>&1>/dev/null
        if [ $? -ne 0 ];
          then
	    echo
            echo "###### $myBLUE""Error - Internet connection test failed.""$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
            echo "Exiting.""$myWHITE"
            echo
            exit 1
          else
            echo "[ $myGREEN"OK"$myWHITE ]"
        fi
  done;
echo
}

# Update
function fuSELFUPDATE () {
  echo
  echo "### Now checking for newer files in repository ..."
  git fetch --all
  myREMOTESTAT=$(git status | grep -c "up-to-date")
  if [ "$myREMOTESTAT" != "0" ];
    then
      echo "###### $myBLUE""No updates found in repository.""$myWHITE"
      return
  fi
  ### DEV
  myRESULT=$(git diff --name-only origin/master | grep "^update.sh")
  if [ "$myRESULT" == "update.sh" ];
    then
      echo "###### $myBLUE""Found newer version, will be pulling updates and restart myself.""$myWHITE"
      git reset --hard
      git pull --force
      exec ./update.sh -y
      exit 1
    else
      echo "###### $myBLUE""Pulling updates from repository.""$myWHITE"
      git reset --hard
      git pull --force
  fi
echo
}

# Let's check for version, upgrade to Debian 11
function fuCHECK_VERSION () {
local myMINVERSION="22.04.0"
local myMASTERVERSION="22.04.0"
echo
echo "### Checking for Release ID"
myRELEASE=$(lsb_release -c | awk '{ print $2 }')
if [[ ! " ${myLSB_RELEASE[@]} " =~ " ${myRELEASE} " ]]; 
  then
    echo "###### Need to upgrade to Debian 11 (Bullseye) first:$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
    echo "###### Upgrade may result in complete data loss and should not be run via SSH."
    echo "###### If you installed CyberPot using the post-install method instead of the ISO it is recommended you upgrade manually to Debian 11 (Bullseye) and then re-run update.sh."
    echo "###### Do you want to upgrade to Debian 11 (Bullseye) now?"
    while [ "$myQST" != "y" ] && [ "$myQST" != "n" ];
      do
        read -p "Upgrade? (y/n) " myQST
      done
    if [ "$myQST" = "n" ];
      then
        echo
        echo $myGREEN"Aborting!"$myWHITE
        echo
        exit
      else
        echo "###### Stopping and disabling CyberPot services ... "
        echo
        systemctl stop cyberpot
        systemctl disable cyberpot
        systemctl stop docker
        systemctl start docker
        docker stop $(docker ps -aq)
        docker rm -v $(docker ps -aq)
        echo "###### Switching /etc/apt/sources.list from buster to bullseye ... "
        echo
        sed -i 's/buster/bullseye/g' /etc/apt/sources.list
        echo "###### Updating repositories ... "
        echo
        apt-fast update
        export DEBIAN_FRONTEND=noninteractive
        echo "###### Running full upgrade ... "
        echo
        echo "docker.io docker.io/restart       boolean true" | debconf-set-selections -v
        echo "ssh ssh/restart		       	boolean true" | debconf-set-selections -v
        echo "cron cron/restart			boolean true" | debconf-set-selections -v
        echo "debconf debconf/frontend select noninteractive" | debconf-set-selections -v
        apt-fast full-upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --force-yes
        dpkg --configure -a
        echo "###### $myBLUE""Finished with upgrading. Now restarting update.sh and to continue with CyberPot related updates.""$myWHITE"
        exec ./update.sh -y
        exit 1
    fi
fi
echo
echo "### Checking for version tag ..."
if [ -f "version" ];
  then
    myVERSION=$(cat version)
    if [[ "$myVERSION" > "$myMINVERSION" || "$myVERSION" == "$myMINVERSION" ]] && [[ "$myVERSION" < "$myMASTERVERSION" || "$myVERSION" == "$myMASTERVERSION" ]]
      then
        echo "###### $myBLUE$myVERSION is eligible for the update procedure.$myWHITE"" [ $myGREEN""OK""$myWHITE ]"
      else
        echo "###### $myBLUE $myVERSION cannot be upgraded automatically. Please run a fresh install.$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
	exit
    fi
  else
    echo "###### $myBLUE""Unable to determine version. Please run 'update.sh' from within '/opt/cyberpot'.""$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
    exit
  fi
echo
}

# Stop CyberPot to avoid race conditions with running containers with regard to the current CyberPot config
function fuSTOP_CYBERPOT () {
echo
echo "### Need to stop CyberPot ..."
echo -n "###### $myBLUE Now stopping CyberPot.$myWHITE "
systemctl stop cyberpot
if [ $? -ne 0 ];
  then
    echo " [ $myRED""NOT OK""$myWHITE ]"
    echo "###### $myBLUE""Could not stop CyberPot.""$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
    echo "Exiting.""$myWHITE"
    echo
    exit 1
  else
    echo "[ $myGREEN"OK"$myWHITE ]"
    echo "###### $myBLUE Now disabling CyberPot service.$myWHITE "
    systemctl disable cyberpot
    echo "###### $myBLUE Now cleaning up containers.$myWHITE "
    if [ "$(docker ps -aq)" != "" ];
      then
        docker stop $(docker ps -aq)
        docker rm $(docker ps -aq)
    fi
fi
echo
}

# Backup
function fuBACKUP () {
local myARCHIVE="/root/$(date +%Y%m%d%H%M)_cyberpot_backup.tgz"
local myPATH=$PWD
echo
echo "### Create a backup, just in case ... "
echo -n "###### $myBLUE Building archive in $myARCHIVE $myWHITE"
cd /opt/cyberpot
tar cvfz $myARCHIVE * 2>&1>/dev/null
if [ $? -ne 0 ];
  then
    echo " [ $myRED""NOT OK""$myWHITE ]"
    echo "###### $myBLUE""Something went wrong.""$myWHITE"" [ $myRED""NOT OK""$myWHITE ]"
    echo "Exiting.""$myWHITE"
    echo
    cd $myPATH
    exit 1
  else
    echo "[ $myGREEN"OK"$myWHITE ]"
    cd $myPATH
fi
echo
}

# Remove old images for specific tag
function fuREMOVEOLDIMAGES () {
local myOLDTAG=$1
local myOLDIMAGES=$(docker images | grep -c "$myOLDTAG")
if [ "$myOLDIMAGES" -gt "0" ];
  then
    echo
    echo "### Removing old docker images."
    docker rmi $(docker images | grep "$myOLDTAG" | awk '{print $3}')
fi
}

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

function fuUPDATER () {
export DEBIAN_FRONTEND=noninteractive
echo
echo "### Installing apt-fast"
/bin/bash -c "$(curl -sL https://raw.githubusercontent.com/ilikenwf/apt-fast/master/quick-install.sh)"
local myPACKAGES=$(cat /opt/cyberpot/packages.txt)
echo
echo "### Removing and holding back problematic packages ..."
apt-fast -y --allow-change-held-packages purge cockpit-pcp elasticsearch-curator exim4-base mailutils ntp pcp
apt-mark hold exim4-base mailutils ntp pcp cockpit-pcp
hash -r
echo
echo "### Now upgrading packages ..."
dpkg --configure -a
apt-fast -y autoclean
apt-fast -y autoremove
apt-fast update
apt-fast -y install $myPACKAGES

# Some updates require interactive attention, and the following settings will override that.
echo "docker.io docker.io/restart       boolean true" | debconf-set-selections -v
echo "debconf debconf/frontend select noninteractive" | debconf-set-selections -v
apt-fast -y dist-upgrade -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --force-yes
dpkg --configure -a
npm cache clean --force
npm install elasticdump -g
pip3 install --upgrade glances[docker] yq
hash -r
echo
echo "### Now replacing CyberPot related config files on host"
cp host/etc/systemd/* /etc/systemd/system/
systemctl daemon-reload

# Ensure some defaults
echo
echo "### Ensure some CyberPot defaults with regard to some folders, permissions and configs."
sed -i '/^port/I,$d' /etc/ssh/sshd_config
tee -a /etc/ssh/sshd_config << EOF
Port 64295
Match Group cyberpotlogs
        PermitOpen 127.0.0.1:64305
        ForceCommand /usr/bin/false
EOF

### Ensure creation of CyberPot related folders, just in case
mkdir -vp /data/adbhoney/{downloads,log} \
          /data/ciscoasa/log \
          /data/conpot/log \
          /data/citrixhoneypot/logs \
          /data/cowrie/{downloads,keys,misc,log,log/tty} \
          /data/ddospot/{bl,db,log} \
          /data/dicompot/{images,log} \
          /data/dionaea/{log,bistreams,binaries,rtp,roots,roots/ftp,roots/tftp,roots/www,roots/upnp} \
          /data/elasticpot/log \
          /data/elk/{data,log} \
          /data/endlessh/log \
          /data/ews/conf \
          /data/fatt/log \
          /data/glutton/log \
          /data/hellpot/log \
          /data/heralding/log \
          /data/honeypots/log \
          /data/honeysap/log \
          /data/honeytrap/{log,attacks,downloads} \
          /data/ipphoney/log \
          /data/log4pot/{log,payloads} \
          /data/mailoney/log \
          /data/medpot/log \
          /data/nginx/{log,heimdall} \
          /data/p0f/log \
          /data/redishoneypot/log \
          /data/sentrypeer/log \
          /data/spiderfoot \
          /data/suricata/log \
          /data/tanner/{log,files} \
          /home/tsec/.ssh/

### Let's take care of some files and permissions
chmod 770 -R /data
chown cyberpot:cyberpot -R /data
chmod 644 -R /data/nginx/conf
chmod 644 -R /data/nginx/cert

echo
echo "### Now pulling latest docker images ..."
echo "######$myBLUE This might take a while, please be patient!$myWHITE"
fuPULLIMAGES 2>&1>/dev/null

fuREMOVEOLDIMAGES "2006"

echo
echo "### Copying CyberPot service to systemd."
cp /opt/cyberpot/host/etc/systemd/cyberpot.service /etc/systemd/system/
systemctl enable cyberpot

echo
echo "### If you made changes to cyberpot.yml please ensure to add them again."
echo "### We stored the previous version as backup in /root/."
echo "### Some updates may need an import of the latest Kibana objects as well."
echo "### Download the latest objects here if they recently changed:"
echo "### https://raw.githubusercontent.com/telekom-security/cyberpotce/master/etc/objects/kibana_export.ndjson.zip"
echo "### Export and import the objects easily through the Kibana WebUI:"
echo "### Go to Kibana > Management > Saved Objects > Export / Import"
echo
}

function fuRESTORE_EWSCFG () {
if [ -f '/data/ews/conf/ews.cfg' ] && ! grep 'ews.cfg' $myCONFIGFILE > /dev/null; then
    echo
    echo "### Restoring volume mount for ews.cfg in cyberpot.yml"
    sed -i --follow-symlinks '/\/opt\/ewsposter\/ews.ip/a\\ \ \ \ \ - /data/ews/conf/ews.cfg:/opt/ewsposter/ews.cfg' $myCONFIGFILE
fi
}

function fuRESTORE_HPFEEDS () {
if [ -f '/data/ews/conf/hpfeeds.cfg' ]; then
    echo
    echo "### Restoring HPFEEDS in cyberpot.yml"
    ./bin/hpfeeds_optin.sh --conf=/data/ews/conf/hpfeeds.cfg
fi
}


################
# Main section #
################

# Got root?
myWHOAMI=$(whoami)
if [ "$myWHOAMI" != "root" ]
  then
    echo
    echo "Need to run as root ..."
    echo
    exit
fi

# Only run with command switch
if [ "$1" != "-y" ]; then
  echo
  echo "This script will update / upgrade all CyberPot related scripts, tools and packages to the latest versions."
  echo "A backup of /opt/cyberpot will be written to /root. If you are unsure, you should save your work."
  echo "This is a beta feature and only recommended for experienced users."
  echo "If you understand the involved risks feel free to run this script with the '-y' switch."
  echo
  exit
fi

fuCHECK_VERSION
fuCONFIGCHECK
fuCHECKINET "https://index.docker.io https://github.com https://pypi.python.org https://debian.org"
fuSTOP_CYBERPOT
fuBACKUP
fuSELFUPDATE "$0" "$@"
fuUPDATER
fuRESTORE_EWSCFG
fuRESTORE_HPFEEDS

echo
echo "### Done. Please reboot."
echo
