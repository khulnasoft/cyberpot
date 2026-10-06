# CyberPot-Init Refactoring Plan — Automate & Enhance Canonical Build Tools

**Scope:** `docker/cyberpot-init/` (Dockerfile, `dist/`, `entrypoint.sh`, `docker-compose.yml`, `macvlan/`)
**Related:** `docker/_builder/` (`builder.sh`, `setup_builder.sh`, `docker-compose.yml`, `.env`), `scripts/build_images.py`, `Makefile`, `.github/workflows/`
**Version:** 24.04.2 → 26.08.x
**Author:** Analysis 2026-08-25

---

## 1. Executive Summary

`cyberpot-init` is the **privileged init container** (host network, `NET_ADMIN`, `docker.sock` ro) that bootstraps every CyberPot deployment: validates `.env`, creates `nginxpasswd`/`lswebpasswd`, generates self-signed certs, manages `blackhole` routes, `iptables`/`conntrack`, `p0f`/`suricata` promisc, `ELK` objects, and `autoheal`. Current build is **manual, imperative, and non-canonical**: `alpine:3.20` Dockerfile with inline `apk` and `git` install-then-delete, `dist/` copied verbatim, no `buildx` bake, no `SBOM`/`provenance`, no `hadolint`/`checkov`, and builder scripts duplicate `buildx`/`qemu` setup. The plan migrates to **canonical, automated, reproducible** tooling: `Docker Buildx Bake`, `Makefile` + `scripts/`, `GitHub Actions` with `cache/gha`, `cosign`/`SBOM`, and `validate` gates.

---

## 2. Current State Analysis

### 2.1 Layout
```
docker/cyberpot-init/
├── Dockerfile (50 LOC, alpine:3.20, COPY dist/ + apk add 18 pkgs + addgroup 2000)
├── docker-compose.yml (17 LOC, build: ., image: docker.io/khulnasoft/cyberpot-init:24.04.2)
├── dist/
│   ├── entrypoint.sh (374 LOC, trap SIGTERM, check_var/check_safety/validate_base64, create_web_users, OSType, figlet)
│   ├── autoheal.sh
│   ├── bin/{genuser.sh, myip.sh, blackhole.sh, rules.sh, clean.sh, ...} (9 + deprecated 8)
│   └── etc/{logrotate/logrotate.conf, objects/elkbase.tgz}
└── macvlan/docker-compose.yml
docker/_builder/
├── builder.sh (150+ LOC, root-only, tc bandwidth, buildx create, qemu, docker login)
├── setup_builder.sh (120 LOC, duplicate buildx/qmu logic)
├── docker-compose.yml (x-common-build anchor, platforms: ${CYBERPOT_AMD64}/${CYBERPOT_ARM64})
└── .env (CYBERPOT_DOCKER_REPO=khulnasoft, GHCR=docker.io/khulnasoft, VERSION=latest)
```

### 2.2 Dockerfile Deep Dive
- **Base:** `alpine:3.20` (good) but `apk --no-cache -U upgrade` + `add` 18 packages including `git` then `apk del git` — extra layer, non-deterministic `upgrade`.
- **User:** `addgroup -g 2000`/`adduser -u 2000` fixed UID/GID (collides with host `cyberpot` user from Ansible), `chmod 0600` on logrotate.
- **Layers:** Single `RUN` is good, but `yq-go` is `yq-go` (should be `yq`), `figlet` not needed at runtime, `lsblk`/`uuidgen` only for cert.
- **Healthcheck:** `HEALTHCHECK --retries=1000 --interval=5s CMD test -f /tmp/success` — no `timeout`, `start-period`, `1000` retries is anti-pattern.
- **No:** `ARG VERSION`, `LABEL org.opencontainers.image.*`, `SHELL`, `hadolint` ignore, `trivy` scan, multi-stage, `COPY --link`, `cache mount`.

### 2.3 Entrypoint & Scripts
- **entrypoint.sh:** 374 LOC, `trap cleanup SIGTERM`, `exec > >(tee /data/cyberpot-init.log)`, `check_var` uses `eval echo \$$var` (unsafe, SC2294), `check_safety` regex `[^a-zA-Z0-9_/.:-]` too strict for `WEB_USER` base64 `+/=` , `validate_base64` loops `for i in ${myCHECK}` (word splitting), `update_permissions` `chown -R 770` on every start (slow), `figlet` x2, `openssl` self-signed cert with `myINTIP` from `ip address show` (fragile), `rules.sh`/`blackhole.sh` called with `${COMPOSE}` = `/tmp/cyberpot/docker-compose.yml` (host path via `cyberpot-init` volume, not verified), `conntrack -D -p udp` after 60s sleep (blocks).
- **dist/bin:** `genuser.sh` same `check_safety` bug, `htpasswd` without `-c`, `clean.sh` handles `CYBERPOT_PERSISTENCE` but `chown` again, `blackhole.sh`/`rules.sh` use `iptables` without `nft` fallback, `autoheal.sh` polls `docker ps` every 5s.
- **Deprecated:** `dist/bin/deprecated/` 8 scripts never referenced in compose, but still copied.

