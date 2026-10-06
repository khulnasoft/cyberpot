#!/usr/bin/env python3
"""Fast pull check with registry fallback: khulnasoft-bot -> docker.io/khulnasoft -> docker.io/khulnasoft."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


REGISTRIES = [
    "ghcr.io/khulnasoft-bot",
    "docker.io/khulnasoft",
    "ghcr.io/khulnasoft",
]

DEFAULT_VERSION = "24.04.2"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fast pull check with fallback registries")
    parser.add_argument("--compose-file", default="docker-compose.yml", help="Compose file")
    parser.add_argument("--dry-run", action="store_true", help="Only check, do not pull")
    parser.add_argument("--up", action="store_true", help="Run docker compose up after checks")
    parser.add_argument("--timeout", type=int, default=5, help="Seconds for manifest check")
    parser.add_argument("--version", dest="version", default=None, help="Override CYBERPOT_VERSION")
    return parser.parse_args()


def run(cmd: list[str], env=None, timeout: int | None = None) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, check=False, env=env, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return subprocess.CompletedProcess(cmd, returncode=1, stdout="", stderr=str(exc))


def fast_manifest_check(image: str, timeout: int = 5) -> bool:
    # docker manifest inspect
    if run(["docker", "manifest", "inspect", image], timeout=timeout).returncode == 0:
        return True
    # skopeo
    if run(["skopeo", "inspect", "--raw", f"docker://{image}"], timeout=timeout).returncode == 0:
        return True
    # crane
    if run(["crane", "manifest", image], timeout=timeout).returncode == 0:
        return True
    return False


def get_images(compose_file: Path, version: str) -> list[str]:
    env = os.environ.copy()
    env.setdefault("CYBERPOT_VERSION", version)
    env.setdefault("CYBERPOT_REPO", "docker.io/khulnasoft")
    env.setdefault("CYBERPOT_PULL_POLICY", "always")
    env.setdefault("CYBERPOT_DATA_PATH", "./data")
    env.setdefault("CYBERPOT_DOCKER_COMPOSE", str(compose_file))
    env.setdefault("CYBERPOT_DOCKER_ENV", "./.env")
    env.setdefault("CYBERPOT_OSTYPE", "linux")

    # Try docker compose config --images
    result = run(["docker", "compose", "-f", str(compose_file), "config", "--images"], env=env)
    images: list[str] = []
    if result.returncode == 0:
        images = [l.strip() for l in result.stdout.splitlines() if l.strip()]
    if not images:
        # Fallback grep
        print("Falling back to grep parsing", file=sys.stderr)
        text = compose_file.read_text()
        for line in text.splitlines():
            if "image:" in line:
                img = line.split("image:", 1)[1].strip().strip('"').strip("'")
                # expand env
                img = img.replace("${CYBERPOT_REPO}", env["CYBERPOT_REPO"]).replace("$CYBERPOT_REPO", env["CYBERPOT_REPO"])
                img = img.replace("${CYBERPOT_VERSION}", version).replace("$CYBERPOT_VERSION", version)
                img = img.replace("==", ":")
                images.append(img)
    # dedupe
    seen = set()
    uniq = []
    for i in images:
        if i not in seen:
            seen.add(i)
            uniq.append(i)
    return uniq


def main() -> int:
    args = parse_args()
    compose_file = Path(args.compose_file)
    if not compose_file.exists():
        # try fallback
        for cand in [Path("docker-compose.yml"), Path("/workspaces/cyberpot/docker-compose.yml")]:
            if cand.exists():
                compose_file = cand
                break
        else:
            print(f"Compose file not found: {args.compose_file}", file=sys.stderr)
            return 1

    version = args.version or os.environ.get("CYBERPOT_VERSION") or DEFAULT_VERSION
    version = version.lstrip("=")  # fix ==24.04.2 bug
    version = version.lstrip("=")

    print(f"=== Fast Pull Fallback ===")
    print(f"Compose: {compose_file}")
    print(f"Version: {version}")
    print(f"Registries: {' -> '.join(REGISTRIES)}")
    print(f"Timeout: {args.timeout}s")
    print("")

    images = get_images(compose_file, version)
    print(f"Found {len(images)} images")
    for img in images[:10]:
        print(f"  - {img}")
    if len(images) > 10:
        print(f"  ... and {len(images)-10} more")
    print("")

    pulled = 0
    failed = 0

    for original in images:
        base = Path(original.split("/")[-1].split(":")[0]).name
        # handle tag
        tag = original.split(":")[-1] if ":" in original else version
        if "/" not in original or tag == original:
            tag = version
        # If original already present locally, skip pull (fixes manifest unknown for not-yet-pushed 24.04.2)
        if run(["docker", "image", "inspect", original]).returncode == 0:
            print(f"Checking {base}:{tag} (original: {original}) — already present locally")
            pulled += 1
            continue
        print(f"Checking {base}:{tag} (original: {original})")
        found = None
        for reg in REGISTRIES:
            candidate = f"{reg}/{base}:{tag}"
            alt = None
            if reg == "docker.io/khulnasoft":
                alt = f"khulnasoft/{base}:{tag}"
            print(f"  trying {candidate} ... ", end="", flush=True)
            if fast_manifest_check(candidate, timeout=args.timeout):
                print("found")
                found = candidate
                break
            elif alt and fast_manifest_check(alt, timeout=args.timeout):
                print(f"found (alt {alt})")
                found = alt
                break
            else:
                print("missing")
        # Fallback to older tags if 24.04.2 not found
        if not found and tag == "24.04.2":
            for fallback_tag in ["24.04.1", "24.04", "latest"]:
                print(f"  Fallback trying tag {fallback_tag} for {base}")
                for reg in REGISTRIES:
                    candidate = f"{reg}/{base}:{fallback_tag}"
                    print(f"    trying {candidate} ... ", end="", flush=True)
                    if fast_manifest_check(candidate, timeout=args.timeout):
                        print("found")
                        found = candidate
                        break
                    else:
                        print("missing")
                if found:
                    break
        if not found:
            print(f"  ✗ All registries missing for {base}:{tag} (and fallbacks)")
            failed += 1
            continue
        if args.dry_run:
            print(f"  [dry-run] would pull {found} -> {original}")
            pulled += 1
            continue
        print(f"  → pulling {found}")
        result = run(["docker", "pull", found], timeout=300)
        if result.returncode == 0:
            if found != original:
                run(["docker", "tag", found, original])
            pulled += 1
        else:
            print(f"  ✗ pull failed {found}: {result.stderr[:200]}")
            failed += 1

    print("")
    print(f"=== Summary ===")
    print(f"Pulled/Found: {pulled}")
    print(f"Failed: {failed}")
    print(f"Total: {len(images)}")

    if args.up:
        if pulled > 0 or failed == 0:
            print("\n=== docker compose up ===")
            result = run(["docker", "compose", "-f", str(compose_file), "up", "-d"])
            print(result.stdout)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
            return result.returncode
        else:
            print("No images pulled, aborting up", file=sys.stderr)
            return 1
    else:
        if not args.dry_run:
            print("\nRun with --up to execute 'docker compose up -d'")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
