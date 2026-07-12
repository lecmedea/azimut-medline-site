#!/usr/bin/env python3
"""Push local file changes to GitHub via REST API (no git binary needed)."""
from __future__ import annotations

import base64
import json
import pathlib
import sys
import urllib.error
import urllib.request

REPO = "lecmedea/azimut-medline-site"
BRANCH = "main"
ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKEN = ""

# Read token from gh CLI config
HOSTS = pathlib.Path.home() / ".config/gh/hosts.yml"
if HOSTS.exists():
    for line in HOSTS.read_text(encoding="utf-8").splitlines():
        if "oauth_token:" in line:
            TOKEN = line.split("oauth_token:", 1)[1].strip()
            break

if not TOKEN:
    sys.exit("GitHub token not found in ~/.config/gh/hosts.yml")

FILES = [
    "services.html",
    "js/chatbot.js",
    "css/chatbot.css",
    "assets/icons/iconly/doctor.svg",
    "assets/icons/iconly/family.svg",
    "assets/icons/iconly/shield.svg",
    "docs/agent-handoff-log.md",
    "scripts/publish-changes.command",
    "scripts/github_push.py",
    "about.html",
    "article.html",
    "blog.html",
    "contacts.html",
    "doctors.html",
    "index.html",
    "partnership.html",
    "payment.html",
    "personal-data.html",
    "prices.html",
    "privacy.html",
    "services.html",
    "terms.html",
    "tests.html",
]


def api(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"https://api.github.com{path}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "azimut-publish-script",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else {}


def file_api_put(path: str, content: bytes, message: str, sha: str | None) -> dict:
    payload = {
        "message": message,
        "content": base64.b64encode(content).decode("ascii"),
        "branch": BRANCH,
    }
    if sha:
        payload["sha"] = sha
    return api("PUT", f"/repos/{REPO}/contents/{path}", payload)


def main() -> None:
    unique_files = []
    seen = set()
    for rel in FILES:
        if rel not in seen:
            seen.add(rel)
            unique_files.append(rel)

    commit_msg = "Services icons, Philipp doctor avatar, blog hero photos"
    updated = 0

    for rel in unique_files:
        local = ROOT / rel
        if not local.exists():
            print(f"SKIP missing local: {rel}")
            continue

        sha = None
        try:
            meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
            sha = meta.get("sha")
        except urllib.error.HTTPError as err:
            if err.code != 404:
                raise

        content = local.read_bytes()
        file_api_put(rel, content, f"{commit_msg} ({rel})", sha)
        updated += 1
        print(f"OK {rel}")

    print(f"Done: {updated} files pushed to {BRANCH}")


if __name__ == "__main__":
    main()