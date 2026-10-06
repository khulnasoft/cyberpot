#!/usr/bin/env bash
# build_cyberpot_init.sh - Canonical build for cyberpot-init
# Usage: ./scripts/build_cyberpot_init.sh [--push] [--version 24.04.2] [--platform linux/amd64]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f version ]]; then
  VERSION="$(tr -d '[:space:]' < version)"
else
  VERSION="24.04.2"
fi
[[ -z "${VERSION:-}" ]] && VERSION="24.04.2"
PUSH=0
PLATFORM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) PUSH=1; shift ;;
    --version) VERSION="$2"; shift 2 ;;
    --platform) PLATFORM="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--push] [--version $VERSION] [--platform linux/amd64,linux/arm64]"; exit 0 ;;
    *) echo "Unknown: $1" >&2; exit 2 ;;
  esac
done

# Setup buildx (non-fatal)
bash scripts/setup_buildx.sh >/dev/null 2>&1 || echo "setup_buildx warning, continuing..."

BAKE_ARGS=()
if [[ $PUSH -eq 1 ]]; then
  BAKE_ARGS+=(--push)
else
  BAKE_ARGS+=(--load)
fi

if [[ -n "$PLATFORM" ]]; then
  BAKE_ARGS+=(--set "cyberpot-init.platform=$PLATFORM")
fi

echo "Building cyberpot-init:$VERSION (push=$PUSH)..."
CYBERPOT_VERSION="$VERSION" docker buildx bake "${BAKE_ARGS[@]}" cyberpot-init

echo "Done: docker.io/khulnasoft/cyberpot-init:$VERSION"
if [[ $PUSH -eq 1 ]]; then
  echo "Pushed to docker.io and ghcr.io"
else
  echo "Loaded locally, test with: docker run --rm docker.io/khulnasoft/cyberpot-init:$VERSION --help"
fi
