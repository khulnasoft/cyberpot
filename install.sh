#!/usr/bin/env bash
set -o pipefail

myINSTALL_NOTIFICATION="### Now installing required packages ..."
myUSER=$(whoami)
# Derive repo root from script location to support both ~/cyberpot and devcontainer /workspaces/cyberpot
mySCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
myREPO_ROOT="${mySCRIPT_DIR}"
# Installed location is always ${HOME}/cyberpot (ansible clones there); fallback to repo root for devcontainer
# myCYBERPOT_HOME resolved dynamically via HOME/cyberpot vs REPO_ROOT in functions below
myCYBERPOT_CONF_FILE="${HOME}/cyberpot/.env"
# Ensure conf file fallback: if not in HOME, use repo .env for dev/test
if [ ! -f "${myCYBERPOT_CONF_FILE}" ] && [ -f "${myREPO_ROOT}/.env" ]; then
  myCYBERPOT_CONF_FILE="${myREPO_ROOT}/.env"
fi
myPACKAGES_DEBIAN="ansible apache2-utils cracklib-runtime wget"
myPACKAGES_FEDORA="ansible cracklib httpd-tools wget"
myPACKAGES_ROCKY="ansible-core ansible-collection-redhat-rhel_mgmt epel-release cracklib httpd-tools wget"
myPACKAGES_OPENSUSE="ansible apache2-utils cracklib wget"


myINSTALLER=$(cat << "EOF"
   ______      __              ____        __ 
  / ____/_  __/ /_  ___  _____/ __ \____  / /_
 / /   / / / / __ \/ _ \/ ___/ /_/ / __ \/ __/
/ /___/ /_/ / /_/ /  __/ /  / ____/ /_/ / /_  
\____/\__, /_.___/\___/_/  /_/    \____/\__/  
     /____/                                   
EOF
)

# Check if running with root privileges
if [ "${EUID}" -eq 0 ];
  then
    echo "This script should not be run as root. Please run it as a regular user."
    echo
    exit 1
fi

# Check if running on a supported distribution
mySUPPORTED_DISTRIBUTIONS=("AlmaLinux" "Debian GNU/Linux" "Fedora Linux" "openSUSE Tumbleweed" "Raspbian GNU/Linux" "Rocky Linux" "Ubuntu")
myCURRENT_DISTRIBUTION=$(awk -F= '/^NAME/{print $2}' /etc/os-release | tr -d '"')

myIS_SUPPORTED=0
for dist in "${mySUPPORTED_DISTRIBUTIONS[@]}"; do
  if [ "${dist}" = "${myCURRENT_DISTRIBUTION}" ]; then
    myIS_SUPPORTED=1
    break
  fi
done
if [ "${myIS_SUPPORTED}" -ne 1 ]; then
    echo "### Only the following distributions are supported: AlmaLinux, Fedora, Debian, openSUSE Tumbleweed, Rocky Linux and Ubuntu."
    echo "### Please follow the CyberPot documentation on how to run CyberPot on macOS, Windows and other currently unsupported platforms."
    echo
    exit 1
fi

# Begin of Installer
echo "$myINSTALLER"
echo
echo
echo "### This script will now install CyberPot and all of its dependencies."
while [ "${myQST}" != "y" ] && [ "${myQST}" != "n" ];
  do
    echo
    read -r -p "### Install? (y/n) " myQST
    echo
  done
if [ "${myQST}" = "n" ];
  then
    echo
    echo "### Aborting!"
    echo
    exit 0
fi

