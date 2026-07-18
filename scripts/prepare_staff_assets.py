#!/usr/bin/env python3
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images" / "staff-portraits"
MAP_OUT = ROOT / "assets" / "generated" / "mental-health-map-bg.jpg"

DIPTYCHES = [
    "ig_0632458b4ebec338016a5ac9c517d08191979e584fad8c199b.png",
    "ig_0f056512db51b340016a5aca9af6508191a5b9bcd94eec7f5c.png",
    "ig_044edcaf36c5e987016a5acb5403e48191bd692e1963d11af4.png",
    "ig_0a4ba5b32e47ffdd016a5acba342448191bd8045b8b460f81d.png",
    "ig_0c5bac1615e7c6d9016a5acc2ede2881919e6717405c14f009.png",
    "ig_048fa3bb9a7b66be016a5acc823a148191b26afdcc29f87cde.png",
    "ig_0a029100b9915f7f016a5acd237f848191b528d5fe5c2361cc.png",
]

GEN_DIR = Path("/Users/polzovatel/.codex/generated_images/019f7218-19dd-7d32-9e1d-5477f544ac0d")

DISPLAY = ROOT / "assets" / "fonts" / "farabee" / "Farabee-Regular.ttf"
DISPLAY_MED = ROOT / "assets" / "fonts" / "farabee" / "Farabee-Medium.ttf"
BODY = ROOT / "assets" / "fonts" / "montserrat" / "Montserrat-Light.ttf"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def cover_crop(img: Image.Image, size: tuple[int, int], anchor_y: float = 0.42) -> Image.Image:
    src_w, src_h = img.size
    dst_w, dst_h = size
    src_ratio = src_w / src_h
    dst_ratio = dst_w / dst_h
    if src_ratio > dst_ratio:
        new_w = int(src_h * dst_ratio)
        left = (src_w - new_w) // 2
        box = (left, 0, left + new_w, src_h)
    else:
        new_h = int(src_w / dst_ratio)
        top = int((src_h - new_h) * anchor_y)
        top = max(0, min(src_h - new_h, top))
        box = (0, top, src_w, top + new_h)
    return img.crop(box).resize(size, Image.Resampling.LANCZOS)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def paste_rounded(base: Image.Image, img: Image.Image, xy: tuple[int, int], radius: int, shadow: bool = True) -> None:
    mask = rounded_mask(img.size, radius)
    x, y = xy
    if shadow:
        shadow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow_layer)
        shadow_draw.rounded_rectangle(
            (x + 18, y + 22, x + img.width + 18, y + img.height + 22),
            radius=radius,
            fill=(85, 57, 31, 54),
        )
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(20))
        base.alpha_composite(shadow_layer)
    base.paste(img.convert("RGBA"), xy, mask)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_lines(draw: ImageDraw.ImageDraw, xy: tuple[int, int], lines: list[str], fnt: ImageFont.FreeTypeFont, fill, gap: int) -> int:
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += draw.textbbox((0, 0), line, font=fnt)[3] + gap
    return y


def split_diptychs() -> list[Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    normal_paths: list[Path] = []
    for idx, name in enumerate(DIPTYCHES, start=1):
        src = Image.open(GEN_DIR / name).convert("RGB")
        w, h = src.size
        center = w // 2
        left = src.crop((0, 0, center - 3, h))
        right = src.crop((center + 3, 0, w, h))
        left = cover_crop(left, (900, 1125), anchor_y=0.36)
        right = cover_crop(right, (900, 1125), anchor_y=0.36)
        left = ImageEnhance.Color(left).enhance(1.02)
        right = ImageEnhance.Color(right).enhance(1.02)
        normal = OUT / f"staff-{idx:02d}.jpg"
        smile = OUT / f"staff-{idx:02d}-smile.jpg"
        left.save(normal, quality=88, optimize=True, progressive=True)
        right.save(smile, quality=88, optimize=True, progressive=True)
        normal_paths.append(normal)
    return normal_paths


def draw_warm_background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, "#fff8ed")
    pix = img.load()
    random.seed(42)
    for y in range(h):
        for x in range(w):
            t = (x / w) * 0.7 + (y / h) * 0.3
            wave = math.sin((x / w) * math.pi * 3.0 + (y / h) * 2.5) * 0.035
            r = int(255 - 21 * t + 16 * wave)
            g = int(249 - 35 * t + 8 * wave)
            b = int(237 - 58 * t)
            pix[x, y] = (max(228, min(255, r)), max(210, min(255, g)), max(186, min(255, b)))
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(10):
        cx = int(w * (0.08 + i * 0.11))
        cy = int(h * (0.22 + (i % 3) * 0.22))
        draw.ellipse((cx - 260, cy - 180, cx + 260, cy + 180), fill=(255, 255, 255, 22))
    for i in range(9):
        y = int(h * (0.18 + i * 0.09))
        draw.arc((-220, y - 180, w + 220, y + 260), start=8, end=166, fill=(187, 147, 97, 38), width=3)
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    return img


