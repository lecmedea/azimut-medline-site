from pathlib import Path
import json
import textwrap

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "vk-2026"
BG = OUT / "source" / "brand-background-ai.png"
MARK = ROOT / "assets" / "azimut-clinic-logo.png"
FONT_REG = ROOT / "assets" / "fonts" / "farabee" / "Farabee-Regular.ttf"
FONT_MED = ROOT / "assets" / "fonts" / "farabee" / "Farabee-Medium.ttf"

IVORY = "#F4EEE5"
SAND = "#D8C4AE"
TAUPE = "#8A7364"
BROWN = "#4B382F"
WHITE = "#FFFFFF"


def font(size, medium=False):
    return ImageFont.truetype(str(FONT_MED if medium else FONT_REG), size)


def fit_bg(size, offset=(0.5, 0.5)):
    image = Image.open(BG).convert("RGB")
    image = ImageEnhance.Color(image).enhance(0.78)
    image = ImageEnhance.Contrast(image).enhance(0.92)
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=offset).convert("RGBA")


def clean_mark(size):
    mark = Image.open(MARK).convert("RGBA")
    data = []
    for r, g, b, a in mark.getdata():
        alpha = 0 if r > 245 and g > 245 and b > 245 else a
        data.append((r, g, b, alpha))
    mark.putdata(data)
    mark.thumbnail((size, size), Image.Resampling.LANCZOS)
    return mark


