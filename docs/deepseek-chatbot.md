# AI-бот для сайта: OpenAI или DeepSeek

## 1. Что делает AI-бот

AI-бот помогает посетителю сайта «Центр ментального здоровья Азимут Клиник» сориентироваться по услугам, ценам, форматам помощи, записи и контактам. Он не заменяет врача, не ставит диагнозы и не назначает лечение.

## 2. Почему API-ключ нельзя вызывать из браузера

OpenAI/DeepSeek API key нельзя хранить в HTML, frontend JS, CSS, виджете или публичном репозитории. Любой код браузера доступен посетителю сайта, поэтому прямой вызов API из frontend раскроет ключ. Правильная схема:

```text
Пользователь на сайте -> чат-виджет -> /api/chat -> OpenAI/DeepSeek API -> чат-виджет
```

## 3. Где находится backend endpoint

Backend endpoint находится в:

```text
api/chat.js
```

Он принимает только `POST`-запросы на `/api/chat`, проверяет API-ключ, валидирует сообщение, ограничивает длину входа и отправляет запрос выбранному провайдеру.

## 4. Где находится frontend-виджет

Frontend-логика:

```text
js/chatbot.js
```

Стили:

```text
css/chatbot.css
```

Виджет подключён к основным страницам сайта: `index.html`, `about.html`, `services.html`, `prices.html`, `doctors.html`, `blog.html`, `article.html`, `contacts.html`, `payment.html`, `partnership.html`.

## 5. Где менять системный промпт

Системный промпт находится в `api/chat.js` в константе:

```js
SYSTEM_PROMPT
```

Там же хранится контекст сайта и медицинские ограничения.

## 6. Где менять быстрые кнопки

Быстрые кнопки находятся в `js/chatbot.js` в массиве:

```js
quickActions
```

Каждый элемент содержит подпись кнопки и текст, который отправляется в чат.

## 7. Где менять дизайн чата

Дизайн меняется в:

```text
css/chatbot.css
```

Там описаны закрытая кнопка, стеклянная панель, сообщения, быстрые кнопки, мобильная версия, фокус-состояния и `prefers-reduced-motion`.

## 8. Где менять провайдера и модель

Провайдер и модель задаются переменными окружения:

```text
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4.1-nano
```

Если `AI_PROVIDER` не задан, код сам выберет OpenAI при наличии `OPENAI_API_KEY`, иначе DeepSeek.

Для DeepSeek можно использовать:

```text
AI_PROVIDER=deepseek
DEEPSEEK_MODEL=deepseek-v4-flash
```

## 9. Как добавить API-ключ локально

Создать файл `.env.local` в корне проекта:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=сюда_вставить_новый_openai_api_key
OPENAI_MODEL=gpt-4.1-nano
```

Файл `.env.local` не должен попадать в GitHub. Он добавлен в `.gitignore`.

Шаблон без реального ключа находится в:

```text
.env.example
```

## 10. Как оплатить и добавить API-ключ OpenAI

1. Открыть OpenAI Platform: https://platform.openai.com/
2. Добавить оплату в Billing: https://platform.openai.com/settings/organization/billing/overview
3. Создать новый API key: https://platform.openai.com/api-keys
4. Посмотреть доступные модели в Models: https://platform.openai.com/docs/models
5. Проверить стоимость модели в Pricing: https://platform.openai.com/docs/pricing

Важно: если ключ был отправлен в чат, письмо или публичный документ, его нужно удалить/отозвать и создать новый.

## 11. Как добавить API-ключ на Vercel

В настройках проекта Vercel добавить Environment Variable:

```text
Name: AI_PROVIDER
Value: openai

Name: OPENAI_API_KEY
Value: реальный OpenAI API key

Name: OPENAI_MODEL
Value: gpt-4.1-nano
```

Не указывать значение ключа в коде или документации. После добавления переменной выполнить redeploy.

## 12. Как проверить работу бота

Для обычного `python3 -m http.server` frontend откроется, но `/api/chat` работать не будет. Нужен Vercel dev или другой сервер, который поддерживает `/api/chat`.

Локальный запуск через Vercel:

```bash
npm i -g vercel
vercel dev
```

Открыть:

```text
http://localhost:3000
```

Проверить endpoint:

```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Сколько стоит онлайн-консультация психолога?","history":[],"pageUrl":"http://localhost:3000","utm":{}}'
```

`GET /api/chat` должен вернуть ошибку метода. При отсутствии API-ключа endpoint возвращает понятное сообщение, что AI-помощник не настроен.

## 13. Как подключить Битрикс24 позже

В `js/chatbot.js` при обнаружении телефона формируется `leadData`:

```js
{
  NAME: "Пользователь из AI-чата",
  PHONE: "найденный телефон",
  COMMENTS: "текст вопроса и краткая история диалога",
  SOURCE_ID: "AI chatbot",
  PAGE_URL: window.location.href,
  UTM_SOURCE,
  UTM_MEDIUM,
  UTM_CAMPAIGN,
  UTM_CONTENT,
  UTM_TERM
}
```

Пока реальные данные не отправляются. Заглушка находится в:

```text
js/bitrix24-placeholder.js
```

Функция:

```js
window.AzimutBitrix.sendChatLeadToBitrix24(leadData)
```

Позже внутри этой функции можно подключить webhook или backend-прокси для Битрикс24.

## 14. Какие медицинские ограничения встроены

Бот не должен:

- ставить диагнозы;
- назначать лечение;
- рекомендовать препараты;
- подбирать дозировки;
- давать инструкции по самолечению;
- обещать гарантированный результат;
- заменять врача;
- просить документы, анализы или интимные подробности.

При экстренных ситуациях бот должен направлять пользователя звонить `112` или `103` либо обращаться за срочной медицинской помощью.