def create_team_banner_portraits(normal_paths: list[Path], size: tuple[int, int]) -> Image.Image:
    banner = draw_warm_background(size)
    draw = ImageDraw.Draw(banner)
    w, h = size

    if w > h:
        title_font = font(BODY, 88)
        sub_font = font(BODY, 34)
        small_font = font(BODY, 24)
        left = 120
        top = 130
        draw.text((left, top), "Команда,", font=title_font, fill="#5a3f28")
        draw.text((left, top + 96), "которой доверяют", font=title_font, fill="#5a3f28")
        draw.text((left, top + 192), "путь к себе", font=title_font, fill="#9b7046")
        lines = wrap_text(
            draw,
            "Психиатры, наркологи, психотерапевты и психологи работают вместе, чтобы помощь была бережной, понятной и безопасной.",
            sub_font,
            740,
        )
        y = draw_lines(draw, (left, top + 330), lines, sub_font, "#665846", 14)
        draw.rounded_rectangle((left, y + 34, left + 430, y + 104), radius=35, fill="#b58b5e")
        draw.text((left + 34, y + 50), "Подобрать специалиста", font=small_font, fill="#fffaf2")

        card_w, card_h = 310, 388
        positions = [
            (1090, 84), (1370, 58), (1650, 90), (1925, 145),
            (1195, 480), (1500, 438), (1810, 484),
        ]
        for i, path in enumerate(normal_paths):
            im = Image.open(path).convert("RGB")
            crop = cover_crop(im, (card_w, card_h), anchor_y=0.3)
            paste_rounded(banner, crop, positions[i], 34, shadow=True)
    else:
        title_font = font(BODY, 70)
        sub_font = font(BODY, 31)
        small_font = font(BODY, 24)
        left = 72
        top = 72
        for text, color in [
            ("Команда,", "#5a3f28"),
            ("которой доверяют", "#5a3f28"),
            ("путь к себе", "#9b7046"),
        ]:
            draw.text((left, top), text, font=title_font, fill=color)
            top += 78
        lines = wrap_text(
            draw,
            "Специалисты Азимут Клиник работают вместе, чтобы помощь была бережной, понятной и безопасной.",
            sub_font,
            w - 144,
        )
        top = draw_lines(draw, (left, top + 20), lines, sub_font, "#665846", 12)
        draw.rounded_rectangle((left, top + 26, left + 380, top + 92), radius=33, fill="#b58b5e")
        draw.text((left + 30, top + 43), "Наша команда", font=small_font, fill="#fffaf2")

        card_w, card_h = 270, 338
        positions = [
            (70, 590), (405, 555), (740, 590),
            (238, 900), (575, 900),
            (70, 1140), (740, 1140),
        ]
        for i, path in enumerate(normal_paths):
            im = Image.open(path).convert("RGB")
            crop = cover_crop(im, (card_w, card_h), anchor_y=0.3)
            paste_rounded(banner, crop, positions[i], 32, shadow=True)
    return banner.convert("RGB")


def create_team_banners(normal_paths: list[Path]) -> None:
    desktop = create_team_banner_portraits(normal_paths, (2400, 900))
    desktop.save(OUT / "team-banner-desktop.jpg", quality=88, optimize=True, progressive=True)
    mobile = create_team_banner_portraits(normal_paths, (1080, 1500))
    mobile.save(OUT / "team-banner-mobile.jpg", quality=88, optimize=True, progressive=True)


def create_mental_map() -> None:
    size = (1600, 1100)
    img = draw_warm_background(size).convert("RGBA")
    draw = ImageDraw.Draw(img)
    w, h = size
    random.seed(7)

    for _ in range(1800):
        x = random.randrange(w)
        y = random.randrange(h)
        a = random.randrange(8, 24)
        draw.point((x, y), fill=(119, 86, 50, a))

    line = (139, 105, 67, 95)
    soft = (177, 137, 89, 66)
    for i in range(11):
        y = int(90 + i * 92 + math.sin(i) * 18)
        draw.arc((-180, y - 170, w + 280, y + 270), 192, 348, fill=soft, width=2)
    for i in range(8):
        x = int(120 + i * 190)
        draw.arc((x - 250, -120, x + 320, h + 130), 74, 246, fill=(139, 105, 67, 42), width=2)

    route = []
    for i in range(18):
        x = int(160 + i * 78)
        y = int(740 - math.sin(i * 0.8) * 120 - i * 18)
        route.append((x, y))
    for a, b in zip(route, route[1:]):
        draw.line((a, b), fill=(142, 98, 54, 120), width=4)
    for x, y in route[::4]:
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=(181, 139, 88, 180))

    title_font = font(DISPLAY, 54)
    small_font = font(BODY, 26)
    draw.text((110, 88), "Карта ментального здоровья", font=title_font, fill=(93, 65, 37, 155))
    draw.text((115, 155), "маршрут к себе", font=small_font, fill=(128, 92, 55, 130))

    vignette = Image.new("L", size, 0)
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, w, h), fill=190)
    vd.rounded_rectangle((80, 70, w - 80, h - 70), radius=80, fill=25)
    vignette = vignette.filter(ImageFilter.GaussianBlur(80))
    shade = Image.new("RGBA", size, (92, 54, 20, 0))
    shade.putalpha(vignette)
    img = Image.alpha_composite(img, shade)
    img = ImageEnhance.Contrast(img.convert("RGB")).enhance(1.02)
    img.save(MAP_OUT, quality=88, optimize=True, progressive=True)


def crop_banner_edges() -> None:
    for folder, inset in [
        (ROOT / "assets" / "banners-tight", 18),
        (ROOT / "assets" / "banners-mobile", 16),
    ]:
        if not folder.exists():
            continue
        for path in sorted(folder.glob("banner-*.jpg")):
            img = Image.open(path).convert("RGB")
            w, h = img.size
            crop = img.crop((inset, inset, w - inset, h - inset)).resize((w, h), Image.Resampling.LANCZOS)
            crop.save(path, quality=88, optimize=True, progressive=True)


def main() -> None:
    normal_paths = split_diptychs()
    create_team_banners(normal_paths)
    create_mental_map()
    crop_banner_edges()
    print(f"Prepared {len(normal_paths)} staff portrait pairs in {OUT}")
    print(f"Prepared {OUT / 'team-banner-desktop.jpg'}")
    print(f"Prepared {OUT / 'team-banner-mobile.jpg'}")
    print(f"Prepared {MAP_OUT}")


if __name__ == "__main__":
    main()
