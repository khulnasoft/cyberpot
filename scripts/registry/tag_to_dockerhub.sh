#!/usr/bin/env bash
# tag_to_dockerhub.sh - Move all docker.io/khulnasoft images to docker.io/khulnasoft with new version tag
# Usage: ./scripts/tag_to_dockerhub.sh [new_version] [--push]
#   new_version default: 24.04.2 (from version file)
#   --push : also push to docker.io (requires docker login)
set -euo pipefail
NEW_VERSION="${1:-}"
if [[ "$NEW_VERSION" == "--push" ]]; then NEW_VERSION=""; fi
PUSH=0
for arg in "$@"; do [[ "$arg" == "--push" ]] && PUSH=1; done

if [[ -z "$NEW_VERSION" || "$NEW_VERSION" == "--push" ]]; then
  if [[ -f version ]]; then NEW_VERSION=$(<version)
  elif [[ -f /workspaces/cyberpot/version ]]; then NEW_VERSION=$(< /workspaces/cyberpot/version)
  else NEW_VERSION="24.04.2"; fi
fi
NEW_VERSION="${NEW_VERSION#=}"
NEW_VERSION="${NEW_VERSION#=}"

echo "=== Tagging docker.io/khulnasoft -> docker.io/khulnasoft ==="
echo "New version: $NEW_VERSION"
echo "Push: $PUSH"
echo ""

# Get unique IDs
docker images --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep "docker.io/khulnasoft" | sort -u -k1,1 | while read -r id repo_tag; do
  repo=$(echo "$repo_tag" | cut -d: -f1)
  tag=$(echo "$repo_tag" | cut -d: -f2)
  base=$(basename "$repo")
  [[ -z "$tag" ]] && tag="$NEW_VERSION"
  echo "Tagging $id ($repo_tag) -> docker.io/khulnasoft/$base:$tag + :latest + :$NEW_VERSION"
  docker tag "$id" "docker.io/khulnasoft/$base:$tag" 2>&1 || true
  docker tag "$id" "docker.io/khulnasoft/$base:latest" 2>&1 || true
  docker tag "$id" "khulnasoft/$base:$tag" 2>&1 || true
  docker tag "$id" "khulnasoft/$base:latest" 2>&1 || true
  if [[ "$tag" != "$NEW_VERSION" ]]; then
    docker tag "$id" "docker.io/khulnasoft/$base:$NEW_VERSION" 2>&1 || true
    docker tag "$id" "khulnasoft/$base:$NEW_VERSION" 2>&1 || true
  fi
  if [[ $PUSH -eq 1 ]]; then
    echo "  pushing docker.io/khulnasoft/$base:$tag"
    docker push "docker.io/khulnasoft/$base:$tag" || echo "  push failed $base:$tag"
    docker push "docker.io/khulnasoft/$base:latest" || true
    if [[ "$tag" != "$NEW_VERSION" ]]; then
      docker push "docker.io/khulnasoft/$base:$NEW_VERSION" || true
    fi
  fi
done

echo ""
echo "=== Done ==="
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "^khulnasoft/" | sort
echo ""
echo "Total khulnasoft (docker.io) images: $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -cE "^khulnasoft/")"
if [[ $PUSH -eq 0 ]]; then
  echo "To push to Docker Hub, run: $0 $NEW_VERSION --push (requires docker login)"
fi
