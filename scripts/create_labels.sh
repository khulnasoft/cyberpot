#!/usr/bin/env bash
# create_labels.sh - Create GitHub labels from .github/labels.yml
# Requires: gh CLI authenticated (gh auth login) or GITHUB_TOKEN
# Usage: ./scripts/create_labels.sh [--dry-run]
set -euo pipefail
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

LABELS_FILE=".github/labels.yml"
if [[ ! -f "$LABELS_FILE" ]]; then
  echo "Labels file not found: $LABELS_FILE" >&2; exit 1
fi

if ! command -v yq >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  echo "Need yq or python3 to parse YAML" >&2; exit 1
fi

# Use python to parse YAML
python3 << 'PY' | while read -r name color desc; do
import yaml, pathlib, shlex
labels = yaml.safe_load(pathlib.Path(".github/labels.yml").read_text())
for l in labels:
    # escape for bash
    name = l["name"]
    color = l["color"].lstrip("#")
    desc = l.get("description","").replace('"','\\"')
    print(f'{name}\t{color}\t{desc}')
PY
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] would create: $name ($color) - $desc"
  else
    if command -v gh >/dev/null 2>&1; then
      gh label create "$name" --color "$color" --description "$desc" --force 2>&1 | sed 's/^/  /' || echo "  failed $name"
    else
      echo "  gh not found, would create: $name"
    fi
  fi
done
