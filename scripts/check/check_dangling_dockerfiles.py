#!/usr/bin/env python3
"""check_dangling_dockerfiles.py - Find Dockerfiles not covered by build strategy.

Implements the same logic as the bash snippet:
  allDockerfiles="$(git ls-files '*/Dockerfile' | jq -Rsc 'rtrimstr(\"\\n\") | split(\"\\n\")')"
  danglingDockerfiles="$(jq <<<"$strategy" -c --argjson allDockerfiles "$allDockerfiles" '$allDockerfiles - [ .matrix.include[].meta.dockerfiles[] ]')"

Usage:
  python scripts/check_dangling_dockerfiles.py --strategy strategy.json
  cat strategy.json | python scripts/check_dangling_dockerfiles.py
  python scripts/check_dangling_dockerfiles.py --strategy '{"matrix":{"include":[{"meta":{"dockerfiles":["docker/cowrie/Dockerfile"]}}]}}'
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def get_all_dockerfiles() -> list[str]:
    """Get all Dockerfiles tracked by git, fallback to find, excluding .devcontainer."""
    try:
        result = subprocess.run(
            ["git", "ls-files", "*/Dockerfile"],
            capture_output=True,
            text=True,
            check=False,
            cwd=REPO_ROOT,
        )
        if result.returncode == 0 and result.stdout.strip():
            files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
            # Exclude .devcontainer
            files = [f for f in files if not f.startswith(".devcontainer/")]
            return sorted(files)
    except (OSError, subprocess.SubprocessError):
        pass

    # Fallback: find
    files = []
    for p in REPO_ROOT.rglob("Dockerfile"):
        # Only under a subdirectory (*/Dockerfile)
        if p.parent != REPO_ROOT and not str(p.relative_to(REPO_ROOT)).startswith(".devcontainer/"):
            files.append(str(p.relative_to(REPO_ROOT)))
    return sorted(files)


def load_strategy(source: str | None) -> dict:
    """Load strategy JSON from file, string, or stdin."""
    data = None
    if source is None:
        # Try stdin
        if not sys.stdin.isatty():
            data = sys.stdin.read()
        else:
            raise ValueError("No strategy provided. Use --strategy or pipe JSON via stdin.")
    elif Path(source).exists():
        data = Path(source).read_text(encoding="utf-8")
    else:
        # Assume it's a JSON string
        data = source

    if not data or not data.strip():
        raise ValueError("Strategy JSON is empty")

    try:
        strategy = json.loads(data)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON strategy: {exc}") from exc

    return strategy


def find_dangling(all_dockerfiles: list[str], strategy: dict) -> tuple[list[str], list[str]]:
    """Return (covered, dangling) lists.

    Equivalent jq: $all - [.matrix.include[].meta.dockerfiles[]]
    """
    # Extract covered: .matrix.include[].meta.dockerfiles[]
    covered: list[str] = []
    try:
        includes = strategy.get("matrix", {}).get("include", [])
        for item in includes:
            meta = item.get("meta", {})
            dockerfiles = meta.get("dockerfiles", [])
            if isinstance(dockerfiles, list):
                covered.extend(dockerfiles)
            elif isinstance(dockerfiles, str):
                covered.append(dockerfiles)
    except (AttributeError, TypeError):
        covered = []

    # Deduplicate covered while preserving order
    seen = set()
    covered_unique = []
    for f in covered:
        if f not in seen:
            seen.add(f)
            covered_unique.append(f)

    # Dangling = all - covered
    covered_set = set(covered_unique)
    dangling = [f for f in all_dockerfiles if f not in covered_set]

    return covered_unique, dangling


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find dangling Dockerfiles not covered by strategy")
    parser.add_argument(
        "--strategy",
        help="Path to strategy JSON file or JSON string. If omitted, reads from stdin.",
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format",
    )
    parser.add_argument(
        "--all-dockerfiles",
        help="Path to file containing list of all Dockerfiles (one per line), overrides git ls-files",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    # Get all Dockerfiles
    if args.all_dockerfiles:
        all_dockerfiles = [
            line.strip()
            for line in Path(args.all_dockerfiles).read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
    else:
        all_dockerfiles = get_all_dockerfiles()

    # Load strategy
    try:
        if args.strategy:
            strategy = load_strategy(args.strategy)
        else:
            # Try stdin, then env var
            import os

            env_strategy = os.environ.get("STRATEGY")
            if env_strategy:
                strategy = json.loads(env_strategy)
            else:
                strategy = load_strategy(None)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    covered, dangling = find_dangling(all_dockerfiles, strategy)

    if args.format == "json":
        output = {
            "all": all_dockerfiles,
            "covered": covered,
            "dangling": dangling,
            "counts": {"all": len(all_dockerfiles), "covered": len(covered), "dangling": len(dangling)},
        }
        print(json.dumps(output, indent=2))
    else:
        print(f"All Dockerfiles: {len(all_dockerfiles)}")
        print(f"Covered: {len(covered)}")
        print(f"Dangling: {len(dangling)}")
        print("")
        if dangling:
            print("Dangling Dockerfiles:")
            for f in dangling:
                print(f"  - {f}")
            print("")
            print("JSON:", json.dumps(dangling))
            return 1
        else:
            print("No dangling Dockerfiles - all covered!")
            print(json.dumps(dangling))

    return 1 if dangling else 0


if __name__ == "__main__":
    sys.exit(main())
