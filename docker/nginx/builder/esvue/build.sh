#!/bin/bash
# Needs buildx to build. Run cyberpot/bin/setup-builder.sh first
docker buildx build --no-cache --progress plain --output ../../dist/html/esvue/ .
