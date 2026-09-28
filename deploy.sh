#!/usr/bin/env bash

myANSIBLE_PORT=64295
myANSIBLE_CYBERPOT_PLAYBOOK="installer/install/deploy.yml"
myADJECTIVE=$(shuf -n1 installer/install/a.txt)
myNOUN=$(shuf -n1 installer/install/n.txt)
myENV_FILE="$HOME/cyberpot/.env"

myDEPLOY=$(cat << "EOF"

 ____   [ CyberPot ]                  ____             _
/ ___|  ___ _ __  ___  ___  _ __  |  _ \  ___ _ __ | | ___  _   _
\___ \ / _ \  _ \/ __|/ _ \|  __| | | | |/ _ \  _ \| |/ _ \| | | |
 ___) |  __/ | | \__ \ (_) | |    | |_| |  __/ |_) | | (_) | |_| |
|____/ \___|_| |_|___/\___/|_|    |____/ \___| .__/|_|\___/ \__, |
                                             |_|            |___/

EOF
)

# Check if the script is running in a HIVE installation
if ! grep -q 'CYBERPOT_TYPE=HIVE' "$HOME/cyberpot/.env";
  then
    echo "# This script is only supported on HIVE installations."
    echo
    exit 1
fi

# Check if running on a supported distribution
mySUPPORTED_DISTRIBUTIONS=("AlmaLinux" "Debian GNU/Linux" "Fedora Linux" "openSUSE Tumbleweed" "Raspbian GNU/Linux" "Rocky Linux" "Ubuntu")
myCURRENT_DISTRIBUTION=$(awk -F= '/^NAME/{print $2}' /etc/os-release | tr -d '"')

if [[ ! " ${mySUPPORTED_DISTRIBUTIONS[@]} " =~ " ${myCURRENT_DISTRIBUTION} " ]];
  then
    echo "# Only the following distributions are supported: AlmaLinux, Fedora, Debian, openSUSE Tumbleweed, Rocky Linux and Ubuntu."
    echo
    exit 1
fi

echo "${myDEPLOY}"
echo
echo "# This script will prepare a CyberPot SENSOR installation to transmit logs into this HIVE."
echo

# Ask if a CyberPot SENSOR was installed
read -p "# Was a CyberPot SENSOR installed? (y/n): " mySENSOR_INSTALLED
if [[ ${mySENSOR_INSTALLED} != "y" ]]; 
    then
      echo "# A CyberPot SENSOR must be installed to continue."
      exit 1
fi

# Ask for the remote user
read -p "# Enter the remote username CyberPot SENSOR was installed with: " mySSHUSER
if [[ ${mySSHUSER} == "" ]]; 
    then
      echo "# You need to enter a user. Aborting."
      exit 1
fi

# Validate IP/domain name loop
while true; do
  read -p "# Enter the IP/domain name of the SENSOR: " mySENSOR_IP
  if [[ ${mySENSOR_IP} =~ ^([a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,})|(([0-9]{1,3}\.){3}[0-9]{1,3})$ ]];
    then
      break
    else
      echo "# Invalid IP/domain. Please enter a valid IP or domain name."
  fi
done

# Check if ssh key has been deployed
read -p "# Has a SSH key been deployed to the SENSOR? (y/n): " mySSHKEY_DEPLOYED
if [[ ${mySSHKEY_DEPLOYED} != "y" ]]; 
    then
      echo "# Generate a SSH key using 'ssh-keygen' and deploy it to the SENSOR (Example: ssh-copy-id -p 64295 ${mySSHUSER}@${mySENSOR_IP})."
      exit 1
fi

# Validate IP/domain name of HIVE
while true; do
  read -p "# Enter the IP/domain name of this HIVE: " myCYBERPOT_HIVE_IP
  if [[ ${myCYBERPOT_HIVE_IP} =~ ^([a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,})|(([0-9]{1,3}\.){3}[0-9]{1,3})$ ]]; 
    then
      break
    else
      echo "# Invalid IP/domain. Please enter a valid IP or domain name."
  fi
done

# Create a random SENSOR user name that is easily readable
myLS_WEB_USER="sensor-${myADJECTIVE}-${myNOUN}"

# Create a random password
myLS_WEB_PW=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 32 | head -n 1)

# Create myLS_WEB_USER_ENC
myLS_WEB_USER_ENC=$(htpasswd -b -n "${myLS_WEB_USER}" "${myLS_WEB_PW}")
myLS_WEB_USER_ENC_B64=$(echo -n "${myLS_WEB_USER_ENC}" | base64 -w0)

# Create myCYBERPOT_HIVE_USER, since this is for Logstash on the SENSOR, it needs to directly base64 encoded
myCYBERPOT_HIVE_USER=$(echo -n "${myLS_WEB_USER}:${myLS_WEB_PW}" | base64 -w0)

# Print credentials
echo "# The following SENSOR credentials have been created:"
echo "# New SENSOR username: ${myLS_WEB_USER}"
echo "# New SENSOR passowrd: ${myLS_WEB_PW}"
echo "# New htpasswd encoded credentials: ${myLS_WEB_USER_ENC}"
echo "# New htpasswd credentials base64 encoded: ${myLS_WEB_USER_ENC_B64}"
echo "# New SENSOR credentials base64 encoded: ${myCYBERPOT_HIVE_USER}"
echo
echo "# Ansible will ask for the ‘BECOME password‘ which is typically the password you ’sudo’ with on the SENSOR."
echo "# The password will allow Ansible to run a reboot via sudo on the SENSOR."
echo

# Read LS_WEB_USER from file
myENV_LS_WEB_USER=$(grep "^LS_WEB_USER=" "${myENV_FILE}" | sed 's/^LS_WEB_USER=//g' | tr -d "\"'")

# Add the new SENSOR user
if [ "${myENV_LS_WEB_USER}" == "" ];
  then
    myENV_LS_WEB_USER="${myLS_WEB_USER_ENC_B64}"
  else
    myENV_LS_WEB_USER="${myENV_LS_WEB_USER} ${myLS_WEB_USER_ENC_B64}"
fi

# Need to export for Ansible
export myCYBERPOT_HIVE_USER
export myCYBERPOT_HIVE_IP

ANSIBLE_LOG_PATH=${HOME}/cyberpot/data/deploy_sensor.log ansible-playbook ${myANSIBLE_CYBERPOT_PLAYBOOK} -i ${mySENSOR_IP}, -c ssh -u ${mySSHUSER} --ask-become-pass -e "ansible_port=${myANSIBLE_PORT}"

if [ "$?" == 0 ];
  then
	# Update the CyberPot .env config and lswebpasswd (avoid the need to restart CyberPot) on the host
	echo "# Updating SENSOR users on this HIVE and in the CyberPot .env config:"
    sed -i "/^LS_WEB_USER=/c\LS_WEB_USER=$myENV_LS_WEB_USER" "${myENV_FILE}"
	: > "${HOME}"/cyberpot/data/nginx/conf/lswebpasswd
	for i in $myENV_LS_WEB_USER;
	  do
	    if [[ -n $i ]]; 
	      then
	        # Need to control newlines as they kept coming up for some reason
	        echo -n "$i" | base64 -d -w0
	        echo
	        echo -n "$i" | base64 -d -w0 | tr -d '\n' >> ${HOME}/cyberpot/data/nginx/conf/lswebpasswd
	        echo >> ${HOME}/cyberpot/data/nginx/conf/lswebpasswd
	      fi
	done
fi

unset myCYBERPOT_HIVE_USER
unset myCYBERPOT_HIVE_IP
