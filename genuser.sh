#!/usr/bin/env bash
set -euo pipefail

# genuser.sh - CyberPot web user creation wrapper
# Runs the cyberpot-init container's genuser.sh with proper mounts and registry fallback
# Usage: ./genuser.sh [--help] [--version VERSION] [--repo REPO]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

# Load env for defaults
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091,SC1090
  source "$REPO_ROOT/.env" 2>/dev/null || true
  set +a
fi
if [[ -f "$HOME/cyberpot/.env" ]]; then
  set -a
  # shellcheck disable=SC1091,SC1090
  source "$HOME/cyberpot/.env" 2>/dev/null || true
  set +a
fi

CYBERPOT_VERSION="${CYBERPOT_VERSION:-24.04.2}"
CYBERPOT_VERSION="${CYBERPOT_VERSION#=}"
CYBERPOT_VERSION="${CYBERPOT_VERSION#=}"
CYBERPOT_REPO="${CYBERPOT_REPO:-docker.io/khulnasoft}"
CYBERPOT_DATA_PATH="${CYBERPOT_DATA_PATH:-$HOME/cyberpot}"
TIMEOUT="${TIMEOUT:-5}"

# Help
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<EOF
Usage: $0 [--version VERSION] [--repo REPO] [--help]

Creates CyberPot web users via the cyberpot-init container.

Options:
  --version VERSION  Override CYBERPOT_VERSION (default: $CYBERPOT_VERSION)
  --repo REPO        Override CYBERPOT_REPO (default: $CYBERPOT_REPO)
  --help             Show this help

Environment:
  CYBERPOT_VERSION, CYBERPOT_REPO, CYBERPOT_DATA_PATH, HOME

Examples:
  $0
  $0 --version 24.04.2 --repo docker.io/khulnasoft
EOF
  exit 0
fi

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --version) CYBERPOT_VERSION="$2"; shift 2 ;;
    --repo) CYBERPOT_REPO="$2"; shift 2 ;;
    --) shift; break ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) break ;;
  esac
done

# Checks
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker not found. Please install Docker." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: docker daemon not running or not accessible (try: sudo systemctl start docker)" >&2
  exit 1
fi

# Resolve data path (handle spaces)
CYBERPOT_DATA_PATH="${CYBERPOT_DATA_PATH:-$HOME/cyberpot}"
# Ensure absolute path
if [[ "$CYBERPOT_DATA_PATH" != /* ]]; then
  CYBERPOT_DATA_PATH="$REPO_ROOT/$CYBERPOT_DATA_PATH"
fi

# Ensure required directories and files exist
NGINX_CONF_DIR="$CYBERPOT_DATA_PATH/data/nginx/conf"
NGINX_PASSWD_FILE="$NGINX_CONF_DIR/nginxpasswd"
if [[ ! -d "$NGINX_CONF_DIR" ]]; then
  echo "Creating $NGINX_CONF_DIR"
  mkdir -p "$NGINX_CONF_DIR"
fi
if [[ ! -f "$NGINX_PASSWD_FILE" ]]; then
  touch "$NGINX_PASSWD_FILE"
fi
if [[ ! -f "$CYBERPOT_DATA_PATH/.env" && ! -f "$REPO_ROOT/.env" ]]; then
  echo "Warning: No .env found at $CYBERPOT_DATA_PATH/.env or $REPO_ROOT/.env" >&2
fi

# Determine UID/GID for container (handle id failure, root)
USER_ID="$(id -u 2>/dev/null || echo 1000)"
GROUP_ID="$(id -g 2>/dev/null || echo 1000)"
# If running as root, use 1000:1000 to avoid root-owned files
if [[ "$USER_ID" -eq 0 ]]; then
  USER_ID=1000
  GROUP_ID=1000
fi

# Registry fallback: try docker.io/khulnasoft first, then ghcr.io/khulnasoft-bot, then ghcr.io/khulnasoft
CANDIDATES=(
  "${CYBERPOT_REPO}/cyberpot-init:${CYBERPOT_VERSION}"
  "docker.io/khulnasoft/cyberpot-init:${CYBERPOT_VERSION}"
  "ghcr.io/khulnasoft/cyberpot-init:${CYBERPOT_VERSION}"
  "ghcr.io/khulnasoft-bot/cyberpot-init:${CYBERPOT_VERSION}"
)
# De-duplicate
declare -A SEEN
UNIQUE_CANDIDATES=()
for c in "${CANDIDATES[@]}"; do
  if [[ -z "${SEEN[$c]:-}" ]]; then
    SEEN["$c"]=1
    UNIQUE_CANDIDATES+=("$c")
  fi
done

IMAGE=""
for cand in "${UNIQUE_CANDIDATES[@]}"; do
  # Fast check: local image exists?
  if docker image inspect "$cand" >/dev/null 2>&1; then
    IMAGE="$cand"
    echo "Using local image: $IMAGE"
    break
  fi
  # Remote check with timeout
  if command -v timeout >/dev/null 2>&1; then
    if timeout "$TIMEOUT" docker manifest inspect "$cand" >/dev/null 2>&1; then
      IMAGE="$cand"
      echo "Found remote image: $IMAGE"
      break
    fi
  else
    if docker manifest inspect "$cand" >/dev/null 2>&1; then
      IMAGE="$cand"
      echo "Found remote image: $IMAGE"
      break
    fi
  fi
done

if [[ -z "$IMAGE" ]]; then
  # Fallback to first candidate and try pull anyway
  IMAGE="${UNIQUE_CANDIDATES[0]}"
  echo "No candidate found via manifest, trying default: $IMAGE" >&2
fi

# Pull if not present locally
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Pulling $IMAGE ..."
  if ! docker pull "$IMAGE"; then
    echo "Failed to pull $IMAGE, trying alternatives..." >&2
    for cand in "${UNIQUE_CANDIDATES[@]}"; do
      [[ "$cand" == "$IMAGE" ]] && continue
      echo "Trying $cand ..."
      if docker pull "$cand"; then
        IMAGE="$cand"
        break
      fi
    done
  fi
fi

# Verify image now exists
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Error: Image $IMAGE not available locally and pull failed" >&2
  echo "Try: docker pull $IMAGE" >&2
  exit 1
fi

# Determine docker run TTY flags (handle non-interactive)
DOCKER_TTY=()
if [[ -t 0 && -t 1 ]]; then
  DOCKER_TTY=(-it)
else
  DOCKER_TTY=(-i)
fi

echo "Running genuser via $IMAGE (data: $CYBERPOT_DATA_PATH -> /data, user: $USER_ID:$GROUP_ID) ..."
# Use --rm to clean up, handle spaces in CYBERPOT_DATA_PATH with proper quoting
exec docker run --rm "${DOCKER_TTY[@]}" \
  -v "$CYBERPOT_DATA_PATH:/data" \
  --entrypoint bash \
  -u "$USER_ID:$GROUP_ID" \
  "$IMAGE" "/opt/cyberpot/bin/genuser.sh" "$@"
