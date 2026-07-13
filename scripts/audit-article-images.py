#!/usr/bin/env python3
"""Ensure every article index entry has a local hero image; generate JPG if missing."""
from __future__ import annotations

import re
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Pillow required: pip3 install pillow")

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT / "assets" / "blog"
PALETTE = {
    "Психология": ((247, 239, 225), (174, 139, 102), (118, 95, 66)),
    "Психотерапия": ((250, 245, 236), (169, 134, 82), (124, 106, 82)),
    "Зависимость": ((246, 236, 226), (154, 76, 57), (107, 83, 68)),
    "Лайфхаки": ((252, 246, 236), (185, 144, 89), (118, 88, 64)),
    "default": ((252, 246, 236), (174, 139, 102), (90, 75, 60)),
}


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def make_hero(path: Path, title: str, category: str) -> None:
    bg, accent, text = PALETTE.get(category, PALETTE["default"])
    img = Image.new("RGB", (1280, 720), bg)
    draw = ImageDraw.Draw(img)
    draw.ellipse((880, -80, 1320, 360), fill=accent)
    draw.ellipse((-120, 420, 420, 820), fill=(*accent, ))
    draw.rounded_rectangle((72, 520, 760, 620), radius=24, fill=(255, 251, 245))
    draw.text((96, 548), title[:72], fill=text, font=font(34))
    draw.text((96, 86), "Азимут Клиник · блог", fill=accent, font=font(28))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="JPEG", quality=88, optimize=True)


def parse_entries(text: str) -> list[dict]:
    entries = []
    for block in re.findall(r"\{[^{}]*?\}", text, re.S):
        slug = re.search(r'"slug":\s*"([^"]+)"', block)
        image = re.search(r'"image":\s*"([^"]+)"', block)
        title = re.search(r'"title":\s*"([^"]+)"', block)
        category = re.search(r'"category":\s*"([^"]+)"', block)
        if slug and image:
            entries.append({
                "slug": slug.group(1),
                "image": image.group(1),
                "title": title.group(1) if title else slug.group(1),
                "category": category.group(1) if category else "default",
            })
    return entries


def main() -> None:
    created = []
    for index_path in sorted((ROOT / "data").glob("articles*index.js")):
        for entry in parse_entries(index_path.read_text(encoding="utf-8")):
            target = ROOT / entry["image"]
            if target.exists() and target.stat().st_size > 500:
                continue
            if not str(entry["image"]).endswith((".jpg", ".jpeg", ".png", ".webp")):
                target = BLOG / f"{entry['slug']}-hero.jpg"
            make_hero(target, entry["title"], entry["category"])
            created.append(str(target.relative_to(ROOT)))
    print(f"created {len(created)} images")
    for path in created:
        print(" ", path)


if __name__ == "__main__":
    main()