# Install packages based on the distribution
case "${myCURRENT_DISTRIBUTION}" in
  "Fedora Linux")
    echo
    echo "${myINSTALL_NOTIFICATION}"
    echo
    # shellcheck disable=SC2086 # word splitting intended for package list
    sudo dnf -y --refresh install ${myPACKAGES_FEDORA}
    ;;
  "Debian GNU/Linux"|"Raspbian GNU/Linux"|"Ubuntu")
    echo
    echo "${myINSTALL_NOTIFICATION}"
    echo
    if ! command -v sudo >/dev/null;
      then
        echo "### ‘sudo‘ is not installed. To continue you need to provide the ‘root‘ password"
        echo "### or press CTRL-C to manually install ‘sudo‘ and add your user to the sudoers."
        echo
        su -c "apt -y update && \
               NEEDRESTART_SUSPEND=1 apt -y install sudo ${myPACKAGES_DEBIAN} && \
               /usr/sbin/usermod -aG sudo ${myUSER} && \
               echo '${myUSER} ALL=(ALL:ALL) ALL' | tee /etc/sudoers.d/${myUSER} >/dev/null && \
               chmod 440 /etc/sudoers.d/${myUSER}"
        echo "### We need sudo for Ansible, please enter the sudo password ..."
        sudo echo "### ... sudo for Ansible acquired."
        echo
      else
        sudo apt update
        # shellcheck disable=SC2086 # word splitting intended for package list
        sudo env NEEDRESTART_SUSPEND=1 apt-get install -y ${myPACKAGES_DEBIAN}
    fi
    ;;
  "openSUSE Tumbleweed")
    echo
    echo "${myINSTALL_NOTIFICATION}"
    echo
    sudo zypper refresh
    # shellcheck disable=SC2086 # word splitting intended for package list
    sudo zypper install -y ${myPACKAGES_OPENSUSE}
    echo "export ANSIBLE_PYTHON_INTERPRETER=/bin/python3" | sudo tee /etc/profile.d/ansible.sh >/dev/null
    # shellcheck source=/dev/null
    source /etc/profile.d/ansible.sh || true
    ;;
  "AlmaLinux"|"Rocky Linux")
    echo
    echo "${myINSTALL_NOTIFICATION}"
    echo
    # shellcheck disable=SC2086 # word splitting intended for package list
    sudo dnf -y --refresh install ${myPACKAGES_ROCKY}
    ansible-galaxy collection install ansible.posix
    ;;
esac
echo

# Download cyberpot.yml if not found locally
if [ ! -f installer/install/cyberpot.yml ] && [ ! -f cyberpot.yml ];
  then
    echo "### Now downloading CyberPot Ansible Installation Playbook ... "
    wget -qO cyberpot.yml https://raw.githubusercontent.com/khulnasoft/cyberpot/master/installer/install/cyberpot.yml
    myANSIBLE_CYBERPOT_PLAYBOOK="cyberpot.yml"
    echo
  else
    echo "### Using local CyberPot Ansible Installation Playbook ... "
    if [ -f "installer/install/cyberpot.yml" ];
      then
        myANSIBLE_CYBERPOT_PLAYBOOK="installer/install/cyberpot.yml"
      else
        myANSIBLE_CYBERPOT_PLAYBOOK="cyberpot.yml"
    fi
fi

# Check type of sudo access
if ! sudo -n true > /dev/null 2>&1; then
    myANSIBLE_BECOME_OPTION="--ask-become-pass"
    echo "### ‘sudo‘ not acquired, setting ansible become option to ${myANSIBLE_BECOME_OPTION}."
    echo "### Ansible will ask for the ‘BECOME password‘ which is typically the password you ’sudo’ with."
    echo
  else
    myANSIBLE_BECOME_OPTION="--become"
    echo "### ‘sudo‘ acquired, setting ansible become option to ${myANSIBLE_BECOME_OPTION}."
    echo
fi

# Run Ansible Playbook
# NOTE: Previously filtered with --tags "${myANSIBLE_TAG}" where myANSIBLE_TAG was "Debian"/"Ubuntu" etc.,
# but playbook defines tags like bootstrap/packages/docker/users (no distro tags) causing all tasks to be skipped (ok=2).
# Run without tag filter so distribution-specific `when:` clauses handle selection.
echo "### Now running CyberPot Ansible Installation Playbook ..."
echo
rm -f "${HOME}/install_cyberpot.log" > /dev/null 2>&1
if ! ANSIBLE_LOG_PATH="${HOME}/install_cyberpot.log" ansible-playbook "${myANSIBLE_CYBERPOT_PLAYBOOK}" -i 127.0.0.1, -c local "${myANSIBLE_BECOME_OPTION}"; then
    echo "### Something went wrong with the Playbook, please review the output and / or install_cyberpot.log for clues."
    echo "### Aborting."
    echo
    exit 1
  else
    echo "### Playbook was successful."
    echo
