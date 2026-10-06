# CyberPot Build — Canonical Tools

**Version:** `24.04.2` (single source: `version` + `config/defaults.yml` + `scripts/lib/version.py`)

## Quick Start

```bash
# Setup buildx + QEMU (once)
make setup-buildx
# or
bash scripts/setup_buildx.sh

# Build cyberpot-init locally (no push)
make cyberpot-init
# Equivalent:
CYBERPOT_VERSION=$(cat version) docker buildx bake cyberpot-init

# Build & push (needs docker login + ghcr.io login)
make cyberpot-init-push
# Equivalent:
CYBERPOT_VERSION=$(cat version) docker buildx bake --push cyberpot-init

# Build dot-init (dynamic init, dotfiles)
make dot-init
docker buildx bake --print dot-init

# Build all honeypots via strategy (47 images)
make generate-strategy > /tmp/strategy.json
cat /tmp/strategy.json | jq '.matrix.include[].name'

# Check for dangling Dockerfiles (should be 0)
make check-dangling
# Manual:
# allDockerfiles="$(git ls-files '*/Dockerfile' | jq -Rsc 'rtrimstr("\n") | split("\n")')"
# danglingDockerfiles="$(jq <<<"$strategy" -c --argjson allDockerfiles "$allDockerfiles" '$allDockerfiles - [ .matrix.include[].meta.dockerfiles[] ]')"
```

## Canonical Build Definition

**`docker-bake.hcl`** is the single source of truth:
- `group default/all` → `cyberpot-init`, `dot-init`
- `target _common` → `platforms [linux/amd64,linux/arm64]`, `cache gha`, `provenance max`, `sbom true`
- `target cyberpot-init` → `context docker/cyberpot-init`, `tags docker.io/khulnasoft/cyberpot-init:${VERSION} + ghcr.io/...:latest`

**Version single source:**
```bash
python scripts/lib/version.py              # 24.04.2
python scripts/lib/version.py --bump patch --write  # 24.04.3
CYBERPOT_VERSION=$(python scripts/lib/version.py) docker buildx bake
```

**Shared config:** `config/defaults.yml` holds `registry.order`, `version`, `pull_policy` — used by `install.sh` (via yq) and `docker-bake.hcl` (via variable).

## Legacy Builder (Deprecated)

`docker/_builder/builder.sh` and `setup_builder.sh` are **deprecated** (see header warning). Use:
```bash
# Old (deprecated, requires root + tc):
sudo docker/_builder/builder.sh -p

# New (canonical, no root, no tc):
make setup-buildx
make cyberpot-init
```

## CI

`.github/workflows/validate.yml` runs `make validate` + `make lint` + `make check-dangling` + `docker buildx bake --print`.
`.github/workflows/cyberpot-init.yml` (new) will build & push on `master` tag.

## Troubleshooting

- `Multi-platform build is not supported for docker driver` → `make setup-buildx` (creates `mybuilder` with `docker-container` driver)
- `hadolint not installed` → `make lint` skip, install via `brew install hadolint` or `docker run hadolint/hadolint`
- `manifest unknown` for `24.04.2` → run `make fast-pull` fallback or `make tag-dockerhub` + `make push`
