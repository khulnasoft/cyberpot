#!/usr/bin/env python3
"""version.py - Single source of truth for CyberPot version.

Reads from version file and provides helpers to inject into bake, .env, etc.
Usage:
  python scripts/lib/version.py              # prints 24.04.2
  python scripts/lib/version.py --bump patch # 24.04.2 -> 24.04.3
  python scripts/lib/version.py --env        # prints CYBERPOT_VERSION=24.04.2
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
VERSION_FILE = REPO_ROOT / "version"


def read_version() -> str:
    """Read version from version file, stripping whitespace and leading =."""
    if not VERSION_FILE.exists():
        return "24.04.2"
    text = VERSION_FILE.read_text(encoding="utf-8").strip()
    # Handle bug where file contains ==24.04.2
    text = text.lstrip("=").strip()
    # Validate semver like 24.04.2
    if not re.match(r"^\d+\.\d+\.\d+$", text):
        # Try to extract version
        m = re.search(r"(\d+\.\d+\.\d+)", text)
        if m:
            return m.group(1)
        return "24.04.2"
    return text


def bump_version(version: str, part: str = "patch") -> str:
    """Bump version: major, minor, patch."""
    major, minor, patch = map(int, version.split("."))
    if part == "major":
        major += 1
        minor = 0
        patch = 0
    elif part == "minor":
        minor += 1
        patch = 0
    elif part == "patch":
        patch += 1
    else:
        raise ValueError(f"Unknown bump part: {part}")
    return f"{major}.{minor}.{patch}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CyberPot version helper")
    parser.add_argument("--bump", choices=["major", "minor", "patch"], help="Bump version")
    parser.add_argument("--env", action="store_true", help="Print as CYBERPOT_VERSION=...")
    parser.add_argument("--write", nargs="?", const="version", help="Write bumped version to file (default: version)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    version = read_version()

    if args.bump:
        version = bump_version(version, args.bump)
        if args.write:
            target = Path(args.write) if args.write != "version" else VERSION_FILE
            # Handle case where --write without value uses const
            if isinstance(args.write, bool) or args.write == "version":
                target = VERSION_FILE
            else:
                target = Path(args.write)
            target.write_text(version + "\n", encoding="utf-8")
            print(f"Bumped to {version} -> {target}", file=sys.stderr)

    if args.env:
        print(f"CYBERPOT_VERSION={version}")
    else:
        print(version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