fi

# Ask for CyberPot Installation Type
echo
echo "### Choose your CyberPot type:"
echo "### (H)ive   - CyberPot Standard / HIVE installation."
echo "###            Includes also everything you need for a distributed setup with sensors."
echo "### (S)ensor - CyberPot Sensor installation."
echo "###            Optimized for a distributed installation, without WebUI, Elasticsearch and Kibana."
echo "### (L)LM    - CyberPot LLM installation."
echo "###            Uses LLM based honeypots Beelzebub & Galah."
echo "###            Requires Ollama (recommended) or ChatGPT subscription."
echo "### M(i)ni   - CyberPot Mini installation."
echo "###            Run 30+ honeypots with just a couple of honeypot daemons."
echo "### (M)obile - CyberPot Mobile installation."
echo "###            Includes everything to run CyberPot Mobile (available separately)."
echo "### (T)arpit - CyberPot Tarpit installation."
echo "###            Feed data endlessly to attackers, bots and scanners."
echo "###            Also runs a Denial of Service Honeypot (ddospot)."
echo

select_compose_preset() {
  local preset="$1"
  # Prefer installed location, fallback to repo root (devcontainer / CI)
  local helper_script="${HOME}/cyberpot/scripts/select_compose_preset.py"
  local output_file="${HOME}/cyberpot/docker-compose.yml"
  if [ ! -f "${helper_script}" ]; then
    helper_script="${myREPO_ROOT}/scripts/select_compose_preset.py"
  fi
  if [ ! -f "${helper_script}" ]; then
    echo "### Missing helper script: ${helper_script} (also checked ${HOME}/cyberpot/scripts/select_compose_preset.py)" >&2
    return 1
  fi
  # If HOME/cyberpot doesn't exist yet, write to repo root for dev, otherwise to HOME
  if [ ! -d "${HOME}/cyberpot" ] && [ -d "${myREPO_ROOT}/scripts" ]; then
    output_file="${myREPO_ROOT}/docker-compose.yml"
    # Also ensure HOME path will be populated by ansible clone - keep output_file as HOME for production
    # If we are in devcontainer where repo IS the install, use repo root
    if [ "${myREPO_ROOT}" != "${HOME}/cyberpot" ]; then
      echo "### Note: ${HOME}/cyberpot not found, generating docker-compose.yml at ${output_file}" >&2
    fi
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    echo "### python3 not found" >&2
    return 1
  fi
  if ! python3 "${helper_script}" --preset "${preset}" --output "${output_file}"; then
    echo "### Failed to generate docker-compose.yml for preset '${preset}'" >&2
    return 1
  fi
  # If we generated to repo root but HOME/cyberpot exists, also copy there for consistency
  if [ "${output_file}" != "${HOME}/cyberpot/docker-compose.yml" ] && [ -d "${HOME}/cyberpot" ]; then
    cp -f "${output_file}" "${HOME}/cyberpot/docker-compose.yml" || true
  fi
}

while true; do
  read -r -p "### Install Type? (h/s/l/i/m/t) " myCYBERPOT_TYPE
  case "${myCYBERPOT_TYPE}" in
    h|H)
      echo
      echo "### Installing CyberPot Standard / HIVE."
      myCYBERPOT_TYPE="HIVE"
      select_compose_preset "standard" || exit 1
      myINFO=""
      break ;;
    s|S)
      echo
      echo "### Installing CyberPot Sensor."
      myCYBERPOT_TYPE="SENSOR"
      select_compose_preset "sensor" || exit 1
      myINFO="### Make sure to deploy SSH keys to this SENSOR and disable SSH password authentication.
