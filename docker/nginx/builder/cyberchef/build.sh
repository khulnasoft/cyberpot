#!/bin/bash
# Needs buildx to build. Run cyberpot/bin/setup-builder.sh first
docker buildx build --output ../../dist/html/cyberchef/ .
