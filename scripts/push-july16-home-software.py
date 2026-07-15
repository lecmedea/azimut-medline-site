#!/usr/bin/env python3
"""July 16 update: banners, hero video, software page, SEO, nav sync + GitHub push."""
from __future__ import annotations

import base64
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

REPO = "lecmedea/azimut-medline-site"
BRANCH = "main"
ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKEN = ""
COMMIT_MSG = "Home banners, hero video, software page, Google SEO, mobile nav polish"

NAV_ITEM = '<div class="nav-item"><a class="nav-link" href="software.html">Наше ПО</a></div>'
NAV_PATTERN = re.compile(
    r'(<div class="nav-item has-dropdown">\s*<a class="nav-link" href="blog\.html")'
)

HOSTS = pathlib.Path.home() / ".config/gh/hosts.yml"
if HOSTS.exists():
    for line in HOSTS.read_text(encoding="utf-8").splitlines():
        if "oauth_token:" in line:
            TOKEN = line.split("oauth_token:", 1)[1].strip()
            break

if not TOKEN:
    sys.exit("GitHub token not found")


def sync_nav() -> int:
    updated = 0
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if 'href="software.html">Наше ПО' in text:
            continue
        new_text, count = NAV_PATTERN.subn(f"{NAV_ITEM}\n        \\1", text, count=1)
        if count:
            path.write_text(new_text, encoding="utf-8")
            updated += 1
            print(f"NAV {path.name}")
    return updated


def collect_files() -> list[str]:
    rels: list[str] = []
    for path in sorted(ROOT.glob("*.html")):
        rels.append(str(path.relative_to(ROOT)).replace("\\", "/"))
    for rel in (
        "css/style.css",
        "css/responsive.css",
        "js/main.js",
        "js/access-gate.js",
        "robots.txt",
        "sitemap.xml",
        "scripts/push-july16-home-software.py",
    ):
        rels.append(rel)
    for i in range(1, 10):
        rels.append(f"assets/banners/banner-{i:02d}.jpg")
    rels.append("assets/video/hero-bg.mp4")
    return rels


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
            "User-Agent": "azimut-july16-push",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else {}


def push_file(rel: str) -> None:
    local = ROOT / rel
    if not local.exists():
        print(f"SKIP missing {rel}")
        return
    sha = None
    try:
        meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
        sha = meta.get("sha")
    except urllib.error.HTTPError as err:
        if err.code != 404:
            raise
    payload = {
        "message": f"{COMMIT_MSG} ({rel})",
        "content": base64.b64encode(local.read_bytes()).decode("ascii"),
        "branch": BRANCH,
    }
    if sha:
        payload["sha"] = sha
    api("PUT", f"/repos/{REPO}/contents/{rel}", payload)
    print(f"OK {rel}")


def main() -> None:
    sync_nav()
    for rel in collect_files():
        push_file(rel)
    print("Done.")


if __name__ == "__main__":
    main()