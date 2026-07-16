#!/usr/bin/env python3
"""Push video layering + cropped banners fix to GitHub."""
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
COMMIT_MSG = "Fix hero video flash, crop banners, compass opacity"

HOSTS = pathlib.Path.home() / ".config/gh/hosts.yml"
if HOSTS.exists():
    for line in HOSTS.read_text(encoding="utf-8").splitlines():
        if "oauth_token:" in line:
            TOKEN = line.split("oauth_token:", 1)[1].strip()
            break

if not TOKEN:
    sys.exit("GitHub token not found")


def collect_files() -> list[str]:
    rels = [
        "index.html",
        "css/style.css",
        "css/responsive.css",
        "js/main.js",
        "scripts/push-video-layers-fix.py",
    ]
    for i in range(1, 10):
        rels.append(f"assets/banners/banner-{i:02d}.jpg")
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
            "User-Agent": "azimut-video-layers-push",
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
    for rel in collect_files():
        push_file(rel)
    print("Done.")


if __name__ == "__main__":
    main()