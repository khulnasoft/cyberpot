# CyberPot Dotfiles — Dynamic Init

**Replaces:** `cyberpot-init` static `dist/` copy with `dot-init` dynamic dotfiles (XDG, `stow`, `chezmoi`)

## Why Dotfiles?

- **Before:** `install.sh` copies `env.example` → `~/cyberpot/.env`, `cyberpot-init` `chown -R 770 /data` every start, no XDG
- **After:** `~/.cyberpot` is a dotfiles repo, `stow`/`chezmoi` manages `~/.cyberpot/.env` → `~/.config/cyberpot/.env` (XDG), `cyberpot-init` becomes `dot-init` with `stow`+`chezmoi` in image

## Layout

```
~/.cyberpot/               # DOTFILES_REPO (bare or plain)
├── .env                   # main config (stowed)
├── .env.example
└── data/
    ├── nginx/conf/nginxpasswd
    └── nginx/cert/

~/.config/cyberpot/        # XDG_CONFIG_HOME/cyberpot (symlink to ~/.cyberpot/.env if XDG enabled)
~/.local/share/cyberpot/   # XDG_DATA_HOME/cyberpot (symlink to ~/.cyberpot/data)

dotfiles/cyberpot/         # Stow package in repo
├── .cyberpot/.env
├── .cyberpot/.env.example
└── .config/cyberpot/.env  # XDG variant

docker/dot-init/           # Dynamic init image (from cyberpot-init)
├── Dockerfile (alpine:3.22 + stow + chezmoi + XDG dirs)
└── dist/entrypoint.sh (dotfiles detection: stow --restow, chezmoi apply, XDG symlink)
```

## Usage

```bash
# Install dotfiles (default)
make dotfiles
# or
bash scripts/dotfiles_setup.sh install

# XDG compliant
make dotfiles-xdg
# or
bash scripts/dotfiles_setup.sh xdg

# Stow mode (requires stow)
bash scripts/dotfiles_setup.sh stow --xdg
# Manual:
cd dotfiles && stow -t ~ cyberpot
stow -D -t ~ cyberpot  # unlink

# Chezmoi mode
bash scripts/dotfiles_setup.sh chezmoi
chezmoi add ~/.cyberpot/.env
chezmoi apply

# Status
bash scripts/dotfiles_setup.sh status
make dotfiles  # also shows status

# Build dot-init (replaces cyberpot-init)
make dot-init
docker buildx bake dot-init
docker buildx bake --print dot-init

# Uninstall (keeps data)
bash scripts/dotfiles_setup.sh uninstall
```

## dot-init vs cyberpot-init

| Feature | cyberpot-init | dot-init (dynamic) |
|---------|---------------|--------------------|
| Base | alpine:3.20 | alpine:3.22 + stow/chezmoi |
| Dotfiles | copy `dist/` | stow/chezmoi + XDG |
| Healthcheck | `--retries=1000` | `--timeout=3s --start-period=10s --retries=3` |
| Config | `~/cyberpot/.env` | `~/.cyberpot/.env` + `~/.config/cyberpot/.env` (symlink) |
| Build | `docker build` | `docker buildx bake dot-init` |

## Migration

```bash
# From old ~/cyberpot to dotfiles
bash scripts/dotfiles_setup.sh install  # creates ~/.cyberpot from repo .env
cp ~/cyberpot/.env ~/.cyberpot/.env  # preserve existing WEB_USER
cp -a ~/cyberpot/data ~/.cyberpot/data  # preserve data
# Then stow or XDG
bash scripts/dotfiles_setup.sh xdg
```

## Bare Git Alternative (advanced)

```bash
git init --bare $HOME/.cyberpot.git
alias dot='git --git-dir=$HOME/.cyberpot.git --work-tree=$HOME'
dot add .cyberpot/.env
dot commit -m "cyberpot dotfiles"
dot status
```
