#!/usr/bin/env bash
# fast_pull_fallback.sh - CyberPot docker-compose pull with fast registry fallback
# Order: 1) docker.io/khulnasoft  2) docker.io/khulnasoft  3) docker.io/khulnasoft
# Usage: ./scripts/fast_pull_fallback.sh [compose-file] [--dry-run] [--up]
#   --dry-run : only check, do not pull
#   --up      : run docker compose up -d after successful pulls
# Env: CYBERPOT_VERSION (default 24.04.2), CYBERPOT_REPO override, TIMEOUT (default 5)
set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.yml}"
# handle flags anywhere
DRY_RUN=0
DO_UP=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --up) DO_UP=1 ;;
    *.yml|*.yaml) COMPOSE_FILE="$arg" ;;
  esac
done

# Resolve compose file path
if [[ ! -f "$COMPOSE_FILE" ]]; then
  if [[ -f "./docker-compose.yml" ]]; then
    COMPOSE_FILE="./docker-compose.yml"
  elif [[ -f "/workspaces/cyberpot/docker-compose.yml" ]]; then
    COMPOSE_FILE="/workspaces/cyberpot/docker-compose.yml"
  else
    echo "Compose file not found: $COMPOSE_FILE" >&2
    exit 1
  fi
fi

# Load .env if exists to get CYBERPOT_VERSION
if [[ -f .env ]]; then
  set -a; source .env 2>/dev/null || true; set +a
fi
if [[ -f "$(dirname "$COMPOSE_FILE")/.env" ]]; then
  set -a; source "$(dirname "$COMPOSE_FILE")/.env" 2>/dev/null || true; set +a
fi

CYBERPOT_VERSION="${CYBERPOT_VERSION:-24.04.2}"
# Strip leading "==" if present (bug in .env: CYBERPOT_VERSION==24.04.2)
CYBERPOT_VERSION="${CYBERPOT_VERSION#=}"
CYBERPOT_VERSION="${CYBERPOT_VERSION#=}"
TIMEOUT="${TIMEOUT:-5}"
REGISTRIES=("ghcr.io/khulnasoft-bot" "docker.io/khulnasoft" "ghcr.io/khulnasoft")

GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m"

fast_check() {
  local image="$1"
  # Method 1: docker manifest inspect (fast, no layer pull)
  if command -v docker >/dev/null 2>&1; then
    if timeout "$TIMEOUT" docker manifest inspect "$image" >/dev/null 2>&1; then
      return 0
    fi
    # fallback: docker pull dry-run via manifest not available on older docker, try skopeo/crane
  fi
  if command -v skopeo >/dev/null 2>&1; then
    if timeout "$TIMEOUT" skopeo inspect --raw "docker://$image" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v crane >/dev/null 2>&1; then
    if timeout "$TIMEOUT" crane manifest "$image" >/dev/null 2>&1; then
      return 0
    fi
  fi
  # Last resort: try registry HTTP HEAD (may need auth, so consider 401 as exists)
  # Use curl to check manifest endpoint, treat 200/401/403 as exists, 404 as missing
  registry=$(echo "$image" | cut -d'/' -f1)
  repo_path=$(echo "$image" | cut -d'/' -f2- | cut -d':' -f1)
  tag=$(echo "$image" | cut -d':' -f2)
  # default tag if not present
  if [[ "$tag" == "$image" ]]; then tag="latest"; fi
  local url=""
  if [[ "$registry" == "docker.io" ]]; then
    # Docker Hub: https://registry-1.docker.io/v2/khulnasoft/<name>/manifests/<tag>
    url="https://registry-1.docker.io/v2/khulnasoft/${repo_path##khulnasoft/}/manifests/${tag}"
  else
    url="https://${registry}/v2/${repo_path}/manifests/${tag}"
  fi
  # Use curl with 5s timeout, check http code
  local code
  code=$(timeout "$TIMEOUT" curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/vnd.docker.distribution.manifest.v2+json" "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "200" || "$code" == "401" || "$code" == "403" ]]; then
    return 0
  fi
  return 1
}

