#!/usr/bin/env python3
"""Basic repository validation for CyberPot."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - used when PyYAML is unavailable
    yaml = None


REPO_ROOT = Path(__file__).resolve().parents[1]


def check_file_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Missing required file or directory: {path}")


def validate_compose_files() -> list[Path]:
    compose_dir = REPO_ROOT / "compose"
    compose_files = sorted(compose_dir.glob("*.yml"))

    if yaml is None:
        raise RuntimeError("PyYAML is required to validate compose files")

    for compose_file in compose_files:
        with compose_file.open("r", encoding="utf-8") as handle:
            yaml.safe_load(handle)

    return compose_files


def main() -> int:
    required_paths = [
        REPO_ROOT / "README.md",
        REPO_ROOT / "docker-compose.yml",
        REPO_ROOT / "compose",
        REPO_ROOT / "docker",
        REPO_ROOT / "installer",
        REPO_ROOT / "scripts",
        REPO_ROOT / "tests",
    ]

    for path in required_paths:
        check_file_exists(path)

    compose_files = validate_compose_files()

    print("Repository structure validation passed.")
    print(f"Validated {len(compose_files)} compose files.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (FileNotFoundError, RuntimeError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        if yaml is not None and isinstance(exc, yaml.YAMLError):
            print(str(exc), file=sys.stderr)
            sys.exit(1)
        raise
