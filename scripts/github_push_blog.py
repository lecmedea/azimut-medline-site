#!/usr/bin/env python3
"""Upload blog hero JPGs to GitHub via REST API."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from github_push import REPO, BRANCH, TOKEN, api, file_api_put  # noqa: E402

OUT = ROOT / "assets" / "blog"
MSG = "Add blog hero JPG photos"


def main() -> None:
    if not TOKEN:
        sys.exit("GitHub token not found")

    count = 0
    for path in sorted(OUT.glob("*-hero.jpg")):
        rel = path.relative_to(ROOT).as_posix()
        sha = None
        try:
            meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
            sha = meta.get("sha")
        except Exception:
            pass
        file_api_put(rel, path.read_bytes(), f"{MSG} ({rel})", sha)
        count += 1
        print(f"OK {rel}")

    print(f"Done: {count} JPG files pushed")


if __name__ == "__main__":
    main()