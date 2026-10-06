#!/usr/bin/env bash
# dotfiles_setup.sh - CyberPot dotfiles management (stow/chezmoi/XDG)
# Implements dotfiles idea for cyberpot-init -> dot-init
# Manages ~/.cyberpot, ~/.config/cyberpot, XDG compliance
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
# shellcheck disable=SC2034
GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

# Defaults
DOTFILES_REPO="$HOME/.cyberpot"
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
CYBERPOT_XDG_CONFIG="$XDG_CONFIG_HOME/cyberpot"
CYBERPOT_XDG_DATA="$XDG_DATA_HOME/cyberpot"
CYBERPOT_XDG_CACHE="$XDG_CACHE_HOME/cyberpot"

MODE="install"
USE_STOW=0
USE_CHEZMOI=0
USE_XDG=0

usage() {
  cat <<EOF
Usage: $0 [install|stow|chezmoi|xdg|status|uninstall] [options]

Dotfiles management for CyberPot (dot-init).

Modes:
  install     Setup ~/.cyberpot dotfiles repo (default)
  stow        Use GNU Stow to symlink dotfiles
  chezmoi     Use chezmoi to manage dotfiles
  xdg         Migrate to XDG (~/.config/cyberpot, ~/.local/share/cyberpot)
  status      Show dotfiles status
  uninstall   Remove dotfiles symlinks

Options:
  --stow      Force stow mode
  --chezmoi   Force chezmoi mode
  --xdg       Enable XDG compliance
  -h, --help  Show help

Examples:
  $0 install
  $0 stow --xdg
  $0 status
  $0 chezmoi
  dotfiles=\$(git --git-dir=\$HOME/.cyberpot.git --work-tree=\$HOME status)

Env:
  DOTFILES_REPO, XDG_CONFIG_HOME, XDG_DATA_HOME
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    install|stow|chezmoi|xdg|status|uninstall) MODE="$1"; shift ;;
    --stow) USE_STOW=1; shift ;;
    --chezmoi) USE_CHEZMOI=1; shift ;;
    --xdg) USE_XDG=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown: $1" >&2; usage; exit 2 ;;
  esac
done

# Helper: ensure dir
ensure_dir() { mkdir -p "$1"; echo -e "${GREEN}✓${NC} $1"; }

# Install mode: setup ~/.cyberpot as dotfiles repo
do_install() {
  echo -e "${BLUE}=== CyberPot Dotfiles Install ===${NC}"
  echo "Repo root: $REPO_ROOT"
  echo "Dotfiles repo: $DOTFILES_REPO"
  echo "XDG: $USE_XDG"

  # Create dotfiles repo as bare git or plain dir
  if [[ ! -d "$DOTFILES_REPO" ]]; then
    echo -e "${YELLOW}Creating $DOTFILES_REPO${NC}"
    mkdir -p "$DOTFILES_REPO"
    # Copy .env and data structure
    if [[ -f "$REPO_ROOT/.env" ]]; then
      cp "$REPO_ROOT/.env" "$DOTFILES_REPO/.env"
      echo "  copied .env"
    fi
    if [[ -f "$REPO_ROOT/env.example" ]]; then
      cp "$REPO_ROOT/env.example" "$DOTFILES_REPO/.env.example"
    fi
    # Create symlinks: ~/cyberpot -> ~/.cyberpot or vice versa
    if [[ ! -e "$HOME/cyberpot" && ! -L "$HOME/cyberpot" ]]; then
      ln -s "$DOTFILES_REPO" "$HOME/cyberpot.dotlink" 2>/dev/null || true
      echo "  note: $HOME/cyberpot exists, skipping link"
    fi
    # Create data subdirs
    ensure_dir "$DOTFILES_REPO/data"
    ensure_dir "$DOTFILES_REPO/data/nginx/conf"
    ensure_dir "$DOTFILES_REPO/data/nginx/cert"
  else
    echo -e "${GREEN}Dotfiles repo exists: $DOTFILES_REPO${NC}"
  fi

  # XDG mode
  if [[ $USE_XDG -eq 1 ]]; then
    echo -e "${BLUE}Enabling XDG compliance...${NC}"
    ensure_dir "$CYBERPOT_XDG_CONFIG"
    ensure_dir "$CYBERPOT_XDG_DATA"
    ensure_dir "$CYBERPOT_XDG_CACHE"
    # Symlink .env to XDG
    if [[ -f "$DOTFILES_REPO/.env" && ! -f "$CYBERPOT_XDG_CONFIG/.env" ]]; then
      ln -s "$DOTFILES_REPO/.env" "$CYBERPOT_XDG_CONFIG/.env"
      echo "  linked $DOTFILES_REPO/.env -> $CYBERPOT_XDG_CONFIG/.env"
    fi
    # Symlink data
    if [[ -d "$DOTFILES_REPO/data" && ! -L "$CYBERPOT_XDG_DATA" ]]; then
      ln -sfn "$DOTFILES_REPO/data" "$CYBERPOT_XDG_DATA" 2>/dev/null || true
    fi
  fi

  # Stow mode
  if [[ $USE_STOW -eq 1 ]]; then
    if ! command -v stow >/dev/null 2>&1; then
      echo "Installing stow..."
      sudo apt-get update && sudo apt-get install -y stow 2>/dev/null || echo "  install stow manually"
    fi
    echo -e "${BLUE}Stowing dotfiles...${NC}"
    # Create stow package structure: dotfiles/cyberpot/.env -> $HOME/.env
    STOW_DIR="$REPO_ROOT/dotfiles"
    ensure_dir "$STOW_DIR/cyberpot"
    cp "$REPO_ROOT/.env" "$STOW_DIR/cyberpot/.env" 2>/dev/null || true
    (cd "$STOW_DIR" && stow -t "$HOME" cyberpot --verbose 2>&1 | head -n 20) || echo "stow done"
  fi

  # Chezmoi mode
  if [[ $USE_CHEZMOI -eq 1 ]]; then
    if ! command -v chezmoi >/dev/null 2>&1; then
      echo "Installing chezmoi..."
      sh -c "$(curl -fsLS get.chezmoi.io)" -- -b /usr/local/bin 2>&1 | tail -n 5
    fi
    echo -e "${BLUE}Chezmoi init...${NC}"
    chezmoi init --source="$HOME/.local/share/chezmoi" 2>&1 | head -n 20 || true
    if [[ -f "$DOTFILES_REPO/.env" ]]; then
      mkdir -p "$HOME/.local/share/chezmoi"
      cp "$DOTFILES_REPO/.env" "$HOME/.local/share/chezmoi/dot_cyberpot.tmpl" 2>/dev/null || true
      echo "  added dot_cyberpot.tmpl (CYBERPOT_VERSION={{ .version }})"
    fi
  fi

  echo -e "${GREEN}Done. Dotfiles at $DOTFILES_REPO${NC}"
  do_status
}

