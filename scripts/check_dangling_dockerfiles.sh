#!/usr/bin/env bash
# check_dangling_dockerfiles.sh - Find Dockerfiles not covered by build strategy
# Usage:
#   ./scripts/check_dangling_dockerfiles.sh [strategy.json]
#   cat strategy.json | ./scripts/check_dangling_dockerfiles.sh
#   STRATEGY='{"matrix":{"include":[{"meta":{"dockerfiles":["docker/cowrie/Dockerfile"]}}]}}' ./scripts/check_dangling_dockerfiles.sh
#
# Implements:
#   allDockerfiles="$(git ls-files '*/Dockerfile' | jq -Rsc 'rtrimstr("\n") | split("\n")')"
#   danglingDockerfiles="$(jq <<<"$strategy" -c --argjson allDockerfiles "$allDockerfiles" '$allDockerfiles - [ .matrix.include[].meta.dockerfiles[] ]')"
set -euo pipefail

# Resolve repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Get strategy JSON
strategy=""
if [[ $# -gt 0 && -f "$1" ]]; then
  strategy="$(cat "$1")"
elif [[ $# -gt 0 && "$1" != "-" ]]; then
  # arg is JSON string
  strategy="$1"
elif [[ ! -t 0 ]]; then
  # stdin
  strategy="$(cat)"
else
  # Try env var
  strategy="${STRATEGY:-}"
fi

if [[ -z "$strategy" ]]; then
  echo "Usage: $0 [strategy.json] or pipe strategy JSON via stdin" >&2
  echo "Example: git ls-files '*/Dockerfile' | jq -Rsc ... | $0 strategy.json" >&2
  exit 2
fi

# Validate strategy is JSON
if ! jq -e . >/dev/null 2>&1 <<<"$strategy"; then
  echo "Invalid JSON strategy" >&2
  exit 2
fi

# Get all Dockerfiles tracked by git (fallback to find if not a git repo), exclude .devcontainer
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  allDockerfiles="$(git ls-files '*/Dockerfile' | grep -v '^\.devcontainer/' | jq -Rsc 'rtrimstr("\n") | split("\n") | map(select(length > 0))')"
else
  allDockerfiles="$(find . -path '*/Dockerfile' -type f ! -path './.devcontainer/*' | sort | jq -Rsc 'rtrimstr("\n") | split("\n") | map(select(length > 0))')"
fi

# Compute dangling: all - [matrix.include[].meta.dockerfiles[]]
# Handles missing .matrix or .meta.dockerfiles gracefully
danglingDockerfiles="$(jq -c --argjson allDockerfiles "$allDockerfiles" '
  ($allDockerfiles // []) as $all
  | (try [.matrix.include[].meta.dockerfiles[]] // []) as $covered
  | ($all - $covered)
' <<<"$strategy")"

# Also compute covered for reporting
coveredCount="$(jq -r --argjson allDockerfiles "$allDockerfiles" '
  (try [.matrix.include[].meta.dockerfiles[]] // [] | length)
' <<<"$strategy")"
allCount="$(jq -r 'length' <<<"$allDockerfiles")"
danglingCount="$(jq -r 'length' <<<"$danglingDockerfiles")"

# Output
echo "All Dockerfiles: $allCount"
echo "Covered: $coveredCount"
echo "Dangling: $danglingCount"
echo ""
if [[ "$danglingCount" -gt 0 ]]; then
  echo "Dangling Dockerfiles:"
  jq -r '.[]' <<<"$danglingDockerfiles" | sed 's/^/  - /'
  echo ""
  echo "JSON:"
  echo "$danglingDockerfiles" | jq .
  exit 1
else
  echo "No dangling Dockerfiles - all covered!"
  echo "$danglingDockerfiles" | jq .
  exit 0
fi
