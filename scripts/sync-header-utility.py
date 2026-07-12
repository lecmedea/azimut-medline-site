#!/usr/bin/env python3
"""Wrap header badge+phone+utility links in .header-utility for consistent grid layout."""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
UTILITY_LINKS = (
    '<a class="header-utility-link" href="contacts.html#appointment">Заказать звонок</a>'
    '<a class="header-utility-link" href="services.html#home">Вызвать врача</a>'
)
PATTERN = re.compile(
    r'<div class="header-actions">\s*'
    r'(<span class="round-badge">.*?</span>\s*<a class="phone-link"[^>]*>.*?</a>\s*)'
    r'(?!<div class="header-utility">)'
    r'(<a class="button[^"]*"[^>]*>.*?</a>|<button class="button[^"]*"[^>]*>.*?</button>)',
    re.S,
)


def fix_html(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if 'class="header-utility"' in text:
        return False

    def repl(match: re.Match[str]) -> str:
        inner = match.group(1).strip()
        button = match.group(2).strip()
        return (
            '<div class="header-actions">'
            f'<div class="header-utility">{inner}{UTILITY_LINKS}</div>'
            f'{button}'
        )

    new_text, count = PATTERN.subn(repl, text, count=1)
    if not count:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    updated = 0
    for path in sorted(ROOT.glob("*.html")):
        if fix_html(path):
            print(f"OK {path.name}")
            updated += 1
    print(f"Updated {updated} files")


if __name__ == "__main__":
    main()