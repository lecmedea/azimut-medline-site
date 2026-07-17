# 50 GitHub skills/plugin-кандидатов для Codex и сайта Азимут

Дата: 2026-07-17.

Важно: каталог `openai/skills` на GitHub сейчас помечен как устаревший и рекомендует смотреть `openai/plugins`. При этом skills по-прежнему являются рабочей концепцией Codex: skill может быть отдельной папкой `SKILL.md` или частью plugin-пакета. Поэтому ниже я разделяю кандидаты на:

- надежные/официальные источники;
- уже установленные локально;
- кандидаты, которые нужно проверить перед установкой.

Источники:

- https://github.com/openai/plugins
- https://github.com/openai/skills
- https://github.com/vercel-labs/skills
- https://github.com/vercel-labs/agent-skills
- https://agent-skills.md/skills/mosif16/codex-Skills/product-frontend-design
- https://github.com/vadimcomanescu/codex-skills

## Уже установлено из твоего GitHub

Из `lecmedea/azimut-medline-site/.grok/skills` добавлены:

1. `frontend-ux-engineer`
2. `performance-optimizer`

Также в этом репозитории найден `frontend-design`, но он уже есть локально, поэтому повторно не устанавливался. После установки новых skills Codex желательно перезапустить, чтобы они появились в списке доступных навыков.

## 50 кандидатов