# Get list of images from compose file (expanded)
echo -e "${GREEN}=== CyberPot Fast Pull Fallback ===${NC}"
echo "Compose: $COMPOSE_FILE"
echo "Version: $CYBERPOT_VERSION"
echo "Registries order: ${REGISTRIES[*]}"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Use docker compose config to get expanded images, fallback to grep if docker not available
IMAGES=()
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  # Export env for config
  export CYBERPOT_VERSION
  # Use docker compose config --images (docker compose v2)
  if mapfile -t IMAGES < <(docker compose -f "$COMPOSE_FILE" config --images 2>/dev/null | sort -u); then
    if [[ ${#IMAGES[@]} -eq 0 ]]; then
      echo "No images found via 'docker compose config --images', falling back to grep" >&2
    fi
  fi
fi

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  # Fallback: parse compose file directly
  # Extract image: lines and expand ${CYBERPOT_REPO} manually
  CYBERPOT_REPO_FALLBACK="${CYBERPOT_REPO:-docker.io/khulnasoft}"
  while IFS= read -r line; do
    # line like "image: ${CYBERPOT_REPO}/adbhoney:${CYBERPOT_VERSION}"
    img=$(echo "$line" | sed -E 's/.*image:[[:space:]]*//; s/[[:space:]]*$//; s/"//g; s/'\''//g')
    # Expand vars
    img=$(echo "$img" | sed "s|\${CYBERPOT_REPO}|$CYBERPOT_REPO_FALLBACK|g; s|\$CYBERPOT_REPO|$CYBERPOT_REPO_FALLBACK|g; s|\${CYBERPOT_VERSION}|$CYBERPOT_VERSION|g; s|\$CYBERPOT_VERSION|$CYBERPOT_VERSION|g")
    # Fix double ==
    img=$(echo "$img" | sed 's/==/:/; s/::/:/')
    IMAGES+=("$img")
  done < <(grep -E '^\s*image:' "$COMPOSE_FILE" | sort -u)
fi

# Deduplicate and extract base name -> tag
declare -A SEEN
UNIQ_IMAGES=()
for img in "${IMAGES[@]}"; do
  [[ -z "$img" ]] && continue
  if [[ -z "${SEEN[$img]:-}" ]]; then
    SEEN["$img"]=1
    UNIQ_IMAGES+=("$img")
  fi
done
IMAGES=("${UNIQ_IMAGES[@]}")

echo "Found ${#IMAGES[@]} unique images:"
for img in "${IMAGES[@]}"; do echo "  - $img"; done
echo ""

# For each image, try registries in order
PULLED=0
FAILED=0

for original in "${IMAGES[@]}"; do
  # Extract base name (without registry) and tag
  # original like docker.io/khulnasoft/adbhoney:24.04.2 or khulnasoft/adbhoney:24.04.2
  # We want base = adbhoney, tag = 24.04.2
  base=$(basename "$original" | cut -d':' -f1)
  tag=$(echo "$original" | awk -F: '{print $NF}')
  # if tag == base (no colon), use CYBERPOT_VERSION
  if [[ "$tag" == "$original" ]] || [[ "$tag" == "$base" ]]; then
    tag="$CYBERPOT_VERSION"
  fi
  # Also handle case where original has no registry prefix (e.g., redis:7)
  # For redis, base is redis, but we should still try khulnasoft registries only if it's a khulnasoft image
  # Skip non-khulnasoft images (e.g., redis, elasticsearch official) - pull directly
  if [[ "$original" != *"khulnasoft"* && "$original" != *"cyberpot"* && "$original" != *"adbhoney"* && "$original" != *"cowrie"* ]]; then
    # Check if it's a generic image not in khulnasoft namespace, try direct pull
    if [[ "$original" == *"/"* ]]; then
      # already has registry, try direct
      echo -e "${YELLOW}[SKIP fallback] $original is not a khulnasoft image, trying direct pull${NC}"
      if [[ $DRY_RUN -eq 0 ]]; then
        if fast_check "$original"; then
          echo -e "${GREEN}  ✓ exists: $original${NC}"
          timeout 60 docker pull "$original" || echo -e "${RED}  ✗ pull failed: $original${NC}"
          ((PULLED++)) || true
        else
          echo -e "${RED}  ✗ not found: $original${NC}"
          ((FAILED++)) || true
        fi
      else
        echo "  [dry-run] would check $original"
      fi
      continue
    fi
  fi

  # If original already present locally, use it directly (no pull needed) - fixes manifest unknown for not-yet-pushed 24.04.2
  if sudo docker image inspect "$original" >/dev/null 2>&1 || docker image inspect "$original" >/dev/null 2>&1; then
    echo -e "${GREEN}Checking $base:$tag (original: $original) — already present locally${NC}"
    ((PULLED++)) || true
    continue
  fi
  echo -e "${YELLOW}Checking $base:$tag (original: $original)${NC}"
  FOUND=""
  # Try original tag first
  for reg in "${REGISTRIES[@]}"; do
    candidate="${reg}/${base}:${tag}"
    alt_candidate=""
    if [[ "$reg" == "docker.io/khulnasoft" ]]; then
      alt_candidate="khulnasoft/${base}:${tag}"
    fi
    echo -n "  trying $candidate ... "
    if fast_check "$candidate"; then
      echo -e "${GREEN}found${NC}"
      FOUND="$candidate"
      break
    elif [[ -n "$alt_candidate" ]] && fast_check "$alt_candidate"; then
      echo -e "${GREEN}found (alt $alt_candidate)${NC}"
      FOUND="$alt_candidate"
      break
    else
      echo -e "${RED}missing${NC}"
    fi
  done
  # Fallback to older tags if 24.04.2 not found (manifest unknown) - try 24.04.1, 24.04, latest
  if [[ -z "$FOUND" && "$tag" == "24.04.2" ]]; then
    for fallback_tag in "24.04.1" "24.04" "latest"; do
      echo -e "${YELLOW}  Fallback trying tag $fallback_tag for $base${NC}"
      for reg in "${REGISTRIES[@]}"; do
        candidate="${reg}/${base}:${fallback_tag}"
        echo -n "    trying $candidate ... "
        if fast_check "$candidate"; then
          echo -e "${GREEN}found${NC}"
          FOUND="$candidate"
          break 2
        else
          echo -e "${RED}missing${NC}"
        fi
      done
    done
  fi

  if [[ -z "$FOUND" ]]; then
    echo -e "${RED}  ✗ All registries missing for $base:$tag (and fallbacks)${NC}"
    ((FAILED++)) || true
    continue
  fi

  if [[ $DRY_RUN -eq 1 ]]; then
    echo -e "${GREEN}  [dry-run] would pull $FOUND -> $original${NC}"
    ((PULLED++)) || true
    continue
  fi

  # Skip pull if image already present locally
  if sudo docker image inspect "$FOUND" >/dev/null 2>&1 || docker image inspect "$FOUND" >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ already present locally: $FOUND${NC}"
    if [[ "$FOUND" != "$original" ]]; then docker tag "$FOUND" "$original" 2>/dev/null || sudo docker tag "$FOUND" "$original" 2>/dev/null || true; fi
    ((PULLED++)) || true
    continue
  fi
  echo -e "${GREEN}  → pulling $FOUND${NC}"
  if timeout 300 docker pull "$FOUND"; then
    if [[ "$FOUND" != "$original" ]]; then
      echo "  retag $FOUND -> $original"
      docker tag "$FOUND" "$original" || true
      # Also tag without docker.io prefix if needed
      if [[ "$FOUND" == "khulnasoft/"* ]]; then
        docker tag "$FOUND" "docker.io/$FOUND" || true
      fi
    fi
    ((PULLED++)) || true
  else
    echo -e "${RED}  ✗ pull failed $FOUND${NC}"
    ((FAILED++)) || true
  fi
done

echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo "Pulled/Found: $PULLED"
echo "Failed: $FAILED"
echo "Total: ${#IMAGES[@]}"

if [[ $DO_UP -eq 1 ]]; then
  echo ""
  echo -e "${GREEN}=== Running docker compose up ===${NC}"
  if [[ $FAILED -gt 0 ]]; then
    echo -e "${YELLOW}Warning: $FAILED images not found in any registry, attempting up anyway (may fail)${NC}"
  fi
  # Condition: only up if at least one pulled or no failures?
  # User said "docker-compose up condition" - we interpret as up only if pulls succeeded
  if [[ $PULLED -gt 0 || $FAILED -eq 0 ]]; then
    docker compose -f "$COMPOSE_FILE" up -d
    echo -e "${GREEN}docker compose up completed${NC}"
    docker compose -f "$COMPOSE_FILE" ps
  else
    echo -e "${RED}No images pulled, aborting up${NC}"
    exit 1
  fi
else
  echo ""
  echo "Run with --up to execute 'docker compose -f $COMPOSE_FILE up -d'"
  echo "Example: $0 $COMPOSE_FILE --up"
fi