### On HIVE run the cyberpot/deploy.sh script to join this SENSOR to the HIVE."
      break ;;
    l|L)
      echo
      echo "### Installing CyberPot LLM."
      myCYBERPOT_TYPE="HIVE"
      select_compose_preset "llm" || exit 1
      myINFO="Make sure to adjust the CyberPot config file (.env) for Ollama / ChatGPT settings."
      break ;;
    i|I)
      echo
      echo "### Installing CyberPot Mini."
      myCYBERPOT_TYPE="HIVE"
      select_compose_preset "mini" || exit 1
      myINFO=""
      break ;;
    m|M)
      echo
      echo "### Installing CyberPot Mobile."
      myCYBERPOT_TYPE="MOBILE"
      select_compose_preset "mobile" || exit 1
      myINFO=""
      break ;;
    t|T)
      echo
      echo "### Installing CyberPot Tarpit."
      myCYBERPOT_TYPE="HIVE"
      select_compose_preset "tarpit" || exit 1
      myINFO=""
      break ;;
  esac
done

if [ "${myCYBERPOT_TYPE}" == "HIVE" ]; then
	# Preparing web user for CyberPot
	echo
	echo "### CyberPot User Configuration ..."
	echo
	# Asking for web user name
	myWEB_USER=""
	while true;
	  do
	    myOK=""
	    read -r -p "### Enter your web user name: " myWEB_USER
	    myWEB_USER=$(echo "${myWEB_USER}" | tr -cd "[:alnum:]_.-")
	    echo "### Your username is: ${myWEB_USER}"
	    while [[ ! "${myOK}" =~ [YyNn] ]];
	      do
	        read -r -p "### Is this correct? (y/n) " myOK
	      done
	    if [[ "${myOK}" =~ [Yy] ]] && [ "$myWEB_USER" != "" ];
	      then
	        break
	      else
	        echo
	    fi
	  done

	# Asking for web user password
	myWEB_PW="pass1"
	myWEB_PW2="pass2"
	mySECURE=0
	myOK=""
	while [ "${myWEB_PW}" != "${myWEB_PW2}"  ] && [ "${mySECURE}" == "0" ]
	  do
	    echo
	    while [ "${myWEB_PW}" == "pass1"  ] || [ "${myWEB_PW}" == "" ]
	      do
	        read -r -s -p "### Enter password for your web user: " myWEB_PW
	        echo
	      done
	    read -r -s -p "### Repeat password you your web user: " myWEB_PW2
	    echo
	    if [ "${myWEB_PW}" != "${myWEB_PW2}" ];
	      then
	        echo "### Passwords do not match."
	        myWEB_PW="pass1"
	        myWEB_PW2="pass2"
	    fi
	    if command -v /usr/sbin/cracklib-check >/dev/null 2>&1; then
	      mySECURE=$(printf "%s" "$myWEB_PW" | /usr/sbin/cracklib-check | grep -c "OK")
	    else
	      echo "### cracklib-check not found, skipping password strength check" >&2
	      mySECURE=1
	    fi
	    if [ "$mySECURE" == "0" ] && [ "$myWEB_PW" == "$myWEB_PW2" ];
	      then
	        while [[ ! "${myOK}" =~ [YyNn] ]];
	          do
	            read -r -p "### Keep insecure password? (y/n) " myOK
	          done
	        if [[ "${myOK}" =~ [Nn] ]] || [ "$myWEB_PW" == "" ];
	          then
	            myWEB_PW="pass1"
	            myWEB_PW2="pass2"
	            mySECURE=0
	            myOK=""
	        fi
	    fi
	done

	# Write username and password to CyberPot config file
	echo "### Creating base64 encoded htpasswd username and password for CyberPot config file: ${myCYBERPOT_CONF_FILE}"
	if ! command -v htpasswd >/dev/null 2>&1; then
	  echo "### htpasswd not found (apache2-utils), cannot create WEB_USER" >&2
	  exit 1
	fi
	if [ ! -f "${myCYBERPOT_CONF_FILE}" ]; then
	  echo "### Config file not found: ${myCYBERPOT_CONF_FILE}, creating from env.example" >&2
	  cp "${myREPO_ROOT}/env.example" "${myCYBERPOT_CONF_FILE}" || touch "${myCYBERPOT_CONF_FILE}"
	fi
	myWEB_USER_ENC=$(htpasswd -b -n "${myWEB_USER}" "${myWEB_PW}")
    myWEB_USER_ENC_B64=$(echo -n "${myWEB_USER_ENC}" | base64 -w0)
    
	echo
	sed -i "s|^WEB_USER=.*|WEB_USER=${myWEB_USER_ENC_B64}|" "${myCYBERPOT_CONF_FILE}"