| # | Skill/plugin | GitHub источник | Для чего на сайте/в OSMed |
|---:|---|---|---|
| 1 | `build-web-apps` | `openai/plugins/plugins/build-web-apps` | Web-продукты, UI, деплой, базы, платежи |
| 2 | `figma` | `openai/plugins/plugins/figma` | Figma -> код, дизайн-системы, Code Connect |
| 3 | `netlify` | `openai/plugins/plugins/netlify` | Альтернативный деплой статических сайтов |
| 4 | `remotion` | `openai/plugins/plugins/remotion` | Видео/анимации для маркетинга |
| 5 | `expo` | `openai/plugins/plugins/expo` | Мобильное приложение пациента |
| 6 | `google-slides` | `openai/plugins/plugins/google-slides` | Презентации для партнеров/клиники |
| 7 | `notion` | `openai/plugins/plugins/notion` | Планирование, база знаний, контент |
| 8 | `openai-docs` | `openai/skills/skills/.curated/openai-docs` | Актуальная работа с OpenAI/Codex API |
| 9 | `skill-creator` | `openai/skills/skills/.curated/skill-creator` | Создание собственных skills |
| 10 | `cli-creator` | `openai/skills/skills/.curated/cli-creator` | Создание CLI-утилит для сайта/OSMed |
| 11 | `gh-fix-ci` | `openai/skills` / GitHub skill family | Починка CI и PR-checks |
| 12 | `gh-address-comments` | `openai/skills` / GitHub skill family | Обработка review-комментариев |
| 13 | `template-creator` | `openai/skills` / bundled skill family | Переиспользуемые шаблоны артефактов |
| 14 | `frontend-design` | `vercel-labs/agent-skills` | Дизайн UI без generic AI-вида |
| 15 | `web-design-guidelines` | `vercel-labs/agent-skills` | Проверка веб-интерфейса по гайдам |
| 16 | `vercel-deploy` | `vercel-labs/agent-skills` | Деплой и preview URL |
| 17 | `vercel-optimize` | `vercel-labs/agent-skills` | Стоимость, perf, ISR/cache, Vercel метрики |
| 18 | `vercel-react-best-practices` | `vercel-labs/agent-skills` | React/Next performance и архитектура |
| 19 | `nextjs-react-typescript` | `vercel-labs/agent-skills` | Next.js/TS практики |
| 20 | `playwright` | `vercel-labs/agent-skills` | Реальные браузерные smoke/e2e тесты |
| 21 | `deploy-to-vercel` | `vercel-labs/agent-skills` | Быстрый production/preview deploy |
| 22 | `gh-fix-ci` | `vercel-labs/agent-skills` | CI на GitHub Actions |
| 23 | `site-builder` | local/GitHub agent skill family | Быстро строить сайты и инструменты |
| 24 | `product-frontend-design` | `mosif16/codex-Skills/product-frontend-design` | Продуктовый UX/landing review |
| 25 | `frontend-design` | `vadimcomanescu/codex-skills` | Дизайн и редизайн frontend |
| 26 | `information-architect` | `vadimcomanescu/codex-skills` | Навигация, структура, sitemap |
| 27 | `react-best-practices` | `vadimcomanescu/codex-skills` | React качество |
| 28 | `senior-architect` | `vadimcomanescu/codex-skills` | Архитектурные документы и решения |
| 29 | `senior-backend` | `vadimcomanescu/codex-skills` | Backend/API-проектирование |
| 30 | SEO/LLM skill cluster | `sergekostenchuk/seo-llm-skill-cluster` | SEO + LLM visibility |
| 31 | GEO SEO Codex | `bytefer/geo-seo-codex` | Generative Engine Optimization |
| 32 | GEO skills | `Cognitic-Labs/geoskills` | GEO/AI search visibility |
| 33 | GrowthLint | `super0510/GrowthLint` | Growth/SEO диагностика |
| 34 | Claude design skills | `master5d/claude-design-skills` | Дизайн-подходы, можно адаптировать |
| 35 | impeccable | `DevvGwardo/impeccable` | UI/design quality кандидат |
| 36 | less-is-more-ui | `Mendiak/less-is-more-ui` | Минималистичная UI-дисциплина |
| 37 | design-skills | `ccwbb78/design-skills` | Набор дизайн-навыков |
| 38 | frontend-agent-skills | `hueyexe/frontend-agent-skills` | Frontend agent workflows |
| 39 | Ultimate UI UX Pro Max | `huzaifaa-dev-vibe/Ultimate-Ui-Ux-pro-max-2.O` | UI/UX prompt/skill кандидат |
| 40 | nordic agent skills | `nordic96/nordic_claude_agent_skills` | UI/agent skill подходы |
| 41 | ux-optimization | `laohiog/ux-optimization` | UX-аудит и оптимизация |
| 42 | awesome claude ui armory | `Ezra-Y/awesome-claude-ui-armory` | UI skill/prompt референсы |
| 43 | mm-design-systems | `m2kky/mm-design-systems` | Design system подходы |
| 44 | ultimate UIUX design skills | `ca-who-codes/ultimate.UIUX.design.skills` | UI/UX кандидат |
| 45 | designlint-skill | `rgranet/designlint-skill` | Линтинг дизайна |
| 46 | custom frontend AI skills | `Ritik-Sharma1/custom-frontend-ai-skills` | Frontend skill templates |
| 47 | candy-skills | `ChloeVPin/candy-skills` | Визуальные UI skills |
| 48 | UXCraft | `Seance1723/UXCraft` | UX craft workflow |
| 49 | fluid | `Darcos-Loft/fluid` | Motion/fluid UI кандидат |
| 50 | motion-ref-skill | `joepUI/motion-ref-skill` | Motion references и анимации |

## Что ставить в первую очередь

1. Оставить активными локальные web skills: `site-builder`, `frontend-design`, `web-design-guidelines`, `typography-system`, `interaction-physics`, `playwright`, `performance-optimization`, `accessibility-excellence`.
2. После перезапуска проверить новые `frontend-ux-engineer` и `performance-optimizer`.
3. Для SEO/индексации отдельно протестировать `seo-llm-skill-cluster`, `geo-seo-codex`, `GrowthLint`.
4. Для дизайна сайта проверить `product-frontend-design`, `information-architect`, `designlint-skill`.
5. Для деплоя/качества оставить `vercel-optimize`, `vercel-react-best-practices`, `playwright`.

## Что не ставить вслепую

Кандидаты из небольших личных репозиториев нужно сначала читать: проверять `SKILL.md`, лицензии, инструкции, лишние команды, попытки ставить зависимости и сетевые действия. Skills - это инструкции для агента, поэтому плохой skill может ухудшить качество работы, а не улучшить его.

