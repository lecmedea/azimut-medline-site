#!/usr/bin/env python3
"""Publish 200 new screening tests to GitHub."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from github_push import BRANCH, REPO, TOKEN, api, file_api_put  # noqa: E402

FILES = [
    "js/tests.js",
    "js/tests-batch200.js",
    "tests.html",
    "scripts/generate-tests-batch200.py",
    "scripts/push-tests-batch200.py",
    "scripts/github_push.py",
]
MSG = "Add 200 psychology screening tests (232 total)"


def main() -> None:
    if not TOKEN:
        sys.exit("GitHub token not found in ~/.config/gh/hosts.yml")

    for rel in FILES:
        local = ROOT / rel
        if not local.exists():
            print(f"SKIP {rel}")
            continue
        sha = None
        try:
            sha = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}").get("sha")
        except Exception:
            pass
        file_api_put(rel, local.read_bytes(), f"{MSG} ({rel})", sha)
        print(f"OK {rel}")

    print(f"Done: pushed to {BRANCH}")


if __name__ == "__main__":
    main()