do_status() {
  echo -e "${BLUE}=== Dotfiles Status ===${NC}"
  echo "DOTFILES_REPO: $DOTFILES_REPO ($([[ -d "$DOTFILES_REPO" ]] && echo "exists" || echo "missing"))"
  echo "XDG_CONFIG: $CYBERPOT_XDG_CONFIG ($([[ -d "$CYBERPOT_XDG_CONFIG" ]] && echo "exists" || echo "missing"))"
  echo "HOME/cyberpot: $(ls -ld "$HOME/cyberpot" 2>&1 | head -n1)"
  echo "~/.cyberpot: $(ls -ld "$DOTFILES_REPO" 2>&1 | head -n1)"
  echo ""
  echo "Tracked dotfiles:"
  if git --git-dir="$DOTFILES_REPO/.git" --work-tree="$HOME" status 2>/dev/null | head -n 20; then
    true
  else
    ls -la "$DOTFILES_REPO" 2>&1 | head -n 20
  fi
  echo ""
  echo "Env files:"
  ls -lh "$DOTFILES_REPO/.env" "$REPO_ROOT/.env" 2>&1 | head -n 10
  echo ""
  echo "XDG:"
  ls -ld "$CYBERPOT_XDG_CONFIG" "$CYBERPOT_XDG_DATA" 2>&1 | head -n 10
}

do_uninstall() {
  echo -e "${YELLOW}Uninstalling dotfiles symlinks...${NC}"
  # Remove symlinks, keep data
  if [[ -L "$HOME/cyberpot.dotlink" ]]; then rm "$HOME/cyberpot.dotlink"; echo "  removed $HOME/cyberpot.dotlink"; fi
  if [[ -L "$CYBERPOT_XDG_CONFIG/.env" ]]; then rm "$CYBERPOT_XDG_CONFIG/.env"; echo "  removed XDG .env link"; fi
  echo -e "${GREEN}Done (data kept at $DOTFILES_REPO)${NC}"
}

case "$MODE" in
  install) do_install ;;
  stow) USE_STOW=1; do_install ;;
  chezmoi) USE_CHEZMOI=1; do_install ;;
  xdg) USE_XDG=1; do_install ;;
  status) do_status ;;
  uninstall) do_uninstall ;;
  *) usage; exit 2 ;;
esac
