#!/usr/bin/env python3
"""Publish blog hero photos and article index with JPG paths."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from github_push import BRANCH, REPO, TOKEN, api, file_api_put  # noqa: E402

TEXT_FILES = [
    "blog.html",
    "css/blog.css",
    "js/main.js",
    "js/blog.js",
    "data/articles-index.js",
    "data/articles-batch30-index.js",
    "scripts/github_push.py",
    "scripts/github_push_blog.py",
    "scripts/push-blog-photos.py",
]
MSG = "Blog hero photos: JPG paths in article index"


def push_file(rel: str) -> None:
    local = ROOT / rel
    if not local.exists():
        print(f"SKIP {rel}")
        return
    sha = None
    try:
        sha = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}").get("sha")
    except Exception:
        pass
    file_api_put(rel, local.read_bytes(), f"{MSG} ({rel})", sha)
    print(f"OK {rel}")


def main() -> None:
    if not TOKEN:
        sys.exit("GitHub token not found in ~/.config/gh/hosts.yml")

    for rel in TEXT_FILES:
        push_file(rel)

    jpg_dir = ROOT / "assets" / "blog"
    count = 0
    for path in sorted(jpg_dir.glob("*-hero.jpg")):
        if path.name == "slug-hero.jpg":
            continue
        rel = path.relative_to(ROOT).as_posix()
        sha = None
        try:
            sha = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}").get("sha")
        except Exception:
            pass
        file_api_put(rel, path.read_bytes(), f"{MSG} ({rel})", sha)
        count += 1
        print(f"OK {rel}")

    print(f"Done: {count} JPG + {len(TEXT_FILES)} text files pushed to {BRANCH}")


if __name__ == "__main__":
    main()