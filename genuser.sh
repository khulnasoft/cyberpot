#!/usr/bin/env bash
docker run -v $HOME/cyberpot:/data --entrypoint bash -it -u $(id -u):$(id -g) khulnasoft/cyberpotinit:24.04.1 "/opt/cyberpot/bin/genuser.sh"