fi

# Pull docker images - resolve compose file location with fast fallback
myCOMPOSE_FILE="${HOME}/cyberpot/docker-compose.yml"
if [ ! -f "${myCOMPOSE_FILE}" ] && [ -f "${myREPO_ROOT}/docker-compose.yml" ]; then
  myCOMPOSE_FILE="${myREPO_ROOT}/docker-compose.yml"
fi
echo "### Now pulling images from ${myCOMPOSE_FILE} ..."
if [ ! -f "${myCOMPOSE_FILE}" ]; then
  echo "### Compose file not found: ${myCOMPOSE_FILE}" >&2
else
  # Use fast fallback script if available (tries ghcr.io/khulnasoft-bot -> docker.io/khulnasoft -> ghcr.io/khulnasoft with 5s timeout)
  if [ -f "${myREPO_ROOT}/scripts/fast_pull_fallback.sh" ]; then
    echo "### Trying fast pull with fallback (docker.io/khulnasoft:24.04.2)..."
    if ! bash "${myREPO_ROOT}/scripts/fast_pull_fallback.sh" "${myCOMPOSE_FILE}" 2>&1; then
      echo "### Fast pull had issues, falling back to docker compose pull --ignore-pull-failures" >&2
      sudo docker compose -f "${myCOMPOSE_FILE}" pull --ignore-pull-failures 2>&1 || echo "### docker compose pull failed (docker may not be running in devcontainer)" >&2
    fi
  elif [ -f "${HOME}/cyberpot/scripts/fast_pull_fallback.sh" ]; then
    echo "### Trying fast pull with fallback..."
    if ! bash "${HOME}/cyberpot/scripts/fast_pull_fallback.sh" "${myCOMPOSE_FILE}" 2>&1; then
      sudo docker compose -f "${myCOMPOSE_FILE}" pull --ignore-pull-failures 2>&1 || echo "### docker compose pull failed" >&2
    fi
  else
    # Fallback: pull with --ignore-pull-failures to handle private/unauthorized images like rdphoneypot
    if ! sudo docker compose -f "${myCOMPOSE_FILE}" pull --ignore-pull-failures 2>&1; then
      echo "### docker compose pull failed (docker may not be running in devcontainer)" >&2
    fi
  fi
  # Ensure rdphoneypot fallback to dtagdevsec if khulnasoft missing (private)
  if ! sudo docker image inspect "docker.io/khulnasoft/rdphoneypot:24.04.2" >/dev/null 2>&1 && sudo docker image inspect "ghcr.io/khulnasoft/rdphoneypot:24.04.1" >/dev/null 2>&1; then
    echo "### Retagging existing rdphoneypot 24.04.1 -> 24.04.2 for docker.io"
    sudo docker tag "ghcr.io/khulnasoft/rdphoneypot:24.04.1" "docker.io/khulnasoft/rdphoneypot:24.04.2" 2>/dev/null || true
  fi
fi
echo

# Show running services
echo "### Please review for possible honeypot port conflicts."
echo "### While SSH is taken care of, other services such as"
echo "### SMTP, HTTP, etc. might prevent CyberPot from starting."
echo
if command -v grc >/dev/null 2>&1; then
  if command -v ss >/dev/null 2>&1; then
    sudo grc ss -tulpen || sudo ss -tulpen
  else
    sudo grc netstat -tulpen || sudo netstat -tulpen
  fi
else
  if command -v ss >/dev/null 2>&1; then
    sudo ss -tulpen
  else
    sudo netstat -tulpen || echo "### ss/netstat not available" >&2
  fi
fi
echo

# Done
echo "### Done. Please reboot and re-connect via SSH on tcp/64295."
echo "${myINFO}"
echo