### 2.4 Builder
- **builder.sh:** Requires `root`, duplicates `setup_builder.sh` logic (buildx inspect/create, qemu `multiarch/qemu-user-static --reset`), `tc qdisc tbf 40mbit` bandwidth shaping (not portable, fails in Codespaces), `PUSH_IMAGES` does `docker login` + `docker login ghcr.io` interactively, `PARALLELBUILDS=2` hardcoded, no `bake`, no `SBOM`.
- **setup_builder.sh:** Same `buildx`/`qemu` duplication, checks `groups | grep docker` (SC2143), `mybuilder` hardcoded.
- **docker/_builder/docker-compose.yml:** Uses `x-common-build` anchor correctly, but `context: ../adbhoney/` relative to `_builder` (requires `docker compose -f docker/_builder/docker-compose.yml build` from `_builder` dir, not repo root), no `bake` file, no `cache`.

### 2.5 Automation Gaps
- No `make cyberpot-init` target; `scripts/build_images.py` only scaffolds ISO/VM, not Docker.
- No `hadolint`, `shellcheck`, `shfmt`, `trivy` in CI.
- No `cosign` signing, no `provenance`, no `SBOM`.
- No `docker-bake.hcl` for canonical multi-arch.
- `validate.yml` only `docker compose config` smoke, not `buildx bake --print`.

---

## 3. Issues Found (Prioritized)

| # | Severity | Location | Issue | Impact |
|---|----------|----------|-------|--------|
| 1 | High | `Dockerfile:8-30` | `apk upgrade` + `add git` then `del` = non-reproducible, extra layer | Cache miss, supply chain |
| 2 | High | `entrypoint.sh:30-57` | `eval` + word splitting, `check_safety` breaks base64 `+/=` | False aborts on valid `WEB_USER` |
| 3 | High | `builder.sh/setup_builder.sh` | Duplicate `buildx`/`qemu` 40 LOC, `root` + `tc` not portable | Codespaces fails, drift |
| 4 | Medium | `Dockerfile:47` | `HEALTHCHECK --retries=1000` no `timeout`/`start-period` | Never `unhealthy` correctly |
| 5 | Medium | `dist/` | `deprecated/` copied, `figlet`/`lsblk` at runtime | Bloat, confusion |
| 6 | Medium | `entrypoint.sh:318-321` | `ethtool`/`ip link promisc` fragile `grep "^2: "` | Breaks on `eth1` |
| 7 | Low | `docker-compose.yml:5` | `build: .` without `dockerfile:` explicit, no `args: VERSION` | Not hermetic |
| 8 | Low | `builder.sh:15` | `PARALLELBUILDS=2` hardcoded, no `BUILDKIT_PROGRESS` | Slow |

---

## 4. Canonical Build Tools (Target)

- **Docker Buildx Bake** (`docker-bake.hcl`): single source of truth, `matrix` for `cyberpot-init` + all honeypots, `platforms: [linux/amd64,linux/arm64]`, `cache-from: type=gha`, `cache-to: type=gha,mode=max`, `provenance: true`, `sbom: true`.
- **Makefile**: `make cyberpot-init`, `make cyberpot-init-push`, `make cyberpot-init-validate` (hadolint + shellcheck + check-dangling).
- **GitHub Actions**: `.github/workflows/cyberpot-init.yml` with `docker/setup-buildx`, `docker/metadata-action`, `docker/build-push-action`, `cosign`, `trivy`.
- **Lint/Scan**: `hadolint`, `shellcheck`, `shfmt`, `checkov`, `trivy`, `cosign verify`.
- **Versioning**: `ARG CYBERPOT_VERSION` from `version` file, injected via `bake` `args`, `LABEL org.opencontainers.image.version`.

---

## 5. Refactoring Plan (3 Phases)

### Phase 1 — Automate & Fix (1-2 days, no breaking change)
1. **Dockerfile** → multi-stage, pinned `alpine:3.22` digest, `ARG VERSION`, `LABEL`, `COPY --link`, `RUN --mount=type=cache,target=/var/cache/apk`, remove `git`/`figlet`/`lsblk` from runtime (keep `yq`, `jq`, `bash`, `iptables`, `conntrack-tools`, `openssl`, `apache2-utils`, `cracklib`).
2. **entrypoint.sh** → `shellcheck` clean: replace `eval` with `printenv`/`declare -n`, fix `check_safety` to allow `+/=` for `WEB_USER`, add `set -euo pipefail`, `trap` idempotent, `HEALTHCHECK CMD` with `timeout` + `start-period`.
3. **Create `docker-bake.hcl`** at repo root:
   ```hcl
   group "default" { targets = ["cyberpot-init"] }
   target "cyberpot-init" {
     context = "docker/cyberpot-init"
     dockerfile = "Dockerfile"
     platforms = ["linux/amd64","linux/arm64"]
     args = { CYBERPOT_VERSION = "24.04.2" }
     tags = ["docker.io/khulnasoft/cyberpot-init:24.04.2","ghcr.io/khulnasoft/cyberpot-init:24.04.2"]
     cache-from = ["type=gha"] cache-to = ["type=gha,mode=max"]
     output = ["type=image,push=false"]
   }
   ```
