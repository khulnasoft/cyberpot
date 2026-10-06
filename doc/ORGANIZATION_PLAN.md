# CyberPot Codebase Organization & Enhancement Plan

**Date:** 2026-08-25  
**Version:** 24.04.2  
**Scope:** Full repo (`compose`, `docker` 41 dirs, 50 Dockerfiles, `installer` 11, `scripts` 18, `tests` 6, `doc` 15)  
**Basis:** `make analyze-structure` + manual audit (744 py files repo-wide, 67 sh, 52 Dockerfiles, 81 yml)

---

## 1. Current Structure (as-is)

```
. (25 top-level)
├── compose/ (9: standard.yml 22k, sensor.yml, mini.yml, llm.yml, mobile.yml, tarpit.yml, customizer.py, cyberpot_services.yml, mac_win.yml)
├── docker/ (42 dirs, 50 Dockerfiles) — honeypots + elk + cyberpot-init + dot-init + _builder
├── installer/ (2: install/cyberpot.yml 457 LOC, remove/)
├── scripts/ (18, 2156 LOC) — validate, analyze, build_images, check_health, fast_pull_*, generate_strategy, check_dangling, dotfiles_setup, setup_buildx
├── tests/ (6) — test_build_images, test_check_health, etc.
├── doc/ (15) — refactoring-plan-cyberpot-init.md, ORGANIZATION_PLAN.md (new)
├── .github/ (workflows: validate, docker-publish, pr-labeler, 5 total)
├── Makefile (213 LOC, 25 targets), docker-bake.hcl, docker-compose.yml (876 LOC, ${CYBERPOT_REPO}:24.04.2), .env/env.example (166 LOC)
├── dotfiles/cyberpot/.cyberpot/.env (stow package), data/ (runtime, gitignored)
└── version (24.04.2)
```

**Validate:** `make validate` checks `README, docker-compose.yml, compose/, docker/, installer/, scripts/, tests/` + yaml load of 8 compose files — passes.

---

## 2. Strengths

- **Clear boundary:** `compose/` (templates) vs `docker/` (images) — good.
- **Scripts consolidation:** `scripts/` is single helper layer (was 5, now 14 after canonical tools) — good base.
- **Tests:** `tests/` exists with `test_*.py` + `make test`.
- **Docs:** `doc/` 15 files, `CHANGELOG`, `SECURITY`, `CITATION`.
- **Automation:** `docker-bake.hcl` + `Makefile` 25 targets, `setup_buildx` canonical.

---

## 3. Weaknesses & Duplication

| Area | Issue | Impact |
|------|-------|--------|
| **Top-level clutter** | 25 entries, `dotfiles/`, `data/`, `dps.ps1`, `deploy.sh` in root | Hard to discover |
| **Dockerfiles** | 50, but only 47 in `generate_docker_strategy` matrix (`.devcontainer` excluded, `deprecated/` 4 still copied in `dot-init` dist) | Dangling risk, bloat |
| **Scripts sprawl** | 18 files, 2156 LOC, 3 overlapping pull fallbacks (`fast_pull_fallback.sh`, `fast_pull_check.py`, `tag_to_dockerhub.sh`), 2 dangling checkers (`.sh` + `.py`) | Maintenance |
| **Installer drift** | `install.sh` (423 LOC) duplicates `check_var`/`genuser` logic from `docker/cyberpot-init/dist/bin/genuser.sh` (115 LOC) | Drift, bug fixes need 2 places |
| **Compose duplication** | `docker-compose.yml` 876 LOC duplicates `compose/*.yml` (8 templates) — `select_compose_preset.py` copies, but no single source | Drift if manual edit |
| **Version single-source** | `version` file, but `docker/*/Dockerfile` hardcoded `FROM alpine:3.20` and `env.example` comments outdated after `ghcr→docker.io` | Missed bump |
| **Builder duplication** | `docker/_builder/builder.sh` (root+tc) vs `scripts/setup_buildx.sh` (canonical) both exist | Confusion |
| **Docs vs code** | `doc/` 15 but `README` 62k, `install.sh` logic not documented | Onboarding hard |

---

## 4. Reorganization Proposal (Target)

