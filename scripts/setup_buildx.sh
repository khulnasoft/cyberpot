#!/usr/bin/env bash
# setup_buildx.sh - Canonical buildx + QEMU setup (replaces builder.sh/setup_builder.sh)
# Usage: ./scripts/setup_buildx.sh [--push] [--name mybuilder]
set -euo pipefail

BUILDER_NAME="${BUILDER_NAME:-mybuilder}"
PUSH_SETUP=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) PUSH_SETUP=1; shift ;;
    --name) BUILDER_NAME="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--push] [--name mybuilder]"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check docker
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}docker not found${NC}" >&2; exit 1
fi

# Check buildx
if ! docker buildx version >/dev/null 2>&1; then
  echo -e "${RED}docker buildx not available${NC}" >&2; exit 1
fi

echo -e "${BLUE}Checking buildx builder '$BUILDER_NAME'...${NC}"
if ! docker buildx inspect "$BUILDER_NAME" --bootstrap >/dev/null 2>&1; then
  echo -n "  Creating $BUILDER_NAME..."
  if docker buildx create --name "$BUILDER_NAME" --driver docker-container --use >/dev/null 2>&1 && \
     docker buildx inspect "$BUILDER_NAME" --bootstrap >/dev/null 2>&1; then
    echo -e " [${GREEN}OK${NC}]"
  else
    echo -e " [${RED}FAIL${NC}]"; exit 1
  fi
else
  echo -e " [${GREEN}OK${NC}]"
  docker buildx use "$BUILDER_NAME" >/dev/null 2>&1 || true
fi

echo -n "Ensuring platforms linux/amd64,linux/arm64..."
active=$(docker buildx inspect "$BUILDER_NAME" --bootstrap 2>/dev/null | grep -oP '(?<=Platforms: ).*' || true)
if [[ "$active" == *"linux/amd64"* && "$active" == *"linux/arm64"* ]]; then
  echo -e " [${GREEN}OK${NC}]"
else
  echo
  echo -n "  Recreating with platforms..."
  docker buildx rm "$BUILDER_NAME" >/dev/null 2>&1 || true
  if docker buildx create --name "$BUILDER_NAME" --driver docker-container --use --platform linux/amd64,linux/arm64 >/dev/null 2>&1 && \
     docker buildx inspect "$BUILDER_NAME" --bootstrap >/dev/null 2>&1; then
    echo -e " [${GREEN}OK${NC}]"
  else
    echo -e " [${RED}FAIL${NC}]"; exit 1
  fi
fi

echo -n "Ensuring QEMU..."
if docker run --rm --privileged tonistiigi/binfmt --install all >/dev/null 2>&1 || \
   docker run --rm --privileged multiarch/qemu-user-static --reset -p yes >/dev/null 2>&1; then
  echo -e " [${GREEN}OK${NC}]"
else
  echo -e " [${RED}FAIL${NC}]"
fi

if [[ $PUSH_SETUP -eq 1 ]]; then
  echo "Checking Docker Hub login..."
  if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "Not logged in, run: docker login and docker login ghcr.io" >&2
  fi
fi

echo -e "${GREEN}Done. Use: docker buildx bake cyberpot-init${NC}"
echo "  Push: docker buildx bake --push cyberpot-init"