4. **Merge `builder.sh` + `setup_builder.sh`** → `scripts/setup_buildx.sh` (single, non-root, no `tc`, `qemu` via `tonistiigi/binfmt`), add `scripts/build_cyberpot_init.sh` wrapper: `docker buildx bake cyberpot-init`.

### Phase 2 — Enhance Canonical (1 week)
5. **Makefile** targets:
   ```make
   cyberpot-init: ## Build cyberpot-init locally
   	docker buildx bake cyberpot-init
   cyberpot-init-push: ## Build & push
   	docker buildx bake --push cyberpot-init
   cyberpot-init-validate: ## Lint
   	hadolint docker/cyberpot-init/Dockerfile
   	shellcheck docker/cyberpot-init/dist/*.sh docker/cyberpot-init/dist/bin/*.sh
   ```
6. **CI** `.github/workflows/cyberpot-init.yml` (replaces `docker-publish.yml` for this image): `on: push to master, PR paths: docker/cyberpot-init/**, workflow_dispatch` → `buildx` + `metadata-action` + `build-push` + `cosign` + `trivy`.
7. **SBOM/Provenance**: `provenance: mode=max`, `sbom: true`, attestations.
8. **Clean `dist/`**: Move `deprecated/` to `archive/`, remove `figlet` from runtime, keep only `autoheal.sh`, `genuser.sh`, `clean.sh`, `rules.sh`, `blackhole.sh`, `entrypoint.sh`.

### Phase 3 — Standardize (2 weeks)
9. **All honeypots** (`docker/adbhoney`, `cowrie`, etc.) migrate to same `docker-bake.hcl` with `matrix` (via `scripts/generate_docker_strategy.py` output), share `x-common-build`.
10. **Deprecate `docker/_builder/`**: keep `docker-compose.yml` as `bake` `group`, remove `builder.sh` `tc` logic, keep `setup_builder.sh` as thin wrapper around `scripts/setup_buildx.sh`.
11. **Docs**: Update `doc/` with `BUILD.md` (canonical `make cyberpot-init` vs `docker buildx bake`).

---

## 6. Automation Enhancements

| Current | Canonical |
|---------|-----------|
| `docker build -t ... .` | `make cyberpot-init` / `docker buildx bake` |
| `builder.sh -p` (root + tc) | `make cyberpot-init-push` (user, no tc) |
| Manual `docker login` | `docker/login-action` in CI |
| No cache | `cache gha` + `registry` |
| No scan | `trivy` + `hadolint` in `validate.yml` |
| No SBOM | `sbom: true` + `cosign` |

**Script: `scripts/build_cyberpot_init.sh` (new)**
```bash
#!/usr/bin/env bash
set -euo pipefail
: "${CYBERPOT_VERSION:=$(cat version)}"
docker buildx bake --set "cyberpot-init.args.CYBERPOT_VERSION=$CYBERPOT_VERSION" cyberpot-init
```

---

## 7. Validation

- `make cyberpot-init-validate` → `hadolint` 0, `shellcheck` 0, `docker buildx bake --print` valid.
- `make cyberpot-init` → `linux/amd64` image `docker.io/khulnasoft/cyberpot-init:24.04.2` locally, `docker run --rm` `entrypoint.sh` `check_var` passes.
- `make check-dangling` → 0 dangling (excluding `.devcontainer`).
- CI: `cyberpot-init.yml` pushes to `docker.io` + `ghcr.io` with `latest` + `24.04.2` + `sha`.

---

## 8. Rollout

1. **Branch** `refactor/cyberpot-init-canonical`
2. **PR** with `area:docker` + `pr:enhancement` labels (from `.github/labels.yml`)
3. **Review** with `make analyze-structure` (docker:41, scripts:14)
4. **Merge** → tag `24.04.2` already, next `24.04.3` will use new pipeline.

---

## Appendix: Quick Start (Post-Refactor)

```bash
# Local
make cyberpot-init
docker run --rm -v $HOME/cyberpot:/data docker.io/khulnasoft/cyberpot-init:24.04.2 /opt/cyberpot/bin/genuser.sh

# Push (CI or maintainer)
make cyberpot-init-push

# Validate
make validate && make analyze-structure && make check-dangling
```
