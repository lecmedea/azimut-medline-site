#!/usr/bin/env python3
"""Regenerate sitemap/robots and inject CIS-friendly SEO meta into all HTML pages."""
from __future__ import annotations

import pathlib
import re
import textwrap
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://azimutclinic.ru"
LASTMOD = "2026-07-13"
CACHE = "20260713-philipp-icon"

ROBOTS = textwrap.dedent(f"""\
    User-agent: *
    Allow: /
    Disallow: /deliverables/

    User-agent: Yandex
    Allow: /
    Disallow: /deliverables/
    Crawl-delay: 1

    User-agent: Googlebot
    Allow: /

    User-agent: Bingbot
    Allow: /

    Host: azimutclinic.ru
    Sitemap: {BASE}/sitemap.xml
""")

SEO_BLOCK = """\
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow">
  <meta name="yandex" content="index, follow">
  <meta name="geo.region" content="RU-MOW">
  <meta name="geo.placename" content="Москва">
  <meta name="geo.position" content="55.660607;37.538170">
  <meta name="ICBM" content="55.660607, 37.538170">
  <meta name="language" content="Russian">
  <meta name="content-language" content="ru">
  <link rel="alternate" hreflang="ru" href="{canonical}">
  <link rel="alternate" hreflang="ru-RU" href="{canonical}">
  <link rel="alternate" hreflang="x-default" href="{canonical}">
"""

PAGES = [
    ("index.html", "", "weekly", "1.0"),
    ("about.html", "about.html", "monthly", "0.8"),
    ("services.html", "services.html", "monthly", "0.9"),
    ("doctors.html", "doctors.html", "monthly", "0.8"),
    ("prices.html", "prices.html", "monthly", "0.8"),
    ("contacts.html", "contacts.html", "monthly", "0.9"),
    ("blog.html", "blog.html", "weekly", "0.85"),
    ("tests.html", "tests.html", "weekly", "0.8"),
    ("partnership.html", "partnership.html", "monthly", "0.6"),
    ("payment.html", "payment.html", "monthly", "0.6"),
    ("privacy.html", "privacy.html", "yearly", "0.3"),
    ("terms.html", "terms.html", "yearly", "0.3"),
    ("personal-data.html", "personal-data.html", "yearly", "0.3"),
    ("article.html", "article.html", "weekly", "0.75"),
]


def collect_article_slugs() -> list[str]:
    slugs: list[str] = []
    for rel in (
        "data/articles-index.js",
        "data/articles-batch30-index.js",
        "data/articles-batch20-index.js",
        "data/articles-batch21-index.js",
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


def write_sitemap() -> None:
    urls: list[str] = []
    for _file, path, freq, pri in PAGES:
        if path:
            loc = f"{BASE}/{path}"
        else:
            loc = f"{BASE}/"
        urls.append(
            f"  <url><loc>{loc}</loc><lastmod>{LASTMOD}</lastmod>"
            f"<changefreq>{freq}</changefreq><priority>{pri}</priority></url>"
        )
    for slug in collect_article_slugs():
        loc = f"{BASE}/article.html?slug={urllib.parse.quote(slug)}"
        urls.append(
            f"  <url><loc>{loc}</loc><lastmod>{LASTMOD}</lastmod>"
            f"<changefreq>monthly</changefreq><priority>0.7</priority></url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    (ROOT / "robots.txt").write_text(ROBOTS, encoding="utf-8")
    print(f"sitemap.xml: {len(urls)} URLs, robots.txt updated")


def page_canonical(filename: str) -> str:
    if filename == "index.html":
        return f"{BASE}/"
    return f"{BASE}/{filename}"


def strip_old_seo(text: str) -> str:
    patterns = [
        r'\s*<meta name="robots"[^>]*>\n',
        r'\s*<meta name="googlebot"[^>]*>\n',
        r'\s*<meta name="yandex"[^>]*>\n',
        r'\s*<meta name="geo\.region"[^>]*>\n',
        r'\s*<meta name="geo\.placename"[^>]*>\n',
        r'\s*<meta name="geo\.position"[^>]*>\n',
        r'\s*<meta name="ICBM"[^>]*>\n',
        r'\s*<meta name="language"[^>]*>\n',
        r'\s*<meta name="content-language"[^>]*>\n',
        r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>\n',
    ]
    for pattern in patterns:
        text = re.sub(pattern, "", text)
    return text


def inject_seo_into_html(path: pathlib.Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = strip_old_seo(text)
    canonical = page_canonical(path.name)

    if 'rel="canonical"' not in text:
        text = text.replace(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            f'  <link rel="canonical" href="{canonical}">',
            1,
        )

    block = SEO_BLOCK.format(canonical=canonical)
    marker = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    if marker in text and 'name="robots"' not in text:
        text = text.replace(marker, marker + "\n" + block, 1)

    text = text.replace("chatbot.css?v=20260713-mobile-fix", f"chatbot.css?v={CACHE}")
    text = text.replace("chatbot.css?v=20260712-services-philipp", f"chatbot.css?v={CACHE}")
    text = text.replace("chatbot.js?v=20260713-philipp-ai", f"chatbot.js?v={CACHE}")
    text = text.replace("chat-config.js?v=20260713-philipp-ai", f"chat-config.js?v={CACHE}")

    path.write_text(text, encoding="utf-8")


def ping_search_engines() -> None:
    sitemap = urllib.parse.quote(f"{BASE}/sitemap.xml", safe="")
    endpoints = [
        ("Google", f"https://www.google.com/ping?sitemap={sitemap}"),
        ("Bing", f"https://www.bing.com/ping?sitemap={sitemap}"),
        ("Yandex", f"https://webmaster.yandex.ru/ping?sitemap={sitemap}"),
    ]
    for name, url in endpoints:
        try:
            with urllib.request.urlopen(url, timeout=20) as resp:
                print(f"Ping {name}: HTTP {resp.status}")
        except Exception as exc:
            print(f"Ping {name}: {exc}")


def main() -> None:
    write_sitemap()
    for html in sorted(ROOT.glob("*.html")):
        inject_seo_into_html(html)
        print(f"SEO meta: {html.name}")
    ping_search_engines()


if __name__ == "__main__":
    main()