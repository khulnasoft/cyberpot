#!/usr/bin/env python3
"""generate_docker_strategy.py - Generate Docker build matrix strategy from legit images.

Legit images are determined from:
  - compose/*.yml (services using ${CYBERPOT_REPO}/<name>:${CYBERPOT_VERSION})
  - docker/*/Dockerfile (actual Dockerfiles present)
This ensures the strategy covers all images that are actually deployed,
allowing the dangling check to find orphaned Dockerfiles.

Output: JSON with .matrix.include[].meta.dockerfiles
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def get_all_dockerfiles() -> list[str]:
    """All Dockerfiles tracked by git, excluding devcontainer."""
    result = subprocess.run(
        ["git", "ls-files", "*/Dockerfile"],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        check=False,
    )
    if result.returncode == 0 and result.stdout.strip():
        files = [l.strip() for l in result.stdout.splitlines() if l.strip()]
        # Exclude .devcontainer as it's not a honeypot image
        files = [f for f in files if not f.startswith(".devcontainer/")]
        return sorted(files)
    # Fallback
    files = [str(p.relative_to(REPO_ROOT)) for p in REPO_ROOT.rglob("Dockerfile") if p.parent != REPO_ROOT]
    files = [f for f in files if not f.startswith(".devcontainer/")]
    return sorted(files)


def get_legit_images() -> set[str]:
    """Legit images from compose files (services)."""
    legit: set[str] = set()
    # Scan compose/ and docker-compose.yml, docker/*/docker-compose.yml
    patterns = [
        REPO_ROOT / "compose",
        REPO_ROOT / "docker-compose.yml",
    ]
    # Add docker/*/docker-compose.yml
    for docker_compose in REPO_ROOT.glob("docker/**/docker-compose.yml"):
        patterns.append(docker_compose)

    # Also scan compose/*.yml
    for pattern in patterns:
        if pattern.is_dir():
            for f in pattern.glob("*.yml"):
                try:
                    text = f.read_text()
                    # Find image: lines with khulnasoft or ${CYBERPOT_REPO}
                    for line in text.splitlines():
                        if "image:" in line and ("khulnasoft" in line or "CYBERPOT_REPO" in line):
                            # Extract image name: e.g., ${CYBERPOT_REPO}/adbhoney:${CYBERPOT_VERSION} or docker.io/khulnasoft/adbhoney:24.04.2
                            m = re.search(r'image:\s*["\']?([^"\'\s]+)', line)
                            if m:
                                img = m.group(1)
                                # Normalize: extract base name like adbhoney, cowrie
                                # Handle ${CYBERPOT_REPO}/adbhoney -> adbhoney
                                base = img.split("/")[-1].split(":")[0]
                                # Filter out variables like ${CYBERPOT_REPO}
                                if base and not base.startswith("$"):
                                    legit.add(base)
                                # Also handle full image like docker.io/khulnasoft/cowrie
                                if "/" in img:
                                    # Get last part
                                    last = img.split("/")[-1]
                                    if ":" in last:
                                        last = last.split(":")[0]
                                    if last and not last.startswith("$"):
                                        legit.add(last)
                except (OSError, UnicodeDecodeError):
                    continue
        elif pattern.is_file():
            try:
                text = pattern.read_text()
                for line in text.splitlines():
                    if "image:" in line and ("khulnasoft" in line or "CYBERPOT_REPO" in line):
                        m = re.search(r'image:\s*["\']?([^"\'\s]+)', line)
                        if m:
                            img = m.group(1)
                            base = img.split("/")[-1].split(":")[0]
                            if base and not base.startswith("$"):
                                legit.add(base)
            except (OSError, UnicodeDecodeError):
                continue

    # Also consider directory names under docker/ as image names
    # e.g., docker/cowrie/Dockerfile -> cowrie is legit if used in compose
    # We already have legit from compose, but also add known honeypot list from docker/
    # To be safe, add all docker/*/Dockerfile parent names that are in legit or are honeypots
    return legit


def dockerfile_for_image(image_name: str, all_dockerfiles: list[str]) -> list[str]:
    """Find Dockerfiles that correspond to an image name."""
    # Direct mapping: docker/<image_name>/Dockerfile
    # Special cases: tanner has sub-dirs, elk has etc.
    candidates = []
    for df in all_dockerfiles:
        # Normalize: docker/cowrie/Dockerfile -> cowrie
        # docker/tanner/tanner/Dockerfile -> tanner
        # docker/elk/elasticsearch/Dockerfile -> elk-elasticsearch or elasticsearch
        parts = Path(df).parts
        # e.g., ('docker', 'cowrie', 'Dockerfile') -> cowrie
        # ('docker', 'tanner', 'tanner', 'Dockerfile') -> tanner
        # ('docker', 'elk', 'elasticsearch', 'Dockerfile') -> elasticsearch
        if len(parts) >= 2 and parts[0] == "docker":
            # Check if image_name matches any part
            if image_name in parts:
                candidates.append(df)
            # Also handle hyphenated: elk-elasticsearch -> elasticsearch
            elif image_name.replace("-", "") in "".join(parts).replace("-", ""):
                # Fallback
                pass
            # Direct dir match
            if parts[1] == image_name:
                candidates.append(df)
            # For nested like docker/tanner/tanner
            if len(parts) >= 3 and parts[2] == image_name:
                candidates.append(df)
    # Deduplicate
    return sorted(set(candidates))


def generate_strategy() -> dict:
    """Generate strategy JSON."""
    all_dockerfiles = get_all_dockerfiles()
    legit_images = get_legit_images()

    # If legit is empty (no compose), fallback to all docker/*/Dockerfile as legit
    if not legit_images:
        # Use all docker/*/Dockerfile parent dirs as legit
        for df in all_dockerfiles:
            parts = Path(df).parts
            if len(parts) >= 2 and parts[0] == "docker" and parts[1] not in {".devcontainer", "deprecated"}:
                legit_images.add(parts[1])

    # Build matrix include
    include = []
    for image in sorted(legit_images):
        dockerfiles = dockerfile_for_image(image, all_dockerfiles)
        if not dockerfiles:
            # Try to find any Dockerfile that contains image name
            dockerfiles = [df for df in all_dockerfiles if image.lower() in df.lower()]

        include.append(
            {
                "name": image,
                "image": f"docker.io/khulnasoft/{image}:24.04.2",
                "meta": {"dockerfiles": dockerfiles},
            }
        )

    strategy = {"matrix": {"include": include}}

    return strategy


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Generate Docker strategy and check dangling")
    parser.add_argument("--output", help="Output file for strategy JSON")
    parser.add_argument("--check-dangling", action="store_true", help="Also check for dangling Dockerfiles")
    parser.add_argument("--format", choices=["json", "pretty"], default="pretty")
    args = parser.parse_args()

    strategy = generate_strategy()

    # Output
    output_text = json.dumps(strategy, indent=2) if args.format == "pretty" else json.dumps(strategy)

    if args.output:
        Path(args.output).write_text(output_text + "\n", encoding="utf-8")
        print(f"Wrote strategy to {args.output} with {len(strategy['matrix']['include'])} images")
    else:
        print(output_text)

    # Optionally check dangling
    if args.check_dangling:
        print("\n--- Dangling Check ---", file=sys.stderr)
        all_dockerfiles = get_all_dockerfiles()
        covered = []
        for item in strategy["matrix"]["include"]:
            covered.extend(item.get("meta", {}).get("dockerfiles", []))
        dangling = sorted(set(all_dockerfiles) - set(covered))
        print(f"All: {len(all_dockerfiles)}, Covered: {len(set(covered))}, Dangling: {len(dangling)}", file=sys.stderr)
        if dangling:
            print("Dangling:", file=sys.stderr)
            for df in dangling:
                print(f"  - {df}", file=sys.stderr)
            return 1
        else:
            print("No dangling", file=sys.stderr)
            return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
