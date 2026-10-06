#!/usr/bin/env python3
"""Select a compose preset and copy it to an output path."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PRESETS = {
    "standard": REPO_ROOT / "compose" / "standard.yml",
    "sensor": REPO_ROOT / "compose" / "sensor.yml",
    "mini": REPO_ROOT / "compose" / "mini.yml",
    "llm": REPO_ROOT / "compose" / "llm.yml",
    "mobile": REPO_ROOT / "compose" / "mobile.yml",
    "tarpit": REPO_ROOT / "compose" / "tarpit.yml",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Select a CyberPot compose preset")
    parser.add_argument("--preset", required=True)
    parser.add_argument("--output", required=True, help="Destination path for the selected compose file")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.preset not in PRESETS:
        print(f"Unsupported preset: {args.preset}", file=sys.stderr)
        return 2

    source = PRESETS[args.preset]
    output = Path(args.output)

    if not source.exists():
        print(f"Missing preset file: {source}", file=sys.stderr)
        return 1

    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, output)
    print(f"Copied {source.name} to {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())