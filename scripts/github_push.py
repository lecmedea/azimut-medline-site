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

HOSTS = pathlib.Path.home() / ".config/gh/hosts.yml"
if HOSTS.exists():
    for line in HOSTS.read_text(encoding="utf-8").splitlines():
        if "oauth_token:" in line:
            TOKEN = line.split("oauth_token:", 1)[1].strip()
            break

if not TOKEN:
    sys.exit("GitHub token not found in ~/.config/gh/hosts.yml")

COMMIT_MSG = "Gold palette, Philipp chat, test timer, header sand, perf"


def collect_files() -> list[str]:
    rels: list[str] = []

    def add(path: pathlib.Path) -> None:
        if path.is_file():
            rel = str(path.relative_to(ROOT)).replace("\\", "/")
            if rel not in rels:
                rels.append(rel)

    for pattern in ("*.html",):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for rel in (
        "css/style.css",
        "css/responsive.css",
        "css/blog.css",
        "js/tests.js",
        "js/tests-batch200.js",
        "js/blog.js",
        "js/main.js",
        "js/chatbot.js",
        "js/chat-config.js",
        "api/chat.js",
        "css/chatbot.css",
        "css/animations.css",
        "docs/agent-handoff-log.md",
        "assets/generated/header-sand-scatter.svg",
        "scripts/sync-header-utility.py",
        "sitemap.xml",
        "robots.txt",
        "scripts/github_push.py",
        "scripts/generate-batch20-and-seo.py",
    ):
        add(ROOT / rel)

    for pattern in ("data/articles*.js",):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for pattern in ("assets/blog/*-hero.svg",):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for pattern in ("assets/icons/iconly/*.svg", "assets/icons/site-symbols/*.png"):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    return rels


FILES = collect_files()


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
    updated = 0
    skipped = 0

    for rel in FILES:
        local = ROOT / rel
        if not local.exists():
            print(f"SKIP missing local: {rel}")
            skipped += 1
            continue

        sha = None
        try:
            meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
            sha = meta.get("sha")
        except urllib.error.HTTPError as err:
            if err.code != 404:
                raise

        content = local.read_bytes()
        file_api_put(rel, content, f"{COMMIT_MSG} ({rel})", sha)
        updated += 1
        print(f"OK {rel}")

    print(f"Done: {updated} files pushed, {skipped} skipped → {BRANCH}")


if __name__ == "__main__":
    main()