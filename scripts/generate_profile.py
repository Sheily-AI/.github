#!/usr/bin/env python3
"""Refresh the organization profile from GitHub repository metadata."""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any


START_MARKER = "<!-- SHEILY_ORG_PROJECTS_START -->"
END_MARKER = "<!-- SHEILY_ORG_PROJECTS_END -->"
ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "profile" / "catalog.json"
DEFAULT_PROFILE = ROOT / "profile" / "README.md"


def github_repository(organization: str, name: str, token: str) -> dict[str, Any]:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{organization}/{name}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "sheily-org-profile-generator",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"GitHub rejected {organization}/{name}: HTTP {error.code}: {detail}"
        ) from error


def github_repository_cli(organization: str, name: str) -> dict[str, Any]:
    result = subprocess.run(
        ["gh", "api", f"repos/{organization}/{name}"],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def spanish_timestamp(value: str) -> str:
    moment = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    return moment.strftime("%Y-%m-%d %H:%M UTC")


def render_section(catalog: dict[str, Any], metadata: list[dict[str, Any]]) -> str:
    configured = catalog["repositories"]
    if len(configured) != len(metadata):
        raise ValueError("repository metadata does not match the configured catalog")

    rows = []
    newest_push = ""
    for item, repository in zip(configured, metadata, strict=True):
        if repository.get("name") != item["name"]:
            raise ValueError(f"unexpected repository metadata for {item['name']}")
        pushed_at = repository.get("pushed_at") or repository.get("updated_at")
        if not pushed_at:
            raise ValueError(f"{item['name']} has no update timestamp")
        newest_push = max(newest_push, pushed_at)
        visibility = "privado" if repository.get("private") else "público"
        archived = " · archivado" if repository.get("archived") else ""
        description = (repository.get("description") or "Sin descripción publicada.").strip()
        description = description.replace("|", "\\|").replace("\n", " ")
        label = item["label"].replace("|", "\\|")
        rows.append(
            f"| [{label}]({repository['html_url']}) | {description} | "
            f"`{repository['default_branch']}` | {visibility}{archived} | "
            f"{spanish_timestamp(pushed_at)} |"
        )

    return "\n".join(
        [
            START_MARKER,
            "## Estado automático de los proyectos",
            "",
            (
                "Esta tabla se genera desde los metadatos de GitHub. Indica actividad del "
                "repositorio; no certifica que una versión esté desplegada o funcionando."
            ),
            "",
            "| Proyecto | Descripción publicada | Rama | Acceso | Último cambio en GitHub |",
            "| --- | --- | --- | --- | --- |",
            *rows,
            "",
            f"**Fuente observada:** GitHub · **cambio más reciente:** {spanish_timestamp(newest_push)}",
            END_MARKER,
        ]
    )


def replace_generated_section(document: str, section: str) -> str:
    if document.count(START_MARKER) != 1 or document.count(END_MARKER) != 1:
        raise ValueError("profile README must contain exactly one generated section")
    before, remainder = document.split(START_MARKER, 1)
    _, after = remainder.split(END_MARKER, 1)
    return before + section + after


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=pathlib.Path, default=DEFAULT_CATALOG)
    parser.add_argument("--profile", type=pathlib.Path, default=DEFAULT_PROFILE)
    parser.add_argument(
        "--metadata-file",
        type=pathlib.Path,
        help="Use a local JSON array instead of calling GitHub (for deterministic tests).",
    )
    parser.add_argument("--check", action="store_true", help="Fail when regeneration changes the file.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    if args.metadata_file:
        metadata = json.loads(args.metadata_file.read_text(encoding="utf-8"))
    else:
        token = os.environ.get("PROFILE_SOURCE_TOKEN") or os.environ.get("GH_TOKEN")
        if token:
            metadata = [
                github_repository(catalog["organization"], item["name"], token)
                for item in catalog["repositories"]
            ]
        else:
            metadata = [
                github_repository_cli(catalog["organization"], item["name"])
                for item in catalog["repositories"]
            ]

    current = args.profile.read_text(encoding="utf-8")
    generated = replace_generated_section(current, render_section(catalog, metadata))
    if args.check:
        if generated != current:
            print(f"{args.profile} is not current", file=sys.stderr)
            return 1
        return 0
    if generated != current:
        args.profile.write_text(generated, encoding="utf-8")
        print(f"updated {args.profile}")
    else:
        print(f"no changes in {args.profile}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
