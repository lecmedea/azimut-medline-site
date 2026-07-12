#!/usr/bin/env python3
"""Генерация SVG-обложек статей блога в стиле Азимут Клиник."""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "blog"

PALETTES = {
    "Психология": {"a": "#f7efe1", "b": "#ead8bd", "c": "#AE8B66", "d": "#9A4C39", "accent": "#c6a27a"},
    "Психотерапия": {"a": "#faf5ec", "b": "#e8dcc8", "c": "#a98652", "d": "#7c6a55", "accent": "#b99059"},
    "Зависимость": {"a": "#f6efe6", "b": "#e5d4c0", "c": "#8B3920", "d": "#6b4a3a", "accent": "#AE8B66"},
}

SHAPES = {
    "circle": '<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{o}"/>',
    "ellipse": '<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{o}"/>',
    "rect": '<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{c}" opacity="{o}"/>',
}

ARTICLES = [
    ("low-self-esteem", "Психология", "самооценка"),
    ("emotional-intelligence", "Психология", "эмоции"),
    ("procrastination-anxiety", "Психология", "время"),
    ("anger-management", "Психология", "баланс"),
    ("loneliness-modern", "Психология", "связь"),
    ("perfectionism-trap", "Психология", "порядок"),
    ("grief-and-loss", "Психология", "память"),
    ("mindfulness-basics", "Психология", "дыхание"),
    ("childhood-trauma-signs", "Психология", "путь"),
    ("self-compassion", "Психология", "забота"),
    ("gestalt-therapy", "Психотерапия", "контакт"),
    ("emdr-therapy", "Психотерапия", "исцеление"),
    ("dbt-skills", "Психотерапия", "навыки"),
    ("psychodynamic-therapy", "Психотерапия", "глубина"),
    ("art-therapy", "Психотерапия", "творчество"),
    ("family-therapy", "Психотерапия", "семья"),
    ("online-therapy-guide", "Психотерапия", "онлайн"),
    ("therapy-duration", "Психотерапия", "путь"),
    ("group-therapy", "Психотерапия", "группа"),
    ("schema-therapy", "Психотерапия", "схема"),
    ("alcohol-dependency-signs", "Зависимость", "выбор"),
    ("codependency", "Зависимость", "границы"),
    ("relapse-prevention", "Зависимость", "опора"),
    ("drug-addiction-help", "Зависимость", "помощь"),
    ("behavioral-addiction", "Зависимость", "ритм"),
    ("motivation-for-treatment", "Зависимость", "шаг"),
    ("family-and-addiction", "Зависимость", "диалог"),
    ("detox-basics", "Зависимость", "очищение"),
    ("sober-life", "Зависимость", "рассвет"),
    ("dual-diagnosis", "Зависимость", "связь"),
]


def svg_for(slug, category, label):
    p = PALETTES[category]
    shapes = []
    if category == "Психология":
        shapes = [
            SHAPES["ellipse"].format(x=140, y=100, rx=90, ry=70, c=p["c"], o=0.35),
            SHAPES["circle"].format(x=320, y=85, r=55, c=p["accent"], o=0.45),
            SHAPES["circle"].format(x=260, y=150, r=35, c=p["d"], o=0.25),
            SHAPES["rect"].format(x=60, y=140, w=120, h=50, c=p["b"], o=0.6),
        ]
    elif category == "Психотерапия":
        shapes = [
            SHAPES["circle"].format(x=120, y=120, r=48, c=p["c"], o=0.4),
            SHAPES["circle"].format(x=300, y=120, r=48, c=p["accent"], o=0.4),
            SHAPES["rect"].format(x=168, y=95, w=84, h=50, c=p["b"], o=0.55),
            SHAPES["ellipse"].format(x=210, y=165, rx=100, ry=28, c=p["d"], o=0.2),
        ]
    else:
        shapes = [
            SHAPES["ellipse"].format(x=210, y=130, rx=110, ry=55, c=p["c"], o=0.3),
            SHAPES["circle"].format(x=100, y=100, r=40, c=p["accent"], o=0.45),
            SHAPES["circle"].format(x=330, y=110, r=32, c=p["d"], o=0.35),
            SHAPES["rect"].format(x=155, y=70, w=110, h=36, c=p["b"], o=0.5),
        ]

    shape_xml = "\n    ".join(shapes)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" role="img" aria-label="{label}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{p['a']}"/>
      <stop offset="55%" stop-color="{p['b']}"/>
      <stop offset="100%" stop-color="{p['c']}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="420" height="200" fill="url(#bg)"/>
  <path d="M0 160 Q120 120 210 150 T420 130 V200 H0Z" fill="{p['d']}" opacity="0.12"/>
    {shape_xml}
  <text x="24" y="36" font-family="Montserrat, Arial, sans-serif" font-size="11" font-weight="400" fill="{p['d']}" opacity="0.85">{category}</text>
  <text x="24" y="178" font-family="Montserrat, Arial, sans-serif" font-size="13" font-weight="400" fill="{p['d']}" opacity="0.7">{label}</text>
</svg>'''


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, category, label in ARTICLES:
        path = OUT / f"{slug}-hero.svg"
        path.write_text(svg_for(slug, category, label), encoding="utf-8")
        print(path.name)
    print(f"Создано {len(ARTICLES)} SVG в {OUT}")


if __name__ == "__main__":
    main()