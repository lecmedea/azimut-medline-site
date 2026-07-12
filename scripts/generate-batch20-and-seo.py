#!/usr/bin/env python3
"""Generate 20 new blog articles + heroes, sitemap, robots."""
from __future__ import annotations

import json
import pathlib
import textwrap

ROOT = pathlib.Path(__file__).resolve().parent.parent
BLOG = ROOT / "assets" / "blog"
DATA = ROOT / "data"

PALETTES = {
    "Психиатрия": {"a": "#f4efe6", "b": "#d9c4a8", "c": "#9A4C39", "d": "#6e4a3a", "accent": "#AE8B66"},
    "Психология": {"a": "#f7efe1", "b": "#ead8bd", "c": "#AE8B66", "d": "#9A4C39", "accent": "#c6a27a"},
    "Тревога": {"a": "#faf5ec", "b": "#e5dcc8", "c": "#7c8fa3", "d": "#5a6d7a", "accent": "#b99059"},
    "Подростки": {"a": "#f6f0e8", "b": "#e8d9c4", "c": "#8B3920", "d": "#6b5344", "accent": "#c9a87c"},
    "Наркология": {"a": "#f6efe6", "b": "#e5d4c0", "c": "#8B3920", "d": "#6b4a3a", "accent": "#AE8B66"},
}

NEW_ARTICLES = [
    ("social-anxiety-work", "Социальная тревога на работе: как не избегать важных разговоров", "Тревога", "2026-07-11", "Краснение, паузы, страх оценки — знакомые сигналы. Разбираем мягкие шаги к уверенности в коллективе.", "7 минут", "коллектив"),
    ("insomnia-routine", "Бессонница: вечерний ритуал, который реально помогает засыпать", "Психология", "2026-07-11", "Сон — не враг продуктивности. Простые правила гигиены сна без фанатизма.", "6 минут", "сон"),
    ("ocd-intrusive-thoughts", "ОКР и навязчивые мысли: почему «просто не думай об этом» не работает", "Психиатрия", "2026-07-10", "Навязчивости пугают, но поддаются терапии. Что такое ритуалы и как с ними работают.", "8 минут", "ритуал"),
    ("bipolar-mood-swings", "Биполярное расстройство: как отличить «качели» от обычных перепадов", "Психиатрия", "2026-07-10", "Эйфория и провалы — не каприз. Когда стоит обсудить состояние с врачом.", "7 минут", "баланс"),
    ("adhd-adults-signs", "СДВГ у взрослых: забывчивость, прокрастинация и внутренний хаос", "Психиатрия", "2026-07-09", "СДВГ не только у детей. Какие признаки замечают взрослые и как проходит диагностика.", "7 минут", "фокус"),
    ("ptsd-after-accident", "ПТСР после ДТП или травмы: когда воспоминания не отпускают", "Психиатрия", "2026-07-09", "Вспышки, избегание, напряжение — нормальная реакция, которую можно переработать.", "8 минут", "путь"),
    ("eating-disorder-help", "Расстройства пищевого поведения: стыд, контроль и первый шаг к помощи", "Психиатрия", "2026-07-08", "Ограничения и переедание — не «слабость воли». Бережный маршрут обращения.", "7 минут", "забота"),
    ("panic-at-night", "Ночные панические атаки: что делать, когда страшно засыпать", "Тревога", "2026-07-08", "Ночной страх усиливает бессонницу. Техники заземления и когда звонить 103.", "6 минут", "ночь"),
    ("teen-self-harm-talk", "Подросток и самоповреждение: как говорить без паники и обвинений", "Подростки", "2026-07-07", "Родителям важно сохранить контакт. Алгоритм разговора и срочные сигналы.", "8 минут", "диалог"),
    ("parent-teen-conflict", "Конфликты с подростком: границы без войны", "Подростки", "2026-07-07", "Ссоры — часть взросления. Как снижать накал и оставаться опорой.", "7 минут", "семья"),
    ("alcohol-weekend", "Алкоголь «только по выходным»: когда привычка становится риском", "Наркология", "2026-07-06", "Редкое употребление тоже может маскировать зависимость. На что смотреть.", "6 минут", "выбор"),
    ("cannabis-dependence", "Зависимость от каннабиса: миф о «лёгком» веществе", "Наркология", "2026-07-06", "Снижение мотивации, тревога при отмене — реальные последствия.", "7 минут", "ясность"),
    ("family-alanon", "Близкому человеку с зависимостью: как помогать и не сгореть", "Наркология", "2026-07-05", "Созависимость, границы, группы поддержки — практический гид.", "8 минут", "опора"),
    ("psychiatrist-first-visit", "Первый визит к психиатру: чего ожидать и как подготовиться", "Психиатрия", "2026-07-05", "Анамнез, диагностика, план — без страха «навяжут таблетки».", "6 минут", "визит"),
    ("therapy-vs-meds", "Терапия или медикаменты: как выбирают комбинированную помощь", "Психиатрия", "2026-07-04", "Не «или-или». Когда нужны оба подхода и кто принимает решение.", "7 минут", "план"),
    ("boundaries-relationships", "Личные границы в отношениях: как говорить «нет» без вины", "Психология", "2026-07-04", "Границы — не эгоизм, а условие близости. Примеры фраз и шаги.", "6 минут", "границы"),
    ("caregiver-burnout", "Выгорание опекуна: когда забота о близком истощает", "Психология", "2026-07-03", "Чувство вины, усталость, раздражение — сигналы запросить поддержку.", "7 минут", "опека"),
    ("seasonal-depression", "Сезонная депрессия: почему осенью и зимой тяжелее", "Психиатрия", "2026-07-03", "Свет, режим, активность и когда подключать специалиста.", "6 минут", "свет"),
    ("work-stress-deadline", "Стресс перед дедлайном: как не сорваться на близких", "Психология", "2026-07-02", "Срочность ≠ паника. Дыхание, приоритеты, микропаузы.", "5 минут", "дедлайн"),
    ("online-consult-privacy", "Онлайн-консультация: конфиденциальность и техника связи", "Психология", "2026-07-02", "Как подготовить пространство, связь и что спросить у администратора.", "5 минут", "онлайн"),
]


