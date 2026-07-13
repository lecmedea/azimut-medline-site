#!/usr/bin/env python3
"""Bulk HTML updates: access gate on all pages, email, cache bust."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GATE_CSS = '  <link rel="stylesheet" href="css/access-gate.css?v=20260713-mobile-fix">\n'
GATE_JS = '  <script src="js/access-gate.js?v=20260713-mobile-fix"></script>\n'
CACHE = "20260713-mobile-fix"

for path in sorted(ROOT.glob("*.html")):
    text = path.read_text(encoding="utf-8")
    orig = text

    text = text.replace("info@azimutmedline.ru", "info@azimutclinic.ru")

    if "access-gate.css" not in text:
        marker = '  <link rel="stylesheet" href="css/style.css'
        if marker in text:
            text = text.replace(marker, GATE_CSS + marker, 1)
        elif '  <meta charset="UTF-8">' in text:
            text = text.replace('  <meta charset="UTF-8">\n', '  <meta charset="UTF-8">\n' + GATE_CSS, 1)

    if "access-gate.js" not in text:
        if "</head>" in text:
            text = text.replace("</head>", GATE_JS + "</head>", 1)

    text = text.replace("access-gate.css?v=20260712-services-philipp", f"access-gate.css?v={CACHE}")
    text = text.replace("access-gate.js?v=20260712-services-philipp", f"access-gate.js?v={CACHE}")
    text = text.replace("main.js?v=20260712-services-philipp", f"main.js?v={CACHE}")
    text = text.replace("main.js?v=20260710-montserrat", f"main.js?v={CACHE}")
    text = text.replace("chatbot.css?v=20260710-montserrat", f"chatbot.css?v={CACHE}")
    text = text.replace("chatbot.js?v=20260713-philipp", f"chatbot.js?v={CACHE}")
    text = text.replace("chat-config.js?v=20260713-philipp", f"chat-config.js?v={CACHE}")
    text = text.replace("style.css?v=20260710-montserrat", f"style.css?v={CACHE}")
    text = text.replace('href="css/responsive.css"', f'href="css/responsive.css?v={CACHE}"')

    if path.name == "contacts.html":
        old_bank = (
            "<p><strong>Расчётный счёт:</strong> 40702810201680168929<br>"
            "<strong>Банк:</strong> АО «Экспобанк»<br>"
            "<strong>БИК:</strong> 044525460<br>"
            "<strong>Корр. счёт:</strong> 30101810345250000460</p>"
        )
        new_bank = (
            "<p><strong>Расчётный счёт:</strong> 40702810038720049190<br>"
            "<strong>Банк:</strong> ПАО Сбербанк<br>"
            "<strong>БИК:</strong> 044525225<br>"
            "<strong>Корр. счёт:</strong> 30101810400000000225</p>"
        )
        text = text.replace(old_bank, new_bank)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print(f"updated {path.name}")