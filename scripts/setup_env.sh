#!/usr/bin/env bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
VENV_DIR="${VENV_DIR:-.venv}"
PYTHON="${PYTHON:-python3}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_python() {
    if ! command -v "$PYTHON" &>/dev/null; then
        log_error "Python 3 not found. Please install Python 3.8+."
        exit 1
    fi

    local python_version
    python_version=$("$PYTHON" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    local major minor
    major=$(echo "$python_version" | cut -d. -f1)
    minor=$(echo "$python_version" | cut -d. -f2)

    if [ "$major" -lt 3 ] || { [ "$major" -eq 3 ] && [ "$minor" -lt 8 ]; }; then
        log_error "Python 3.8+ required, found $python_version"
        exit 1
    fi

    log_info "Python $python_version found"
}

setup_venv() {
    cd "$REPO_ROOT"

    if [ -d "$VENV_DIR" ]; then
        log_warn "Virtual environment already exists at $VENV_DIR"
        read -p "Recreate? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$VENV_DIR"
        else
            log_info "Using existing virtual environment"
            return 0
        fi
    fi

    log_info "Creating virtual environment..."
    "$PYTHON" -m venv "$VENV_DIR"
    log_info "Virtual environment created at $VENV_DIR"
}

install_deps() {
    cd "$REPO_ROOT"

    local pip="$VENV_DIR/bin/pip"

    log_info "Upgrading pip..."
    "$pip" install --upgrade pip --quiet

    log_info "Installing dependencies..."
    if [ -f requirements.txt ]; then
        "$pip" install -r requirements.txt --quiet
    fi

    # Install common dev dependencies
    log_info "Installing development dependencies..."
    "$pip" install pyyaml requests --quiet

    log_info "Dependencies installed"
}

validate_env() {
    cd "$REPO_ROOT"

    log_info "Validating environment..."

    # Check required scripts exist
    local scripts=("validate_repo.py" "check_health.py" "select_compose_preset.py" "build_images.py")
    for script in "${scripts[@]}"; do
        if [ ! -f "scripts/$script" ]; then
            log_error "Missing script: scripts/$script"
            exit 1
        fi
    done

    # Check .env exists
    if [ ! -f .env ]; then
        log_warn ".env file not found"
    fi

    # Run validate_repo.py if available
    if [ -f scripts/validate_repo.py ]; then
        log_info "Running repository validation..."
        "$VENV_DIR/bin/python" scripts/validate_repo.py || log_warn "Repository validation completed with warnings"
    fi

    log_info "Environment validation complete"
}

show_usage() {
    echo ""
    echo -e "${GREEN}CyberPot Environment Setup${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -p, --python     Python executable (default: python3)"
    echo "  -v, --venv       Virtual environment directory (default: .venv)"
    echo "  -n, --no-deps    Skip dependency installation"
    echo "  --validate       Only validate existing environment"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full setup with defaults"
    echo "  $0 -p python3.11      # Use specific Python version"
    echo "  $0 --validate         # Only validate environment"
    echo ""
}

main() {
    local install_deps_flag=true
    local validate_only=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -p|--python)
                PYTHON="$2"
                shift 2
                ;;
            -v|--venv)
                VENV_DIR="$2"
                shift 2
                ;;
            -n|--no-deps)
                install_deps_flag=false
                shift
                ;;
            --validate)
                validate_only=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    log_info "Setting up CyberPot environment..."

    check_python

    if [ "$validate_only" = true ]; then
        validate_env
        exit 0
    fi

    setup_venv

    if [ "$install_deps_flag" = true ]; then
        install_deps
    fi

    validate_env

    echo ""
    log_info "Environment setup complete!"
    echo ""
    echo "To activate the virtual environment:"
    echo "  source $VENV_DIR/bin/activate"
    echo ""
    echo "To run tests:"
    echo "  make test"
    echo ""
}

main "$@"
