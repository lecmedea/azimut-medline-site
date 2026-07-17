from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "banners-tight"
OUT = ROOT / "assets" / "banners-mobile"
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

SLIDES = [
    {
        "file": "banner-01.jpg",
        "title": "Вернуться к себе - возможно",
        "body": "Ментальное здоровье - это способность жить полноценно, чувствовать, принимать решения и строить гармоничные отношения.",
        "crop": (0.44, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-02.jpg",
        "title": "Сон - основа восстановления",
        "body": "Если вы долго не можете уснуть или часто просыпаетесь, специалист поможет разобраться в причинах.",
        "crop": (0.48, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-03.jpg",
        "title": "Отношениям иногда нужен переводчик",
        "body": "Семейная терапия помогает восстановить диалог, снизить напряжение и научиться слышать друг друга.",
        "crop": (0.46, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-04.jpg",
        "title": "Консультация психиатра",
        "body": "Квалифицированная медицинская помощь, оценка состояния и понятный план дальнейших действий.",
        "crop": (0.47, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-05.jpg",
        "title": "Восстановление ресурса",
        "body": "При эмоциональном выгорании помогают проверенные методики и, при необходимости, медикаментозная поддержка.",
        "crop": (0.47, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-06.jpg",
        "title": "Комплексный подход",
        "body": "Диагностика и лечение подбираются вместе со специалистом: психологом, психотерапевтом или психиатром.",
        "crop": (0.43, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-07.jpg",
        "title": "Когда вы не понимаете ребёнка",
        "body": "Специалист подскажет, какие изменения требуют внимания и с чего безопаснее начать помощь.",
        "crop": (0.52, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-08.jpg",
        "title": "Когда эмоции становятся слишком громкими",
        "body": "Консультация поможет найти причину, вернуть устойчивость и выбрать спокойный маршрут поддержки.",
        "crop": (0.45, 0.0, 1.0, 1.0),
    },
    {
        "file": "banner-09.jpg",
        "title": "Профессиональная помощь",
        "body": "Когда справляться в одиночку больше нет сил, первый шаг - просто записаться на консультацию.",
        "crop": (0.44, 0.0, 1.0, 1.0),
    },
]


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size=size)


def cover(img, size):
    return ImageOps.fit(img, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def wrap_text(draw, text, font_obj, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if draw.textbbox((0, 0), test, font=font_obj)[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(draw, xy, text, font_obj, fill, max_width, line_gap=10):
    x, y = xy
    for line in wrap_text(draw, text, font_obj, max_width):
        draw.text((x, y), line, font=font_obj, fill=fill)
        y += draw.textbbox((0, 0), line, font=font_obj)[3] + line_gap
    return y


def rounded_paste(base, img, xy, radius=42):
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, img.width, img.height), radius=radius, fill=255)
    base.paste(img, xy, mask)


def make_banner(slide):
    src = Image.open(SRC / slide["file"]).convert("RGB")
    canvas = Image.new("RGB", (1200, 1600), "#fbf5ea")

    bg = cover(src, canvas.size).filter(ImageFilter.GaussianBlur(20))
    bg = Image.blend(bg, Image.new("RGB", canvas.size, "#fbf5ea"), 0.36)
    canvas.paste(bg)

    overlay = Image.new("RGBA", canvas.size, (255, 251, 244, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 1200, 1600), fill=(255, 248, 236, 82))
    od.ellipse((-260, 930, 980, 1900), fill=(229, 200, 154, 64))
    od.ellipse((720, -360, 1520, 420), fill=(255, 255, 255, 115))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

    w, h = src.size
    left, top, right, bottom = slide["crop"]
    crop = src.crop((int(w * left), int(h * top), int(w * right), int(h * bottom)))
    photo = cover(crop, (960, 680))
    photo = Image.blend(photo, Image.new("RGB", photo.size, "#fff8ee"), 0.05)
    rounded_paste(canvas, photo, (120, 108), radius=48)

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((120, 108, 1080, 788), radius=48, outline="#efe3d2", width=5)

    # Soft route line from the desktop banners, redrawn for the portrait format.
    route = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(route)
    points = [(158, 972), (334, 900), (552, 948), (724, 862), (1012, 908)]
    for a, b in zip(points, points[1:]):
        rd.line((a, b), fill=(184, 149, 98, 128), width=3)
    for x, y in points[1:-1]:
        rd.ellipse((x - 10, y - 10, x + 10, y + 10), fill=(184, 149, 98, 160))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), route).convert("RGB")
    draw = ImageDraw.Draw(canvas)

    badge_font = font(30, bold=True)
    title_font = font(64, bold=False)
    body_font = font(35)
    draw.rounded_rectangle((120, 850, 1080, 1468), radius=46, fill=(255, 251, 244), outline="#eadcc8", width=3)
    draw.text((170, 904), "АЗИМУТ КЛИНИК", font=badge_font, fill="#b99059")
    y = draw_wrapped(draw, (170, 980), slide["title"], title_font, "#473b2f", 820, line_gap=12)
    draw_wrapped(draw, (170, y + 34), slide["body"], body_font, "#7c6a58", 825, line_gap=12)

    draw.rounded_rectangle((170, 1370, 500, 1428), radius=29, outline="#d5b98b", width=2)
    draw.text((202, 1382), "Записаться", font=font(28, bold=True), fill="#756143")

    out = OUT / slide["file"]
    canvas.save(out, quality=88, optimize=True, progressive=True)
    return out


def make_contact_sheet(files):
    thumbs = []
    for path in files:
        im = Image.open(path).resize((180, 240))
        thumbs.append((path.name, im))
    sheet = Image.new("RGB", (600, 3 * 300), "white")
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(thumbs):
        x = (i % 3) * 200 + 10
        y = (i // 3) * 300 + 32
        sheet.paste(im, (x, y))
        draw.text((x, y - 24), name, fill=(20, 20, 20), font=font(16))
    sheet.save(ROOT / "tmp" / "mobile-banners-contact-sheet.jpg", quality=90)


if __name__ == "__main__":
    generated = [make_banner(slide) for slide in SLIDES]
    make_contact_sheet(generated)
    for path in generated:
        print(path.relative_to(ROOT))