def add_brand(canvas, x, y, mark_size, text_size, color=BROWN, light=False):
    mark = clean_mark(mark_size)
    canvas.alpha_composite(mark, (x, y))
    draw = ImageDraw.Draw(canvas)
    name_color = WHITE if light else color
    draw.text((x + mark_size + 18, y + max(0, mark_size // 2 - text_size)), "АЗИМУТ КЛИНИК", font=font(text_size, True), fill=name_color)
    draw.text((x + mark_size + 18, y + max(0, mark_size // 2 + 6)), "Психология · Психиатрия", font=font(max(12, text_size // 2)), fill=name_color)


def rounded_panel(canvas, box, fill, radius=32, outline=None, width=1):
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    canvas.alpha_composite(overlay)


def center_text(draw, box, text, fnt, fill, spacing=10, align="center"):
    x1, y1, x2, y2 = box
    bbox = draw.multiline_textbbox((0, 0), text, font=fnt, spacing=spacing, align=align)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.multiline_text(((x1 + x2 - w) / 2, (y1 + y2 - h) / 2), text, font=fnt, fill=fill, spacing=spacing, align=align)


def save(image, filename):
    path = OUT / filename
    image.convert("RGB").save(path, "PNG", optimize=True)
    return path


def build_avatar():
    image = fit_bg((400, 400), (0.42, 0.46))
    rounded_panel(image, (38, 38, 362, 362), (244, 238, 229, 235), 162, (75, 56, 47, 90), 2)
    mark = clean_mark(224)
    image.alpha_composite(mark, ((400 - mark.width) // 2, 66))
    draw = ImageDraw.Draw(image)
    center_text(draw, (45, 294, 355, 354), "АЗИМУТ КЛИНИК", font(27, True), BROWN)
    return save(image, "vk-avatar-community-400x400.png")


def build_desktop_cover():
    image = fit_bg((1590, 530), (0.52, 0.5))
    panel = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle((165, 105, 1055, 465), radius=42, fill=(244, 238, 229, 226))
    image.alpha_composite(panel)
    add_brand(image, 220, 132, 100, 39)
    draw = ImageDraw.Draw(image)
    draw.text((220, 260), "Помощь рядом. 24/7", font=font(58, True), fill=BROWN)
    draw.text((220, 337), "Психология · Психиатрия · Наркология", font=font(27), fill=TAUPE)
    draw.rounded_rectangle((220, 393, 770, 449), radius=28, fill=BROWN)
    draw.text((251, 404), "8 (925) 112-77-99  ·  azimutclinic.ru", font=font(23, True), fill=WHITE)
    return save(image, "vk-cover-community-desktop-1590x530.png")


def build_live_cover():
    image = fit_bg((1080, 1920), (0.55, 0.5))
    shade = Image.new("RGBA", image.size, (75, 56, 47, 0))
    sd = ImageDraw.Draw(shade)
    sd.rounded_rectangle((88, 245, 992, 1670), radius=54, fill=(244, 238, 229, 224))
    image.alpha_composite(shade)
    add_brand(image, 170, 320, 150, 48)
    draw = ImageDraw.Draw(image)
    center_text(draw, (150, 635, 930, 940), "Помощь рядом\nв любой момент", font(82, True), BROWN, 22)
    center_text(draw, (180, 990, 900, 1160), "Психология · Психиатрия\nНаркология", font(38), TAUPE, 12)
    draw.rounded_rectangle((175, 1280, 905, 1395), radius=58, fill=BROWN)
    center_text(draw, (175, 1280, 905, 1395), "ЗАПИСАТЬСЯ НА КОНСУЛЬТАЦИЮ", font(30, True), WHITE)
    center_text(draw, (170, 1435, 910, 1585), "8 (925) 112-77-99\nazimutclinic.ru", font(35, True), BROWN, 10)
    return save(image, "vk-cover-live-mobile-1080x1920.png")


def build_menu(filename, title, number):
    image = fit_bg((376, 256), (0.45 + number * 0.04, 0.52))
    rounded_panel(image, (18, 18, 358, 238), (244, 238, 229, 226), 28, (75, 56, 47, 70), 2)
    draw = ImageDraw.Draw(image)
    draw.ellipse((38, 43, 108, 113), fill=BROWN)
    center_text(draw, (38, 43, 108, 113), f"0{number}", font(24, True), WHITE)
    draw.text((38, 147), title, font=font(28, True), fill=BROWN)
    draw.line((38, 194, 325, 194), fill=TAUPE, width=2)
    draw.text((38, 202), "АЗИМУТ КЛИНИК", font=font(13), fill=TAUPE)
    return save(image, filename)


def build_post(filename, eyebrow, title, body, cta, offset):
    image = fit_bg((1080, 1350), (0.38 + offset * 0.1, 0.5))
    rounded_panel(image, (78, 90, 1002, 1260), (244, 238, 229, 226), 48)
    add_brand(image, 130, 145, 120, 40)
    draw = ImageDraw.Draw(image)
    draw.text((130, 370), eyebrow.upper(), font=font(25, True), fill=TAUPE)
    wrapped = "\n".join(textwrap.wrap(title, width=19))
    draw.multiline_text((130, 425), wrapped, font=font(68, True), fill=BROWN, spacing=12)
    draw.line((130, 690, 860, 690), fill=SAND, width=4)
    body_wrapped = "\n".join(textwrap.wrap(body, width=40))
    draw.multiline_text((130, 745), body_wrapped, font=font(34), fill=TAUPE, spacing=13)
    draw.rounded_rectangle((130, 1060, 810, 1165), radius=53, fill=BROWN)
    center_text(draw, (130, 1060, 810, 1165), cta, font(27, True), WHITE)
    draw.text((130, 1195), "azimutclinic.ru  ·  8 (925) 112-77-99", font=font(22, True), fill=BROWN)
    return save(image, filename)


def build_service(filename, title, subtitle, number, offset):
    image = fit_bg((1000, 1000), (0.4 + offset * 0.12, 0.54))
    rounded_panel(image, (70, 70, 930, 930), (244, 238, 229, 228), 48)
    draw = ImageDraw.Draw(image)
    draw.ellipse((125, 125, 285, 285), fill=BROWN)
    center_text(draw, (125, 125, 285, 285), number, font(54, True), WHITE)
    draw.text((125, 390), title, font=font(68, True), fill=BROWN)
    wrapped = "\n".join(textwrap.wrap(subtitle, width=31))
    draw.multiline_text((125, 515), wrapped, font=font(33), fill=TAUPE, spacing=12)
    draw.line((125, 735, 820, 735), fill=SAND, width=4)
    draw.text((125, 785), "Консультации в клинике, онлайн и на дому", font=font(25, True), fill=BROWN)
    draw.text((125, 850), "azimutclinic.ru", font=font(25), fill=TAUPE)
    return save(image, filename)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    outputs = [
        build_avatar(),
        build_desktop_cover(),
        build_live_cover(),
        build_menu("vk-menu-about-clinic-376x256.png", "О клинике", 1),
        build_menu("vk-menu-services-376x256.png", "Услуги", 2),
        build_menu("vk-menu-prices-376x256.png", "Цены", 3),
        build_menu("vk-menu-contacts-376x256.png", "Контакты", 4),
        build_post("vk-post-appointment-1080x1350.png", "Консультация", "Записаться на консультацию", "Оставьте заявку — администратор уточнит детали и подберёт удобный формат помощи.", "ОСТАВИТЬ ЗАЯВКУ", 0),
        build_post("vk-post-ask-question-1080x1350.png", "Связь 24/7", "Задать вопрос специалисту", "Бережно сориентируем по направлениям клиники. Без диагнозов и назначения лечения в переписке.", "НАПИСАТЬ НАМ", 1),
        build_post("vk-post-patient-reviews-1080x1350.png", "Доверие", "Отзывы пациентов", "Истории о внимательном отношении, конфиденциальности и понятном пути к помощи.", "ЧИТАТЬ ОТЗЫВЫ", 2),
        build_service("vk-service-psychiatry-1000x1000.png", "Психиатрия", "Помощь при тревоге, депрессивных состояниях, панических атаках и кризисах.", "01", 0),
        build_service("vk-service-psychology-1000x1000.png", "Психология", "Поддержка при стрессе, выгорании, семейных и личных трудностях.", "02", 1),
        build_service("vk-service-addiction-1000x1000.png", "Наркология", "Консультации, помощь при зависимостях и поддержка родственников.", "03", 2),
    ]
    manifest = {
        "version": "2026-07-18",
        "brand": "Azimut Clinic",
        "colorProfile": "sRGB",
        "methodology": {
            "coverDesktop": "1590x530, keep critical content inside the central safe area and below the top 85 px",
            "coverLive": "1080x1920, keep critical content at least 200 px from top and bottom",
            "avatar": "400x400, verify readability as a 200x200 thumbnail",
            "menu": "376x256, keep labels centered because mobile may crop side edges",
            "post": "1080x1350 vertical feed creative",
            "service": "1000x1000 square service card"
        },
        "files": [path.name for path in outputs]
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
