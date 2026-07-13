# Agent handoff log — Азимут Клиник

Журнал изменений для Grok / Codex / других агентов. Дополняйте сверху (новые записи первыми).

---

## 2026-07-13 — Мобильное меню, баннеры, обложки статей, часы тестов, Яндекс.Карта

**Автор:** Grok

### Мобильное меню (`js/main.js`, `css/responsive.css`, cache `?v=20260713-polish`)
- Портал `.main-nav` + `.header-actions` в `body` при открытии (обход Safari `backdrop-filter` containing block).
- Затемнение `.nav-backdrop`, список без «карточек», кнопка «Записаться» закреплена внизу overlay.
- `window.AzimutNav.close()` для Escape и клика по ссылкам.

### Главная — баннеры (`index.html`, `assets/banners/`)
- Три фотореалистичных баннера 4:3: `consultation-warm.jpg`, `home-visit-care.jpg`, `online-session-calm.jpg`.
- Новые тексты: круглосуточная поддержка, выездная помощь, онлайн-консультации.

### Статьи — обложки (`assets/blog/*-hero.jpg`)
- Заменены 40 placeholder-градиентов (batch20 + batch21) на фотореалистичные hero 16:9.
- Индексы `data/articles-batch20-index.js`, `data/articles-batch21-index.js` без изменений путей.

### Тесты — песочные часы (`js/tests.js`, `css/style.css`)
- Новый SVG с градиентным стеклом и песком; `--test-progress` синхронизируется с таймером (верх опустошается, низ наполняется).

### Контакты — карта (`contacts.html`)
- Вместо `.map-placeholder` — iframe Яндекс.Карт (55.660607, 37.538170, Старокалужское ш., 62).

### Publish
```bash
/usr/bin/python3 /Users/polzovatel/azimut-medline-site/scripts/push-site-polish.py
```

---

## 2026-07-13 — Мобильные правки, PIN на всех страницах, компас, деплой

**Автор:** Grok

### Мобильная вёрстка (`css/responsive.css`, cache `?v=20260713-mobile-fix`)
- Компактная шапка на `max-width: 1180px` / `560px`: меньше логотип, скрыт `.brand-text`, `padding-top` 64px → 56px.
- Меню: overlay `position: fixed` под шапкой + закреплённые `header-actions` внизу (без «вылета» шапки).
- «Наши специалисты»: `background-size: cover` для `.specialists-section .doctor-photo` (без растягивания).
- Подвал на мобиле: сброшен `translateX(-35%)` у `.footer-brand-stack` — логотип и текст по центру.
- Кнопка «Наверх» `.scroll-top-btn` на всех страницах (`js/main.js`, только mobile ≤860px).

### Контент и контакты
- Email везде: `info@azimutclinic.ru` (было `info@azimutmedline.ru`).
- `contacts.html`: реквизиты Сбербанк как в подвале (убран Экспобанк).

### Компас (`js/main.js`)
- **Мобилка (≤860px):** геолокация + `deviceorientation` → стрелка на клинику (55.660607, 37.538170).
- **Десктоп (>860px):** только следование за курсором мыши, без геолокации.

### AI-помощник
- Иконка toggle: `assets/icons/iconly/doctor.svg` в стиле site iconly (`css/chatbot.css`, `js/chatbot.js`).

### PIN-gate (все 14 HTML-страниц)
- Добавлены `css/access-gate.css`, `js/access-gate.js`.
- Сессия **20 минут** (`SESSION_MS = 20 * 60 * 1000`), повторный ввод по истечении.
- Скрипт массового обновления: `scripts/apply-mobile-site-fixes.py`.

### Статьи
- `scripts/audit-article-images.py` — проверка/генерация локальных hero JPG при отсутствии.
- На момент правки все индексированные обложки уже были на диске (0 новых).

### Publish
```bash
/usr/bin/python3 /Users/polzovatel/azimut-medline-site/scripts/github_push.py
```

### Файлы
`css/responsive.css`, `css/style.css`, `css/chatbot.css`, `css/access-gate.css`, `js/main.js`, `js/chatbot.js`, `js/access-gate.js`, `contacts.html`, все `*.html`, `scripts/apply-mobile-site-fixes.py`, `scripts/audit-article-images.py`, `docs/agent-handoff-log.md`.

---

## 2026-07-13 — Лайфхаки, обложки JPG, связка статей с тестами, Филипп Филипович

**Автор:** Grok

### Блог
- 20 новых статей (`data/articles-batch21-index.js`, `articles-batch21-content.js`): лайфхаки, токсичные отношения, «выбрать себя», тренды 2026.
- JPG-обложки 1280×720 для batch20 (были `.svg`) и batch21 — `assets/blog/*-hero.jpg`.
- `data/article-test-links.js` — маппинг slug → тест (57 статей).
- `js/blog.js`: блок `test-cta` + авто-CTA из `AZIMUT_ARTICLE_TEST_LINKS` перед FAQ.
- `css/style.css`: `.article-test-cta`.
- `js/tests.js`: `tests.html?open=testId` открывает модал теста.

### AI-чат
- Везде в UI снова **Филипп Филипович** (toggle, aria, warning), не «AI-помощник».
- `js/chat-config.js`: `agentTitle: "Филипп Филипович"`.

### Генератор
```bash
/usr/bin/python3 scripts/generate-lifehacks-and-images.py
```
Требует Pillow для `/usr/bin/python3`.

### Publish
```bash
/usr/bin/python3 scripts/github_push.py
```

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