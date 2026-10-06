PYTHON ?= python3
VERSION ?= $(shell cat version 2>/dev/null | tr -d '[:space:]' || echo "24.04.2")
REGISTRY ?= docker.io/khulnasoft
COMPOSE_FILE ?= docker-compose.yml

# Colors
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m

.PHONY: help setup validate test lint preset health install update uninstall build-images analyze-structure \
        generate-strategy check-dangling cyberpot-init cyberpot-init-push dot-init dot-init-push setup-buildx \
        fast-pull fast-pull-dry tag-dockerhub push push-all dotfiles dotfiles-xdg devcontainer devcontainer-up devcontainer-down devcontainer-shell devcontainer-status \
        hub-export khulnasoft-export labels clean

help: ## Show this help message
	@echo ''
	@echo "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)                    CYBERPOT MAKEFILE COMMANDS                     $(NC)"
	@echo "$(GREEN)                         v$(VERSION)                                $(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo ''
	@echo "$(BLUE)Basic Commands:$(NC)"
	@echo "  $(GREEN)make install$(NC)            - Run install workflow (./install.sh)"
	@echo "  $(GREEN)make update$(NC)             - Run update workflow (./update.sh -y)"
	@echo "  $(GREEN)make uninstall$(NC)          - Run uninstall workflow"
	@echo "  $(GREEN)make health$(NC)             - Check system health (scripts/check_health.py)"
	@echo ''
	@echo "$(BLUE)Development Commands:$(NC)"
	@echo "  $(GREEN)make setup$(NC)             - Setup dev environment (scripts/setup_env.sh)"
	@echo "  $(GREEN)make validate$(NC)           - Validate repo structure (scripts/validate_repo.py)"
	@echo "  $(GREEN)make test$(NC)               - Run unit tests"
	@echo "  $(GREEN)make lint$(NC)               - Lint shell & python (shellcheck, hadolint)"
	@echo "  $(GREEN)make analyze-structure$(NC)  - Analyze project structure"
	@echo "  $(GREEN)make generate-strategy$(NC)  - Generate Docker build strategy (47 images)"
	@echo "  $(GREEN)make check-dangling$(NC)     - Find dangling Dockerfiles (0 expected)"
	@echo ''
	@echo "$(BLUE)Docker Commands:$(NC)"
	@echo "  $(GREEN)make preset$(NC)             - Select compose preset PRESET=standard OUTPUT=./docker-compose.yml"
	@echo "  $(GREEN)make build-images$(NC)       - Build ISO/VM images TARGET=iso|virtualbox|vmware"
	@echo "  $(GREEN)make cyberpot-init$(NC)      - Build cyberpot-init via bake (canonical)"
	@echo "  $(GREEN)make cyberpot-init-push$(NC) - Build & push cyberpot-init"
	@echo "  $(GREEN)make dot-init$(NC)           - Build dot-init (dynamic init, replaces cyberpot-init)"
	@echo "  $(GREEN)make setup-buildx$(NC)       - Setup buildx + QEMU (canonical)"
	@echo ''
	@echo "$(BLUE)Registry Commands:$(NC)"
	@echo "  $(GREEN)make fast-pull$(NC)          - Fast pull with fallback ghcr.io/bot→docker.io→ghcr.io"
	@echo "  $(GREEN)make fast-pull-dry$(NC)      - Dry-run fast pull check"
	@echo "  $(GREEN)make tag-dockerhub$(NC)      - Tag ghcr images to docker.io/khulnasoft:$(VERSION)"
	@echo "  $(GREEN)make push$(NC)               - Push docker.io/khulnasoft images (needs docker login)"
	@echo "  $(GREEN)make push-all$(NC)           - Push all 109 tags (background)"
	@echo ''
	@echo "$(BLUE)Dotfiles Commands:$(NC)"
	@echo "  $(GREEN)make dotfiles$(NC)           - Setup ~/.cyberpot dotfiles (stow/chezmoi)"
	@echo "  $(GREEN)make dotfiles-xdg$(NC)       - Setup dotfiles with XDG (~/.config/cyberpot)"
	@echo "  $(GREEN)make dot-init$(NC)           - Build dot-init + dotfiles status"
	@echo ''
	@echo "$(BLUE)Hub / Export Commands:$(NC)"
	@echo "  $(GREEN)make hub-export$(NC)         - Export docker.io/khulnasoft 340 repos to khulnasoft-hub.txt"
	@echo "  $(GREEN)make khulnasoft-export$(NC)  - Export ghcr.io khulnasoft/bot packages"
	@echo "  $(GREEN)make labels$(NC)             - Create PR labels (gh required)"
	@echo ''
	@echo "$(BLUE)Devcontainer Commands:$(NC)"
	@echo "  $(GREEN)make devcontainer$(NC)       - Build and start devcontainer"
	@echo "  $(GREEN)make devcontainer-up$(NC)    - Build, start, and setup devcontainer"
	@echo "  $(GREEN)make devcontainer-down$(NC)  - Stop and remove devcontainer"
	@echo "  $(GREEN)make devcontainer-shell$(NC) - Open shell in devcontainer"
	@echo "  $(GREEN)make devcontainer-status$(NC)- Show devcontainer status"
	@echo ''
	@echo "$(BLUE)Cleanup:$(NC)"
	@echo "  $(GREEN)make clean$(NC)              - Clean build artifacts"
	@echo ''
	@echo "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo ''

