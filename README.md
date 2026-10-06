# CyberPot - The All-in-One Multi Honeypot Platform

![CyberPot Banner](doc/cyberpot_wallpaper_19201080.png#only-light)
![CyberPot Banner Dark](doc/cyberpot_wallpaper_4k.png#only-dark)

<center>

[![CyberPot](https://img.shields.io/badge/CyberPot-Multi%20Honeypot-0d6efd?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/khulnasoft/cyberpot)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/khulnasoft/cyberpot)
[![GitHub Stars](https://img.shields.io/github/stars/khulnasoft/cyberpot?style=for-the-badge&logo=github&labelColor=181717&colorFfFf)](https://github.com/khulnasoft/cyberpot/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/khulnasoft/cyberpot?style=for-the-badge&logo=github&labelColor=181717&colorFfFf)](https://github.com/khulnasoft/cyberpot/forks)
[![GitHub Watchers](https://img.shields.io/github/watchers/khulnasoft/cyberpot?style=for-the-badge&logo=github&labelColor=181717&colorFfFf)](https://github.com/khulnasoft/cyberpot/watchers)
[![GitHub License](https://img.shields.io/github/license/khulnasoft/cyberpot?style=for-the-badge&logo=gnu)](https://github.com/khulnasoft/cyberpot/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/khulnasoft/cyberpot-init?style=for-the-badge&logo=docker)](https://hub.docker.com/r/khulnasoft/cyberpot-init)
[![Version](https://img.shields.io/badge/Version-24.04.2-0d6efd?style=for-the-badge&logo=semver)](https://github.com/khulnasoft/cyberpot/releases/tag/24.04.2)

</center>

<br>

## TL;DR

1. ✅ Meet [system requirements](#system-requirements). CyberPot needs at least 8-16 GB RAM, 128 GB free disk space, and a working internet connection.
2. 📦 [Choose your distro](#choose-your-distro) or use a running, supported distribution.
3. 🐳 Install Docker + Docker Compose.
4. 🚀 Run installer: `./install.sh`
5. 🔄 Reboot & login

<br>

<center>

[![Quick Start](https://img.shields.io/badge/Quick%20Start-5%20steps-28a745?style=for-the-badge)](docs/BUILD.md)

</center>

<br>

# Technical Architecture

<div align="center">
  <a href="doc/architecture.png">
    <img src="doc/architecture.png" alt="CyberPot Architecture" width="700"/>
  </a>
</div>

<small>CyberPot technical architecture - compose templates, docker images, and service topology</small>

<br>

## Core Concept

CyberPot is the all-in-one, optionally distributed, multi-architecture (amd64, arm64) honeypot platform supporting 20+ honeypots with Elastic Stack visualization, live attack maps, and security tools for enhanced deception experience.

- 📦 **23+ honeypots** - conpot, cowrie, dionaea, ddospot, honeytrap, and more
- 📊 **Elastic Stack** - Elasticsearch, Logstash, Kibana, Elasticvue
- 🗺️ **Attack Map** - Animated threat visualization
- 🕵️ **Spiderfoot** - OSINT automation
- 🔧 **25+ tools** - CyberChef, P0f, Suricata, Fatt, and more

<br>

# System Requirements

| CyberPot Type | RAM | Storage | Description |
| :------------ | :--- | :--- | :---------- |
| <kbd>Hive</kbd> | 16 GB | 256 GB SSD | Full hive with all services & honeypots |
| <kbd>Sensor</kbd> | 8 GB | 128 GB SSD | Honeypots + tools, sends data to HIVE |
| <kbd>Standalone</kbd> | 8 GB | 128 GB SSD | Single host with all features |

<br>

| Requirement | Specification |
| :--- | :--- |
| IPv4 address | DHCP or static |
| Internet | Non-proxied, outgoing |
| OS | AlmaLinux 9, Debian 12, Fedora 40, OpenSuse Tumbleweed, Rocky Linux 9, Ubuntu 24.04 |
| Distro (ARM) | Raspberry Pi 4 (8GB), Apple Silicon |

<br>

<details><summary><b>Running in a VM</b></summary>

Supported VM platforms:
- <kbd>UTM</kbd> (Intel & Apple Silicon)
- <kbd>VirtualBox</kbd>
- <kbd>VMWare Fusion/Workstation</kbd>
- KVM (reported working)

<small>Apple Silicon note: may require switching to Console Only display mode during initial install.</small>

</details>

<details><summary><b>Required Ports</b></summary>

| Port | Protocol | Direction | Description |
| :--- | :---: | :---: | :--- |
| 80, 443 | tcp | outgoing | Management: updates, logs |
| 64294 | tcp | incoming | Sensor data transmission |
| 64295 | tcp | incoming | SSH access |
| 64297 | tcp | incoming | NGINX reverse proxy |
| 5555 | tcp | incoming | ADBHoney honeypot |
| 5000 | udp | incoming | CiscoASA honeypot |
| 8443 | tcp | incoming | CiscoASA honeypot |
| 443 | tcp | incoming | CitrixHoneypot |
| 80, 102, 502, 1025... | tcp | incoming | Conpot honeypot |
| 22, 23 | tcp | incoming | Cowrie honeypot |
| 19, 53, 123, 1900 | udp | incoming | Ddospot honeypot |
| 9200 | tcp | incoming | Elasticpot |
| 6379 | tcp | incoming | Redishoneypot |
| 8090 | tcp | incoming | Wordpot honeypot |

</details>

<br>

# Choose your distro

| Distribution | x64 | arm64 |
| :--- | :---: | :---: |
| <kbd>AlmaLinux 9.4</kbd> | [download](https://repo.almalinux.org/almalinux/9.4/isos/x86_64/AlmaLinux-9.4-x86_64-boot.iso) | [download](https://repo.almalinux.org/almalinux/9.4/isos/aarch64/AlmaLinux-9.4-aarch64-boot.iso) |
| <kbd>Debian 12</kbd> | [download](https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-12.7.0-amd64-netinst.iso) | [download](https://cdimage.debian.org/debian-cd/current/arm64/iso-cd/debian-12.7.0-arm64-netinst.iso) |
| <kbd>Fedora Server 40</kbd> | [download](https://download.fedoraproject.org/pub/fedora/linux/releases/40/Server/x86_64/iso/Fedora-Server-netinst-x86_64-40-1.14.iso) | [download](https://download.fedoraproject.org/pub/fedora/linux/releases/40/Server/aarch64/iso/Fedora-Server-netinst-aarch64-40-1.14.iso) |
| <kbd>OpenSuse Tumbleweed</kbd> | [download](https://download.opensuse.org/tumbleweed/iso/openSUSE-Tumbleweed-NET-x86_64-Current.iso) | [download](https://download.opensuse.org/ports/aarch64/tumbleweed/iso/openSUSE-Tumbleweed-NET-aarch64-Current.iso) |
| <kbd>Rocky Linux 9.4</kbd> | [download](https://download.rockylinux.org/pub/rocky/9.4/isos/x86_64/Rocky-9.4-x86_64-boot.iso) | [download](https://download.rockylinux.org/pub/rocky/9.4/isos/aarch64/Rocky-9.4-aarch64-boot.iso) |
| <kbd>Ubuntu 24.04</kbd> | [download](https://releases.ubuntu.com/24.04/ubuntu-latest-live-server-amd64.iso) | [download](https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-latest-live-server-arm64.iso) |
| <kbd>Raspberry Pi OS</kbd> | - | [download](https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2024-03-15/2024-03-15-raspios-bookworm-arm64-lite.img.xz) |

<br>

## Installation Types

### Standard / HIVE

All services, tools, honeypots installed on single host acting as HIVE endpoint. Adjust `docker-compose.yml` or use `composer.py` for customization.

<br>

### Distributed

Requires **HIVE** (standard installation) + **SENSOR** (honeypots + tools only, transmits data to HIVE).

<br>

# Installation

```bash
git clone https://github.com/khulnasoft/cyberpot
cd cyberpot
./install.sh
```

Follow prompts, reboot, then login via SSH (`tcp/64295`) or WebUI (`https://IP:64297`).

<br>

# First Start

After reboot, login and verify via `dps.sh`. Access:
- **WebUI**: `https://<ip>:64297` (user: `<WEB_USER>`)
- **Kibana**: On landing page, select tailored dashboards
- **Attack Map**: On landing page, requires credential re-entry
- **Elasticvue**: On landing page

<br>

# Remote Access & Tools

| Service | Access |
| :--- | :--- |
| **SSH** | `ssh -l <OS_USERNAME> -p 64295 <ip>` |
| **WebUI** | `https://<ip>:64297` |
| **Kibana** | Landing page → Kibana |
| **Attack Map** | Landing page → Map |
| **CyberChef** | Landing page → CyberChef |
| **Elasticvue** | Landing page → Elasticvue |
| **Spiderfoot** | Landing page → Spiderfoot |

<br>

# Configuration

## CyberPot Config File

Configuration in `~/cyberpot/.env` (hidden) and `env.example` (defaults). Key variables:
- `CYBERPOT_REPO` - Docker repository
- `CYBERPOT_VERSION` - Version (24.04.2)
- `CYBERPOT_PULL_POLICY` - always|missing|never|build
- `CYBERPOT_TYPE` - HIVE|SENSOR|MOBILE
- `CYBERPOT_OSTYPE` - linux|mac|win

## Customize Honeypots & Services

1. Stop: `systemctl stop cyberpot`
2. Copy preset: `cp compose/standard.yml ./docker-compose.yml`
3. Customize: `python3 compose/customizer.py`
4. Replace: `mv docker-compose-custom.yml ./docker-compose.yml`
5. Start: `systemctl start cyberpot`

<br>

# Maintenance

| Action | Command |
| :--- | :--- |
| **General Updates** | `./update.sh -y` |
| **Daily Reboot** | `sudo crontab -e` (add: `42 2 * * * systemctl stop cyberpot && docker container prune -f...`) |
| **Show Containers** | `dps` or `dpsw [interval]` |
| **Factory Reset** | `sudo rm -rf ~/cyberpot/data && git reset --hard` |
| **Log Persistence** | 30 days default (adjust in Kibana ILP) |

<br>

# Badges & Shields

<div align="center">
  <a href="https://github.com/khulnasoft/cyberpot/stargazers">
    <img src="https://img.shields.io/github/stars/khulnasoft/cyberpot?style=social&logo=github" alt="Star"/>
  </a>
  <a href="https://github.com/khulnasoft/cyberpot/issues">
    <img src="https://img.shields.io/github/issues/khulnasoft/cyberpot?style=flat-square" alt="Issues"/>
  </a>
  <a href="https://github.com/khulnasoft/cyberpot/milestones">
    <img src="https://img.shields.io/github/milestones/khulnasoft/cyberpot?style=flat-square" alt="Milestones"/>
  </a>
  <a href="https://dockerhub.com">
    <img src="https://img.shields.io/docker/pulls/khulnasoft/cyberpot-init?style=flat-square" alt="Pulls"/>
  </a>
</div>

<br>

# Contact

- 🐛 [Issues](https://github.com/khulnasoft/cyberpot/issues)
- 💬 [Discussions](https://github.com/khulnasoft/cyberpot/discussions)
- 📦 [GitHub Packages](https://github.com/khulnasoft/cyberpot/packages)
- 🐦 [Twitter](https://x.com/khulnasoft)

<br>

<center>

![CyberPot WebUI](doc/cyberpotwebui.png)
<br>
*CyberPot Landing Page - WebUI*

</center>

<center>

![Kibana Dashboard](doc/kibana_a.png)
<br>
*Elastic Stack visualization*

</center>

<center>

![Attack Map](doc/attackmap.png)
<br>
*Live threat attack map*

</center>

<center>

![CyberChef](doc/cyberchef.png)
<br>
*Web app for encryption, encoding, compression*

</center>

<center>

![Elasticvue](doc/elasticvue.png)
<br>
*Elsearch cluster browser*

</center>

<center>

![Spiderfoot](doc/spiderfoot.png)
<br>
*OSINT automation tool*

</center>

<br>

---

*CyberPot 24.04.2 • Multi-Platform Honeypot • [GitHub](https://github.com/khulnasoft/cyberpot) • [Documentation](https://github.com/khulnasoft/cyberpot/wiki)*

</center>