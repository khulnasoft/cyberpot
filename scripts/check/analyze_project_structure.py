#!/usr/bin/env python3
"""Generate a repository structure analysis report for CyberPot."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[1]


def iter_directory_entries(root: Path, include_dirs: Iterable[str] | None = None) -> list[Path]:
    include_dirs = set(include_dirs or ())
    entries: list[Path] = []
    for path in sorted(root.iterdir()):
        if path.name.startswith(".") and path.name not in {".devcontainer", ".github"}:
            continue
        if path.is_dir() and include_dirs and path.name not in include_dirs:
            continue
        entries.append(path)
    return entries


def count_files_by_pattern(root: Path, pattern: str) -> int:
    return len(list(root.rglob(pattern)))


def analyze_structure() -> list[str]:
    report_lines: list[str] = []
    top_level = iter_directory_entries(REPO_ROOT)

    report_lines.append("CyberPot repository structure analysis")
    report_lines.append("=" * 38)
    report_lines.append("Top-level areas:")

    for path in top_level:
        kind = "dir" if path.is_dir() else "file"
        report_lines.append(f"- {path.name} [{kind}]")

    report_lines.append("")
    report_lines.append("Key area overview:")
    for area in ("compose", "docker", "installer", "scripts", "tests", "doc"):
        path = REPO_ROOT / area
        if path.exists():
            count = len(list(path.iterdir()))
            report_lines.append(f"- {area}: {count} entries")
        else:
            report_lines.append(f"- {area}: missing")

    report_lines.append("")
    report_lines.append("Deployment structure heuristics:")
    compose_files = count_files_by_pattern(REPO_ROOT / "compose", "*.yml")
    dockerfiles = count_files_by_pattern(REPO_ROOT / "docker", "Dockerfile")
    installer_scripts = count_files_by_pattern(REPO_ROOT / "installer", "*")
    report_lines.append(f"- Compose templates: {compose_files}")
    report_lines.append(f"- Dockerfiles: {dockerfiles}")
    report_lines.append(f"- Installer entries: {installer_scripts}")

    report_lines.append("")
    report_lines.append("Dependency and duplication hints:")
    report_lines.extend(
        [
            "- The compose/ and docker/ directories should remain the primary boundary for deployment templates versus service images.",
            "- Installer scripts and deployment templates appear to share responsibilities, so a small shared config layer would reduce drift.",
            "- The repo already has dedicated scripts/ and tests/ folders, which is a good base for continued modularization.",
        ]
    )

    report_lines.append("")
    report_lines.append("Improvement opportunities:")
    report_lines.extend(
        [
            "- Keep deployment templates under compose/ and keep service-specific assets under docker/.",
            "- Continue consolidating helper tooling under scripts/ and keep tests under tests/.",
            "- Expand documentation in doc/ so architecture and contributor guidance stay aligned with the code.",
            "- Introduce a shared configuration model for installer and compose defaults to reduce duplication.",
        ]
    )

    return report_lines


def main() -> int:
    report = analyze_structure()
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # pragma: no cover - defensive CLI handling
        print(str(exc), file=sys.stderr)
        sys.exit(1)
