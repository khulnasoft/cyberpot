#!/usr/bin/env python3
"""Generate image build scaffolding for CyberPot ISO and VM images."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    "iso": {
        "description": "Generate ISO image build scaffold",
        "files": ["manifest.json", "build.sh"],
    },
    "vmware": {
        "description": "Generate VMware image build scaffold",
        "files": ["manifest.json", "packer-template.pkr.hcl"],
    },
    "virtualbox": {
        "description": "Generate VirtualBox image build scaffold",
        "files": ["manifest.json", "packer-template.pkr.hcl"],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate image build scaffolding for CyberPot")
    parser.add_argument("--target", required=True, choices=sorted(TARGETS.keys()))
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--dry-run", action="store_true", help="Generate files without requiring external tools")
    return parser.parse_args()


def write_template(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve()
    target_config = TARGETS[args.target]
    target_dir = output_dir / args.target
    target_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "target": args.target,
        "description": target_config["description"],
        "repo": "khulnasoft/cyberpot",
        "generated_by": "scripts/build_images.py",
    }
    write_template(target_dir / "manifest.json", json.dumps(manifest, indent=2) + "\n")

    if args.target == "iso":
        build_script = "#!/usr/bin/env bash\nset -euo pipefail\n\nROOT_DIR=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"\nWORK_DIR=\"${ROOT_DIR}/workdir\"\nOUTPUT_DIR=\"${ROOT_DIR}/output\"\n\nmkdir -p \"${WORK_DIR}\" \"${OUTPUT_DIR}\"\n\necho '[1/4] Checking prerequisites...'\nif command -v xorriso >/dev/null 2>&1; then\n  ISO_TOOL=xorriso\nelif command -v mkisofs >/dev/null 2>&1; then\n  ISO_TOOL=mkisofs\nelif command -v genisoimage >/dev/null 2>&1; then\n  ISO_TOOL=genisoimage\nelse\n  ISO_TOOL=none\nfi\n\necho '[2/4] Preparing ISO workspace...'\ncat > \"${WORK_DIR}/README.txt\" <<'EOF'\nCyberPot ISO build workspace\n============================\nThis directory is prepared by scripts/build_images.py for future ISO automation.\nEOF\n\necho '[3/4] Creating ISO artifact...'\nmkdir -p \"${OUTPUT_DIR}/iso-root\"\ncp \"${WORK_DIR}/README.txt\" \"${OUTPUT_DIR}/iso-root/README.txt\"\nif [ \"${ISO_TOOL}\" = \"none\" ]; then\n  printf 'CyberPot placeholder ISO build artifact\\n' > \"${OUTPUT_DIR}/cyberpot-live.iso\"\n  echo 'ISO tooling was not detected; wrote a placeholder artifact.'\nelif [ \"${ISO_TOOL}\" = \"xorriso\" ]; then\n  xorriso -as mkisofs -o \"${OUTPUT_DIR}/cyberpot-live.iso\" -volid CYBERPOT-LIVE \"${OUTPUT_DIR}/iso-root\" >/dev/null 2>&1\nelse\n  \"${ISO_TOOL}\" -o \"${OUTPUT_DIR}/cyberpot-live.iso\" -volid CYBERPOT-LIVE \"${OUTPUT_DIR}/iso-root\" >/dev/null 2>&1\nfi\n\necho \"[4/4] ISO artifact ready at ${OUTPUT_DIR}/cyberpot-live.iso\"\n"
        build_path = target_dir / "build.sh"
        write_template(build_path, build_script)
        build_path.chmod(0o755)
    else:
        pkr_template = "packer {\n  required_plugins {\n    docker = {\n      source = \"github.com/hashicorp/docker\"\n      version = \">= 1.0.0\"\n    }\n  }\n}\n\nsource \"docker\" \"example\" {\n  image = \"ubuntu:24.04\"\n  export_path = \"output/virtual-image.tar\"\n}\n\nbuild {\n  sources = [\"source.docker.example\"]\n}\n"
        write_template(target_dir / "packer-template.pkr.hcl", pkr_template)

    if args.dry_run:
        print(f"Generated scaffold for {args.target} in {target_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