```
cyberpot/
├── Makefile (keep, but slim to 15 core targets, delegate to scripts/)
├── Taskfile.yml (optional, alternative to Makefile for contributors preferring Go Task)
├── version
├── .env.example (tracked) + .env (ignored)
├── compose/ (keep, but generate from single source: compose/cyberpot_services.yml)
├── docker/
│   ├── _bake/ (new: bake files per service, or keep single docker-bake.hcl at root)
│   ├── _base/ (new: shared base images, e.g., alpine:3.22 + common deps)
│   ├── cyberpot-init/ (keep) + dot-init/ (merge or keep as alias)
│   └── <honeypot>/ (41 → 47, keep)
├── dotfiles/ (keep, but move to config/dotfiles/ or keep at root for stow)
├── config/ (new: shared config layer for installer + compose)
│   ├── env.schema.json (validate .env)
│   ├── cyberpot.schema.json
│   └── defaults.yml (single source for CYBERPOT_REPO, VERSION, etc.)
├── scripts/
│   ├── lib/ (new: shared helpers: common.sh, registry.py, version.py)
│   ├── build/ (new: build_images.py, generate_strategy.py, setup_buildx.sh)
│   ├── check/ (new: validate_repo.py, check_health.py, check_dangling*.sh/py)
│   ├── registry/ (new: fast_pull_*.sh/py, tag_to_dockerhub.sh)
│   └── dotfiles/ (move dotfiles_setup.sh here)
├── tests/
│   ├── unit/ (existing)
│   └── integration/ (new: compose config, docker build smoke)
├── docs/ (rename doc/ → docs/ for standard, keep 15, add BUILD.md, DOTFILES.md, ARCHITECTURE.md)
├── .github/
│   ├── labels.yml, labeler.yml (done), workflows/* (add cyberpot-init.yml, dangling-check.yml)
│   └── PULL_REQUEST_TEMPLATE.md (done)
└── data/ (gitignored, runtime)
```

**Key moves:**
- `scripts/` split into `lib/`, `build/`, `check/`, `registry/`, `dotfiles/` — reduces 18 → 4 groups.
- `docker/_builder/` → deprecated, logic moved to `scripts/setup_buildx.sh` + `docker-bake.hcl`.
- `dotfiles/` → `config/dotfiles/` or keep at root but document XDG.
- `doc/` → `docs/` (standard), add `BUILD.md` (canonical `make cyberpot-init`), `ARCHITECTURE.md` (compose vs docker boundary).

---

## 5. Enhancement Plan (Phases)

### Phase 1 — Organize (1 week, no break)
- [ ] **Lint gate:** add `make lint` already (shellcheck/hadolint) to `validate.yml` as required check
- [ ] **Single source version:** `scripts/lib/version.py` reads `version` and injects into `docker-bake.hcl` `CYBERPOT_VERSION` and `.env` via `scripts/setup_env.sh` (already does)
- [ ] **Clean top-level:** `make clean` already, add `make tidy` to remove `dotfiles/cyberpot/.env` duplicates, ensure `data/` ignored
- [ ] **Move builder:** deprecate `docker/_builder/builder.sh` with warning `echo "Use scripts/setup_buildx.sh"` and symlink
- [ ] **Docs:** add `docs/BUILD.md` (from `doc/refactoring-plan-cyberpot-init.md` Quick Start) and `docs/DOTFILES.md` (from `scripts/dotfiles_setup.sh --help`)

### Phase 2 — Automate (2 weeks)
- [ ] **Bake all honeypots:** extend `docker-bake.hcl` from `cyberpot-init`+`dot-init` to full `matrix` via `generate_docker_strategy.py` (47 images), share `_common` cache
- [ ] **CI:** new `cyberpot-init.yml` + `all-images.yml` (build 47 on PR, push on `master` tag), include `trivy`/`cosign`/`SBOM` (from plan)
- [ ] **Dangling gate:** `make check-dangling` already, add to `validate.yml` as `needs: generate-strategy`
- [ ] **Registry fallback:** keep `fast_pull_*` but move to `scripts/registry/` and use `config/defaults.yml` for `REGISTRIES` list (single source)

### Phase 3 — Enhance (1 month)
- [ ] **Shared config:** `config/defaults.yml` holds `CYBERPOT_REPO, VERSION, PULL_POLICY` — both `install.sh` and `compose/*.yml` source it via `yq`, eliminating drift
- [ ] **Tests:** add `tests/integration/test_compose.py` (load 8 compose files, check `image:` uses `docker.io` and `24.04.2`), `tests/integration/test_docker_build.py` (bake --print)
- [ ] **Docs:** `docs/ARCHITECTURE.md` (diagram: `installer` → `cyberpot-init` → `compose` → `docker`), `docs/CONTRIBUTING.md` (how to add honeypot: add `docker/<name>/Dockerfile` → `generate_docker_strategy` → `make check-dangling`)
- [ ] **Versioning:** automate `scripts/bump_version.sh` (updates `version`, `CHANGELOG`, `docker-bake.hcl`, `env.example`) + `git tag` via `make release VERSION=24.04.3`

---

## 6. Validation

- `make validate` — 8 compose files
- `make test` — 5 tests
- `make analyze-structure` — docker:42→47, scripts:18→~12 after lib split, Dockerfiles:50 (excl .devcontainer)
- `make check-dangling` — 0
- `make lint` — shellcheck 0, hadolint 0
- `docker buildx bake --print` — valid JSON for 47 images

---

## 7. Rollout

1. Branch `refactor/organize` → PR `area:scripts` + `area:docs` + `pr:chore`
2. Review with `make analyze-structure` before/after
3. Merge → next version `24.04.3` uses new layout, old `docker/_builder` kept 1 release with deprecation warning

---

## Appendix: Quick Commands (Post-Plan)

```bash
make lint && make validate && make check-dangling  # pre-PR
make generate-strategy > /tmp/strategy.json && make check-dangling
make cyberpot-init && make dot-init && make dotfiles
make fast-pull-dry && make health
```