def svg_hero(slug: str, category: str, label: str) -> str:
    p = PALETTES.get(category, PALETTES["Психология"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="{label}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="{p['a']}"/><stop offset="100%" stop-color="{p['b']}"/></linearGradient></defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <circle cx="620" cy="110" r="72" fill="{p['accent']}" opacity="0.45"/>
  <ellipse cx="200" cy="320" rx="140" ry="90" fill="{p['c']}" opacity="0.22"/>
  <text x="48" y="380" font-family="Montserrat, Arial, sans-serif" font-size="28" fill="{p['d']}" opacity="0.85">{label}</text>
</svg>'''


def write_articles() -> None:
    index = []
    content: dict = {}
    for slug, title, category, date, excerpt, read_time, label in NEW_ARTICLES:
        hero = f"assets/blog/{slug}-hero.svg"
        index.append({
            "slug": slug,
            "title": title,
            "category": category,
            "date": date,
            "excerpt": excerpt,
            "readTime": read_time,
            "image": hero,
            "imagePosition": "center",
        })
        content[slug] = {
            "blocks": [
                {"type": "paragraph", "text": excerpt},
                {"type": "heading", "text": "Когда стоит обратиться"},
                {"type": "list", "items": [
                    "Симптомы длятся неделями и мешают работе, учёбе или сну",
                    "Появились мысли о самоповреждении — нужна срочная помощь (112, 103)",
                    "Близкие замечают резкие изменения в поведении",
                ]},
                {"type": "paragraph", "text": "На консультации в Азимут Клиник специалист уточняет контекст, длительность симптомов и подбирает формат помощи: в клинике, на дому или онлайн. Анонимность и круглосуточная линия — 8 (925) 112 77 99."},
                {"type": "callout", "text": "Онлайн-материал не заменяет очный осмотр и не ставит диагноз."},
            ],
            "faq": [
                ["Можно ли анонимно?", "Да, конфиденциальность обращения соблюдается."],
                ["Как записаться?", "Через форму на сайте или по телефону круглосуточно."],
            ],
        }
        BLOG.mkdir(parents=True, exist_ok=True)
        (BLOG / f"{slug}-hero.svg").write_text(svg_hero(slug, category, label), encoding="utf-8")

    index_js = "(function () {\n  var batch = " + json.dumps(index, ensure_ascii=False, indent=2) + ";\n"
    index_js += "  window.AZIMUT_ARTICLES_INDEX = (window.AZIMUT_ARTICLES_INDEX || []).concat(batch);\n})();\n"
    (DATA / "articles-batch20-index.js").write_text(index_js, encoding="utf-8")

    content_js = "window.AZIMUT_ARTICLES_CONTENT = Object.assign(window.AZIMUT_ARTICLES_CONTENT || {}, " + json.dumps(content, ensure_ascii=False, indent=2) + ");\n"
    (DATA / "articles-batch20-content.js").write_text(content_js, encoding="utf-8")
    print(f"Wrote 20 articles + heroes")


def collect_article_slugs() -> list[str]:
    import re

    slugs: list[str] = []
    for rel in (
        "data/articles-index.js",
        "data/articles-batch30-index.js",
        "data/articles-batch20-index.js",
        "data/articles.js",
    ):
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        slugs.extend(re.findall(r'["\']?slug["\']?\s*:\s*"([^"]+)"', text))
    seen: set[str] = set()
    unique: list[str] = []
    for slug in slugs:
        if slug not in seen:
            seen.add(slug)
            unique.append(slug)
    return unique


def write_seo() -> None:
    pages = [
        ("", "weekly", "1.0"),
        ("about.html", "monthly", "0.8"),
        ("services.html", "monthly", "0.9"),
        ("doctors.html", "monthly", "0.8"),
        ("prices.html", "monthly", "0.8"),
        ("contacts.html", "monthly", "0.9"),
        ("blog.html", "weekly", "0.85"),
        ("tests.html", "weekly", "0.8"),
        ("partnership.html", "monthly", "0.6"),
        ("payment.html", "monthly", "0.6"),
        ("privacy.html", "yearly", "0.3"),
        ("terms.html", "yearly", "0.3"),
        ("personal-data.html", "yearly", "0.3"),
    ]
    base = "https://azimutclinic.ru"
    urls = []
    for path, freq, pri in pages:
        loc = base + ("/" + path if path else "/")
        urls.append(f"  <url><loc>{loc}</loc><changefreq>{freq}</changefreq><priority>{pri}</priority></url>")
    for slug in collect_article_slugs():
        urls.append(f"  <url><loc>{base}/article.html?slug={slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>")
    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + "\n".join(urls) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    robots = textwrap.dedent("""\
        User-agent: *
        Allow: /
        Disallow: /deliverables/
        Sitemap: https://azimutclinic.ru/sitemap.xml
    """)
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")
    print("Wrote sitemap.xml + robots.txt")


if __name__ == "__main__":
    write_articles()
    write_seo()