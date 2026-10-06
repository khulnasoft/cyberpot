#!/usr/bin/env bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVCONTAINER_DIR="$REPO_ROOT/.devcontainer"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        echo "  https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &>/dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    log_info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') found"
}

check_devcontainer_cli() {
    if command -v devcontainer &>/dev/null; then
        return 0
    elif command -v docker &>/dev/null && docker run --rm -v "$(pwd):/workspace" -w /workspace alpine test -f .devcontainer/devcontainer.json 2>/dev/null; then
        return 0
    fi
    return 1
}

build_devcontainer() {
    log_info "Building devcontainer..."
    cd "$REPO_ROOT"

    if command -v devcontainer &>/dev/null; then
        devcontainer build --workspace-folder "$REPO_ROOT"
    else
        docker build -t cyberpot-dev -f "$DEVCONTAINER_DIR/Dockerfile" "$REPO_ROOT"
    fi

    log_info "Devcontainer built successfully"
}

start_devcontainer() {
    log_info "Starting devcontainer..."
    cd "$REPO_ROOT"

    if command -v devcontainer &>/dev/null; then
        devcontainer up --workspace-folder "$REPO_ROOT"
        log_info "Devcontainer started. Use 'devcontainer exec' to run commands."
    else
        if docker ps -a --format '{{.Names}}' | grep -q "^cyberpot-dev$"; then
            docker start cyberpot-dev >/dev/null
            log_info "Existing devcontainer restarted. Use 'docker exec -it cyberpot-dev bash' to connect."
        else
            docker run -d \
                --name cyberpot-dev \
                -v "$REPO_ROOT:/workspace" \
                -w /workspace \
                cyberpot-dev \
                sleep infinity
            log_info "Devcontainer started. Use 'docker exec -it cyberpot-dev bash' to connect."
        fi
    fi
}

setup_workspace() {
    log_info "Setting up workspace..."
    cd "$REPO_ROOT"

    if command -v devcontainer &>/dev/null; then
        devcontainer exec --workspace-folder "$REPO_ROOT" bash -c "
            python -m pip install --upgrade pip &&
            python -m pip install pyyaml requests &&
            echo 'Workspace setup complete'
        "
    else
        docker exec cyberpot-dev bash -c "
            python -m pip install --upgrade pip &&
            python -m pip install pyyaml requests &&
            echo 'Workspace setup complete'
        "
    fi
}

show_usage() {
    echo ""
    echo -e "${GREEN}CyberPot Devcontainer Setup${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      Build the devcontainer"
    echo "  start      Start the devcontainer"
    echo "  setup      Setup workspace inside container"
    echo "  up         Build, start, and setup (all-in-one)"
    echo "  stop       Stop the devcontainer"
    echo "  remove     Remove the devcontainer"
    echo "  status     Show devcontainer status"
    echo "  shell      Open shell in devcontainer"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up              # Full setup"
    echo "  $0 build           # Just build"
    echo "  $0 shell           # Open shell"
    echo ""
}

stop_devcontainer() {
    log_info "Stopping devcontainer..."
    if command -v devcontainer &>/dev/null; then
        devcontainer stop --workspace-folder "$REPO_ROOT" 2>/dev/null || true
    fi
    docker stop cyberpot-dev 2>/dev/null || true
    log_info "Devcontainer stopped"
}

remove_devcontainer() {
    log_info "Removing devcontainer..."
    stop_devcontainer
    docker rm cyberpot-dev 2>/dev/null || true
    log_info "Devcontainer removed"
}

show_status() {
    if docker ps -a --format '{{.Names}}' | grep -q "^cyberpot-dev$"; then
        docker ps -a --filter name=cyberpot-dev --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        log_warn "No devcontainer found"
    fi
}

open_shell() {
    if docker ps --format '{{.Names}}' | grep -q "^cyberpot-dev$"; then
        docker exec -it cyberpot-dev bash
    else
        log_warn "Devcontainer is not running. Start with: $0 start"
    fi
}

main() {
    local command="${1:-help}"

    case "$command" in
        build)
            check_docker
            build_devcontainer
            ;;
        start)
            check_docker
            start_devcontainer
            ;;
        setup)
            setup_workspace
            ;;
        up)
            check_docker
            build_devcontainer
            start_devcontainer
            setup_workspace
            log_info "Devcontainer ready! Run '$0 shell' to connect."
            ;;
        stop)
            stop_devcontainer
            ;;
        remove)
            remove_devcontainer
            ;;
        status)
            show_status
            ;;
        shell)
            open_shell
            ;;
        -h|--help|help)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
