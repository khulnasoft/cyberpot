#!/usr/bin/env python3
"""Basic health checks for CyberPot compose deployments."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Perform basic CyberPot health checks")
    parser.add_argument("--compose-file", default="docker-compose.yml", help="Compose file to inspect")
    return parser.parse_args()


def run_command(command: list[str], env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(command, capture_output=True, text=True, check=False, env=env)  # nosec B603 - command list is not shell-interpreted
    except OSError as exc:
        return subprocess.CompletedProcess(command, returncode=1, stdout="", stderr=str(exc))


def main() -> int:
    args = parse_args()
    compose_file = Path(args.compose_file)

    if not compose_file.exists():
        print(f"Compose file not found: {compose_file}", file=sys.stderr)
        return 1

    env = os.environ.copy()
    env.setdefault("CYBERPOT_REPO", "docker.io/khulnasoft")
    env.setdefault("CYBERPOT_VERSION", "24.04.2")
    env.setdefault("CYBERPOT_PULL_POLICY", "always")
    env.setdefault("CYBERPOT_DATA_PATH", "./data")
    env.setdefault("CYBERPOT_DOCKER_COMPOSE", "./docker-compose.yml")
    env.setdefault("CYBERPOT_DOCKER_ENV", "./.env")
    env.setdefault("CYBERPOT_OSTYPE", "linux")

    result = run_command(["docker", "compose", "-f", str(compose_file), "config", "--services"], env=env)
    if result.returncode != 0:
        print(result.stderr.strip() or result.stdout.strip() or "docker compose config failed", file=sys.stderr)
        return result.returncode

    services = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    print(f"Compose file is valid. Found {len(services)} services.")
    for service in services[:10]:
        print(f"- {service}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
