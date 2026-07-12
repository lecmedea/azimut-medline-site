#!/usr/bin/env python3
"""Push services icon size fix to GitHub."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from github_push import BRANCH, REPO, TOKEN, api, file_api_put  # noqa: E402

FILES = [
    "services.html",
    "css/style.css",
    "scripts/github_push.py",
    "scripts/push-directions-icons.py",
]
MSG = "Fix directions icons size on services page"


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