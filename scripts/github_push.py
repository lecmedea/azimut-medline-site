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

COMMIT_MSG = "Homepage performance and DNS-ready fixes 2026-07-18"

DELETE_FILES = [
    "assets/video/1368210.gif",
    "assets/video/1368210.mp4",
    *[f"assets/banners/banner-{i:02d}.jpg" for i in range(1, 10)],
    *[f"assets/banners-cropped/banner-{i:02d}.jpg" for i in range(1, 10)],
]


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

    # All site CSS / JS / API (so new pages like entertainment don't 404)
    for pattern in ("css/*.css", "js/*.js", "api/*.js", "data/*.js"):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for rel in (
        "css/style.css",
        "css/responsive.css",
        "css/blog.css",
        "css/entertainment.css",
        "css/creativity.css",
        "css/cookie-consent.css",
        "data/doctors.js",
        "js/tests.js",
        "js/tests-batch200.js",
        "js/blog.js",
        "js/main.js",
        "js/entertainment.js",
        "js/creativity-museum.js",
        "js/creativity-pin.js",
        "js/forms.js",
        "js/crm-bridge.js",
        "js/cookie-consent.js",
        "js/audio-player.js",
        "js/chatbot.js",
        "js/chat-config.js",
        "api/chat.js",
        "api/amo-lead.js",
        "css/chatbot.css",
        "css/access-gate.css",
        "css/animations.css",
        "js/access-gate.js",
        "docs/agent-handoff-log.md",
        "scripts/apply-mobile-site-fixes.py",
        "scripts/audit-article-images.py",
        "assets/generated/header-sand-scatter.svg",
        "scripts/sync-header-utility.py",
        "sitemap.xml",
        "robots.txt",
        "scripts/github_push.py",
        "assets/video/hero-bg.mp4",
        "docs/site-analysis-2026-07-17.md",
        "docs/amo-crm-funnel-2026-07-17.md",
        "docs/osmed-audit-2026-07-17.md",
        "docs/codex-skills-research-2026-07-17.md",
        "docs/offer-completion-report-2026-07-18.md",
        "scripts/generate-batch20-and-seo.py",
        "scripts/generate_mobile_banners.py",
        "scripts/prepare_staff_assets.py",
        "scripts/update-seo-cis.py",
        "assets/icons/philipp-filippovich-avatar.jpg",
        "assets/images/onyx-warm-bg.jpg",
        "assets/generated/hero-compass-cutout.webp",
        "assets/generated/footer-logo-watermark.webp",
        "assets/generated/mental-health-map-bg.jpg",
    ):
        add(ROOT / rel)

    for i in range(1, 10):
        add(ROOT / f"assets/banners-tight/banner-{i:02d}.jpg")
        add(ROOT / f"assets/banners-mobile/banner-{i:02d}.jpg")

    for i in range(1, 8):
        add(ROOT / f"assets/images/staff-portraits/staff-{i:02d}.jpg")
        add(ROOT / f"assets/images/staff-portraits/staff-{i:02d}-smile.jpg")
    add(ROOT / "assets/images/staff-portraits/team-banner-desktop.jpg")
    add(ROOT / "assets/images/staff-portraits/team-banner-mobile.jpg")

    for pattern in ("data/articles*.js",):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for pattern in ("assets/icons/iconly/*.svg", "assets/icons/site-symbols/*.png"):
        for path in sorted(ROOT.glob(pattern)):
            add(path)

    for pattern in (
        "assets/creativity/*",
        "assets/creativity/**/*",  # per-room furniture ru/jp/fr/uk
        "assets/entertainment/*",
        "assets/icons/joystick-gear.*",
    ):
        for path in sorted(ROOT.glob(pattern)):
            if path.is_file() and path.name != ".DS_Store":
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


def file_api_delete(path: str, message: str, sha: str) -> dict:
    payload = {
        "message": message,
        "sha": sha,
        "branch": BRANCH,
    }
    return api("DELETE", f"/repos/{REPO}/contents/{path}", payload)


def main() -> None:
    updated = 0
    skipped = 0
    deleted = 0

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

    for rel in DELETE_FILES:
        try:
            meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
        except urllib.error.HTTPError as err:
            if err.code == 404:
                skipped += 1
                print(f"SKIP already absent: {rel}")
                continue
            raise
        sha = meta.get("sha")
        if not sha:
            skipped += 1
            print(f"SKIP no sha: {rel}")
            continue
        file_api_delete(rel, f"{COMMIT_MSG} delete obsolete ({rel})", sha)
        deleted += 1
        print(f"DELETE {rel}")

    print(f"Done: {updated} files pushed, {deleted} deleted, {skipped} skipped → {BRANCH}")


if __name__ == "__main__":
    main()
