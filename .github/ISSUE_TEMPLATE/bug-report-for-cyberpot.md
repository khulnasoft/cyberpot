---
name: Bug report for CyberPot 24.04.x
about: Bug report for CyberPot 24.04.x
title: ''
labels: ''
assignees: ''

---

# Successfully raise an issue
Before you post your issue make sure it has not been answered yet and provide **⚠️ BASIC SUPPORT INFORMATION** (as requested below) if you come to the conclusion it is a new issue.

- 🔍 Use the [search function](https://github.com/khulnasoft/cyberpot/issues?utf8=%E2%9C%93&q=) first
- 🧐 Check our [Wiki](https://github.com/khulnasoft/cyberpot/wiki) and the [discussions](https://github.com/khulnasoft/cyberpot/discussions)
- 📚 Consult the documentation of 💻 your Linux OS, 🐳 [Docker](https://docs.docker.com/), the 🦌 [Elastic stack](https://www.elastic.co/guide/index.html) and the 🍯 [CyberPot Readme](https://github.com/khulnasoft/cyberpot/blob/master/README.md).
- ⚙️ The [Troubleshoot Section](https://github.com/khulnasoft/cyberpot?tab=readme-ov-file#troubleshooting) of the [CyberPot Readme](https://github.com/khulnasoft/cyberpot/blob/master/README.md) is a good starting point to collect a good set of information for the issue and / or to fix things on your own.
- **⚠️ Provide [BASIC SUPPORT INFORMATION](#-basic-support-information-commands-are-expected-to-run-as-root) or similar detailed information with regard to your issue or we will close the issue or convert it into a discussion without further interaction from the maintainers**.<br>

# ⚠️ Basic support information (commands are expected to run as `root`)

**We happily take the time to improve CyberPot and take care of things, but we need you to take the time to create an issue that provides us with all the information we need.** 

- What OS are you CyberPot running on?
- What is the version of the OS `lsb_release -a` and `uname -a`?
- What CyberPot version are you currently using (only **CyberPot 24.04.x** is currently supported)?
- What architecture are you running on (i.e. hardware, cloud, VM, etc.)?
- Review the `~/install_cyberpot.log`, attach the log and highlight the errors.
- How long has your installation been running?
  - If it is a fresh install consult the documentation first.
  - Most likely it is a port conflict or a remote dependency was unavailable.
  - Retry a fresh installation and only open the issue if the error keeps coming up and is not resolved using the documentation as described [here](#how-to-raise-an-issue).  
- Did you install upgrades, packages or use the update script?
- Did you modify any scripts or configs? If yes, please attach the changes.
- Please provide a screenshot of `htop` and `docker stats`.
- How much free disk space is available (`df -h`)?
- What is the current container status (`dps`)?
- On Linux: What is the status of the CyberPot service (`systemctl status cyberpot`)?
- What ports are being occupied? Stop CyberPot `systemctl stop cyberpot` and run `grc netstat -tulpen`
  - Stop CyberPot `systemctl stop cyberpot`
  - Run `grc netstat -tulpen`
  - Run CyberPot manually with `docker compose -f ~/cyberpot/docker-compose.yml up` and check for errors
  - Stop execution with `CTRL-C` and `docker compose -f ~/cyberpot/docker-compose.yml down -v`
- If a single container shows as `DOWN` you can run `docker logs <container-name>` for the latest log entries
