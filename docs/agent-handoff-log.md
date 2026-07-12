# Agent handoff log — Азимут Клиник

Журнал изменений для Grok / Codex / других агентов. Дополняйте сверху (новые записи первыми).

---

## 2026-07-12 — Прямое подключение OpenAI для Филиппа

- `api/chat.js` переведён на прямой OpenAI Responses API для GPT-5-моделей.
- Дефолтная модель OpenAI: `gpt-5.6-luna`.
- Production env в Vercel: `AI_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.openai.com/v1`, `OPENAI_API_MODE=responses`, `OPENAI_MODEL=gpt-5.6-luna`, `OPENAI_API_KEY` только в Vercel.
- Artemox больше не нужен для Филиппа: Vercel получал от него `403 Just a moment...` Cloudflare и чат уходил в fallback.
- Официальный OpenAI-ключ проверен напрямую, но OpenAI вернул `429 insufficient_quota`; после пополнения/активации квоты этот код начнёт отдавать живые ответы без дополнительных правок.

---

## 2026-07-12 — Единая серия iconly для иконок тестов

- Убраны PNG `site-symbols` из пула тестов — смешивали толстые/тонкие линии.
- Добавлены 8 SVG в стиле iconly (`family`, `dialog`, `doctor`, `compass`, `calendar`, `online`, `protection`, `home-care`): stroke `#765f42`, width `1.5`.
- Все 17 иконок тестов теперь только `assets/icons/iconly/*.svg`.

---

## 2026-07-12 — Уникальные иконки тестов (max 3 повтора)

- `js/tests.js`: `buildTestIconMap()` — 17 иконок (iconly + site-symbols), подбор по ключевым словам теста, лимит **3 повтора** на иконку.
- Cache-bust: `tests.js?v=20260712-test-icons`.

---

## 2026-07-12 — Gold palette, Philipp, tests timer, perf

**Автор:** Grok (сессия azimut-medline-site)

### UI / CSS
- Голубые оттенки (`#314a59`, `#eef7f5`, teal-rgba) заменены на золотистые по `css/style.css`, `animations.css`, `chatbot.css`.
- Hero внутренних страниц (`page-hero`, `tests-hero`, `blog-hero`): тёплый фон как на about/services (`onyx-warm-bg` / `blog-hero-bg-wide`), убран `clarity-section` с tests.html.
- Шапка: восстановлена сетка с `.header-utility` (скрипт `scripts/sync-header-utility.py`), добавлен рассыпанный песок `assets/generated/header-sand-scatter.svg` (≤20% шапки, `z-index: 0`, текст `z-index: 2+`).
- `letter-spacing: -0.01em` на `body`.
- Фильтры тестов: панели свёрнуты при загрузке (`[hidden]` + `is-open` + CSS-анимация).

### Тесты (`js/tests.js`)
- Иконки **строго по категории** (topic → один из `assets/icons/iconly/*.svg`), жемчужная рамка как у `.condition-icon`.
- Модал: экран «Начать тест» → таймер + CSS-песочные часы → форма.
- Время = `getTestMinutes(test) * 60` сек (мин. 120 с).

### AI — Филипп Филипович
- `js/chat-config.js` — endpoint для n8n webhook (обязательно на GitHub Pages).
- `js/chatbot.js` — имя Филипп, ответы из `answer|output|text|message`.
- `api/chat.js` — fallback `OPENAI_API_KEY` (gpt-4o-mini) или `DEEPSEEK_API_KEY` для `vercel dev` / локального прокси.

**Чтобы Филипп заработал на azimutclinic.ru:**
1. Быстрый путь: n8n webhook → OpenAI → ответ `{ "answer": "..." }` → URL в `js/chat-config.js` → `endpoint`.
2. Локально: `OPENAI_API_KEY=... vercel dev` и пустой `endpoint` (localhost использует `/api/chat`).
3. Не использовать Artemox + Vercel serverless для этого сайта (режет запросы).

### Perf
- `defer` на `tests-batch200.js`, `tests.js`.
- `background-attachment: scroll` у `.conditions-section` (убран `fixed`).
- Cache-bust: `?v=20260712-gold-philipp`.

### Skills / токены (рекомендация)
- Для этого репо держать **один** project skill: `.grok/skills/azimut-site/SKILL.md`.
- Perf — только `.grok/skills/performance-optimizer/SKILL.md` при задачах скорости.
- Не грузить все 40+ skills в каждый чат: в `~/.grok/config.toml` оставить узкий `paths`.
- Искать новые skills: `find-skills` (superagent), на GitHub — `vercel-labs/agent-skills`, `anthropics/skills` (выборочно, 1 skill = 1 задача).

### Publish
```bash
/usr/bin/python3 /Users/polzovatel/azimut-medline-site/scripts/github_push.py
```

### Файлы затронуты
`css/style.css`, `css/animations.css`, `css/chatbot.css`, `css/responsive.css`, `tests.html`, `js/tests.js`, `js/chatbot.js`, `js/chat-config.js`, `api/chat.js`, `assets/generated/header-sand-scatter.svg`, `scripts/sync-header-utility.py`, `*.html` (header-utility).

---

## Ранее (кратко)
- Сетка тестов 6 колонок, 63 статьи блога, sitemap.xml, SEO meta, `github_push.py` auto-collect.