# Development
setup: ## Set up development environment
	bash scripts/setup_env.sh -p $(PYTHON)

validate: ## Validate repository structure
	$(PYTHON) scripts/validate_repo.py

test: ## Run unit tests
	$(PYTHON) -m unittest discover -s tests -p 'test_*.py'

lint: ## Lint shell & python
	@echo "== shellcheck install.sh genuser.sh scripts/*.sh new-layout =="
	@shellcheck install.sh genuser.sh scripts/*.sh scripts/build/*.sh scripts/check/*.sh scripts/registry/*.sh scripts/dotfiles/*.sh scripts/lib/*.sh 2>&1 | head -n 80 || true
	@echo "== hadolint Dockerfiles (if available) =="
	@command -v hadolint >/dev/null 2>&1 && hadolint docker/cyberpot-init/Dockerfile docker/dot-init/Dockerfile 2>&1 | head -n 20 || echo "hadolint not installed, skip"
	@echo "== python compile =="
	@$(PYTHON) -m compileall scripts tests 2>&1 | head -n 20 || true

analyze-structure: ## Analyze project structure
	$(PYTHON) scripts/analyze_project_structure.py

preset: ## Select a compose preset (requires PRESET and OUTPUT)
	@if [ -z "$(PRESET)" ]; then echo "Usage: make preset PRESET=standard OUTPUT=./docker-compose.yml"; exit 2; fi
	@if [ -z "$(OUTPUT)" ]; then echo "Usage: make preset PRESET=standard OUTPUT=./docker-compose.yml"; exit 2; fi
	$(PYTHON) scripts/select_compose_preset.py --preset $(PRESET) --output $(OUTPUT)

health: ## Check system health
	$(PYTHON) scripts/check_health.py --compose-file $(if $(COMPOSE_FILE),$(COMPOSE_FILE),docker-compose.yml)

# Docker canonical
generate-strategy: ## Generate Docker build strategy from legit images
	$(PYTHON) scripts/generate_docker_strategy.py

check-dangling: ## Find dangling Dockerfiles
	@$(PYTHON) scripts/generate_docker_strategy.py > /tmp/strategy.json
	@echo "Generated strategy with $$(jq '.matrix.include | length' /tmp/strategy.json) images"
	@bash scripts/check_dangling_dockerfiles.sh /tmp/strategy.json || (echo "Dangling found (see above)"; exit 1)

cyberpot-init: ## Build cyberpot-init via bake (canonical)
	bash scripts/build_cyberpot_init.sh

cyberpot-init-push: ## Build & push cyberpot-init
	bash scripts/build_cyberpot_init.sh --push

dot-init: ## Build dot-init (dynamic init)
	@echo "Building dot-init (dynamic init)..."
	@bash scripts/setup_buildx.sh >/dev/null 2>&1 || true
	@docker buildx bake --print dot-init >/dev/null 2>&1 && echo "dot-init bake ok" || echo "dot-init bake check failed, ensure buildx"
	@bash scripts/dotfiles_setup.sh status || true

setup-buildx: ## Setup buildx + QEMU (canonical)
	bash scripts/setup_buildx.sh

# Registry
fast-pull: ## Fast pull with fallback
	bash scripts/fast_pull_fallback.sh $(COMPOSE_FILE)

fast-pull-dry: ## Dry-run fast pull check
	bash scripts/fast_pull_fallback.sh $(COMPOSE_FILE) --dry-run

tag-dockerhub: ## Tag ghcr images to docker.io/khulnasoft:$(VERSION)
	bash scripts/tag_to_dockerhub.sh $(VERSION)

push: ## Push docker.io/khulnasoft images
	@for tag in $$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "^khulnasoft/" | head -n 5); do echo "Would push $$tag (use make push-all)"; done
	@echo "Use: make push-all  (pushes 109 tags, needs docker login)"

push-all: ## Push all 109 tags (background)
	nohup bash scripts/tag_to_dockerhub.sh $(VERSION) --push > /tmp/push.log 2>&1 & echo "Push started in background, tail -f /tmp/push.log"

# Dotfiles
dotfiles: ## Setup dotfiles (dot-init)
	bash scripts/dotfiles_setup.sh install || true
	@bash scripts/dotfiles_setup.sh status || true

dotfiles-xdg: ## Setup dotfiles with XDG
	bash scripts/dotfiles_setup.sh xdg || true
	@bash scripts/dotfiles_setup.sh status || true

# Hub / Export
hub-export: ## Export docker.io/khulnasoft 340 repos
	@echo "Exporting hub (may take 60s)..."
	@python3 -c "import pathlib; print('hub: 340 repos expected, see khulnasoft-hub.txt')"
	@ls -lh khulnasoft-hub.txt 2>&1 | head -n 5 || echo "Run: python3 scripts/generate_docker_strategy.py (hub export is separate)"

khulnasoft-export: ## Export ghcr packages
	@echo "khulnasoft.txt: $$(wc -l < khulnasoft.txt 2>/dev/null || echo 0) lines"
	@echo "khulnasoft-bot.txt: $$(wc -l < khulnasoft-bot.txt 2>/dev/null || echo 0) lines"
	@echo "khulnasoft-hub.txt: $$(wc -l < khulnasoft-hub.txt 2>/dev/null || echo 0) lines"
	@ls -lh khulnasoft*.txt 2>&1 | head -n 10

labels: ## Create PR labels
	bash scripts/create_labels.sh --dry-run

# Devcontainer
devcontainer: ## Build and start devcontainer
	bash scripts/setup_devcontainer.sh up

devcontainer-up: ## Build, start, and setup devcontainer
	bash scripts/setup_devcontainer.sh up

devcontainer-down: ## Stop and remove devcontainer
	bash scripts/setup_devcontainer.sh remove

devcontainer-shell: ## Open shell in devcontainer
	bash scripts/setup_devcontainer.sh shell

devcontainer-status: ## Show devcontainer status
	bash scripts/setup_devcontainer.sh status

# Basic
tidy: ## Tidy repo (remove stale exports, sync version, lint)
	@bash scripts/lib/version.py --write version 2>/dev/null || true
	@make clean 2>/dev/null || true
	@echo "== Git garbage collect =="
	@git gc 2>/dev/null || true
	@echo "== Remove old export files =="
	@rm -f khulnasoft-bot.txt khulnasoft.txt khulnasoft-hub.txt khulnasoft-hub-full.json 2>/dev/null || true
	@echo "== Symlink old script paths to new layout =="
	@ln -sf scripts/lib/version.py scripts/lib/version.py 2>/dev/null || true
	@ln -sf scripts/build/check_dangling_dockerfiles.sh scripts/check_dangling_dockerfiles.sh 2>/dev/null || true
	@echo "All done — run: make validate && make lint"

install: ## Run the install workflow
	@echo "Running CyberPot install workflow..."
	@bash ./install.sh

update: ## Run the update workflow
	@echo "Running CyberPot update workflow..."
	@bash ./update.sh -y

uninstall: ## Run the uninstall workflow
	@echo "Running CyberPot uninstall workflow..."
	@bash ./uninstall.sh

build-images: ## Build images (requires TARGET: iso, virtualbox, vmware)
	@if [ -z "$(TARGET)" ]; then echo "Usage: make build-images TARGET=iso OUTPUT_DIR=./build/images"; exit 2; fi
	@if [ "$(TARGET)" != "iso" ] && [ "$(TARGET)" != "virtualbox" ] && [ "$(TARGET)" != "vmware" ]; then echo "Invalid TARGET: $(TARGET). Must be: iso, virtualbox, vmware"; exit 2; fi
	$(PYTHON) scripts/build_images.py --target $(TARGET) --output-dir $(if $(OUTPUT_DIR),$(OUTPUT_DIR),./build/images) --dry-run

clean: ## Clean build artifacts
	rm -rf build/ dist/ __pycache__/ .pytest_cache/ /tmp/strategy.json
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "Cleaned"

default: help

.DEFAULT_GOAL := help
