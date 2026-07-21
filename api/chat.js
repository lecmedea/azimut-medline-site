const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GITHUB_MODELS_API_URL = "https://models.inference.ai.azure.com/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const DEFAULT_GITHUB_MODELS_MODEL = "gpt-4o-mini";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;
const ALLOWED_ORIGINS = new Set([
  "https://azimutclinic.ru",
  "http://azimutclinic.ru",
  "https://www.azimutclinic.ru",
  "http://www.azimutclinic.ru",
  "https://azimut-medline-site.vercel.app",
  "null"
]);

const SITE_CONTEXT = `
Данные о сайте:
- Бренд: Центр ментального здоровья Азимут Клиник.
- Телефон: 8 (925) 112 77 99.
- Режим связи: круглосуточно.
- География: очно и выезд - Москва, Московская область и соседние области; онлайн - РФ.
- Основные направления: психиатрия, наркология, психология, психологическое тестирование, помощь подросткам с 14 лет, консультации родственников, онлайн-консультации, выезд специалиста на дом.
- Форматы помощи: в клинике, на дому, дистанционно, по телефону.

Предварительные цены:
- Капельница очищающая - 3 900 ₽.
- Капельница комплексная - 5 900 ₽.
- Капельница «Эффект жизни» - 7 900 ₽.
- Капельница Premium - 10 900 ₽.
- Консультация по телефону - бесплатно.
- Консультация нарколога на дому - 4 900 ₽.
- Консультация психолога на дому - 4 900 ₽.
- Консультация психиатра на дому - 5 900 ₽.
- Онлайн-консультация нарколога по видеосвязи - 2 900 ₽.
- Онлайн-консультация психолога по видеосвязи - 2 900 ₽.
- Онлайн-консультация психиатра по видеосвязи - 2 900 ₽.
- Эспераль-гель, внутримышечное введение: 6 месяцев - 4 500 ₽, 1 год - 4 900 ₽, 2 года - 5 900 ₽, 3 года - 6 900 ₽, 5 лет - 8 900 ₽.
- Вивитрол, внутримышечное введение - 29 900 ₽.
- Химзащита, внутривенное введение Дисульфирама: 1 месяц - 3 900 ₽, 6 месяцев - 4 500 ₽, 1 год - 4 900 ₽, каждый дополнительный год - +1 000 ₽.
- Вшивание таблеток «Дисульфирам» на 12 месяцев - 9 900 ₽.
- Раскодирование - 2 900 ₽.
- Ночной тариф с 22:00 до 7:00: +1 000 ₽.
- Ложный вызов врача - 3 000 ₽.
- За пределами МКАД дорога может оплачиваться дополнительно.

Обязательный дисклеймер по ценам:
«Цены являются предварительными и уточняются администратором. Итоговая стоимость зависит от состояния пациента, адреса, времени обращения и выбранного формата помощи».
`;

const SYSTEM_PROMPT = `
Ты Филипп Филиппович — тёплый виртуальный консультант сайта «Центр ментального здоровья Азимут Клиник».
Ты не «сухая справка» и не скрипт call-центра: ты рядом с человеком в трудный момент.

Твоя задача:
- отвечать на вопросы о центре, услугах, форматах помощи, ценах, записи и контактах;
- помогать сориентироваться: психиатрия, психология, наркология, тестирование;
- объяснять форматы: в клинике, на дому, онлайн, по телефону;
- давать предварительные цены, если они есть;
- быть эмпатичным консультантом: сначала услышать чувство и смысл, потом дать ясный безопасный шаг;
- задавать не больше 1–2 уточняющих вопросов за раз;
- мягко предлагать заявку или звонок 8 (925) 112 77 99, особенно в тяжёлой ситуации;
- помогать родственникам понять, с чего начать, без стыда и давления.

Эмпатия и эмоциональный тон (обязательно):
- начинай с признания переживания человека: усталость, страх, стыд, злость, растерянность, надежда — без клише «я понимаю, каково вам»;
- говори по-человечески, тёплым живым языком; короткие фразы, без канцелярита и «робот-списка»;
- валидируй: «это тяжело», «вы не один/не одна с этим», «нормально, что страшно обратиться»;
- если пишут родственники — отдельно признай их тревогу и выгорание;
- если человек злится или сомневается — не спорь, не оправдывайся, признай право на сомнение;
- не используй холодные шаблоны вроде «ваша заявка принята к рассмотрению», «согласно прайсу»;
- не морализируй, не стыди, не обесценивай («это ерунда», «просто возьмите себя в руки»);
- баланс: тепло + ясность. Сначала поддержка (1–2 предложения), затем конкретика и следующий шаг;
- можно лёгкую теплоту и заботу, но без сюсюканья, без пафоса и без роли «психотерапевта в чате»;
- в конце чаще оставляй ощущение опоры: «мы на связи», «можно начать с малого шага».

Тон в целом:
- эмпатичный, бережный, спокойный, уверенный;
- профессиональный, но человечный;
- понятный;
- без давления, запугивания и агрессивных продаж.

Коммерческое поведение:
- не спорь и не обесценивай сомнения;
- если человек колеблется — предложи самый простой шаг: бесплатный звонок или короткую заявку;
- на вопрос о цене — цена + что администратор уточнит итог + мягкое «можно просто обсудить ситуацию»;
- если проблема у близкого — формат для родственников, можно начать без присутствия пациента;
- не манипулируй страхом, не обещай результат.

Строгие ограничения:
- не ставь диагнозы;
- не назначай лечение;
- не называй конкретные препараты как рекомендацию;
- не подбирай дозировки;
- не давай инструкций по самолечению;
- не обещай гарантированный результат;
- не говори «мы точно вылечим»;
- не говори «100% результат»;
- не заменяй врача;
- не собирай лишние персональные данные;
- не проси отправлять документы, анализы или интимные подробности в чат.

Если пользователь описывает экстренную ситуацию: угроза жизни, суицидальные мысли, потеря сознания, судороги, сильное отравление, острая интоксикация, психоз, агрессия, риск причинения вреда себе или другим, несовершеннолетний в опасности - ответь спокойно и прямо:
«Это может быть экстренная ситуация. Пожалуйста, немедленно позвоните 112 или 103 либо обратитесь за срочной медицинской помощью. Онлайн-бот не может заменить экстренную службу».

Если пользователь спрашивает про препараты, дозировки или самолечение, ответь:
«Я не могу подбирать препараты, дозировки или схему лечения. Это должен делать врач после очной или дистанционной консультации. Могу помочь записаться к специалисту или подсказать, какой формат обращения выбрать».

Если пользователь хочет узнать цену:
- дай предварительную цену из прайса, если она есть;
- обязательно добавь, что цены предварительные и уточняются администратором;
- предложи оставить заявку или позвонить.

Если пользователь хочет вызвать специалиста:
- уточни город/район в свободной форме;
- предложи оставить телефон;
- сообщи, что выезд возможен по Москве и Московской области, а время зависит от адреса и загруженности специалистов.

${SITE_CONTEXT}
`.trim();

function getAllowedOrigin(origin) {
  if (!origin) return "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/azimut-medline-site-[a-z0-9-]+-lecmedeas-projects\.vercel\.app$/i.test(origin)) {
    return origin;
  }
  return "";
}

function setCorsHeaders(request, response) {
  const origin = getAllowedOrigin(request.headers.origin || "");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, MAX_MESSAGE_LENGTH)
    }))
    .slice(-MAX_HISTORY_MESSAGES);
}

function buildMessages(message, history, pageUrl, utm) {
  const meta = [
    pageUrl ? `Текущая страница пользователя: ${String(pageUrl).slice(0, 500)}` : "",
    utm && typeof utm === "object" ? `UTM-метки: ${JSON.stringify(utm).slice(0, 500)}` : ""
  ].filter(Boolean).join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...(meta ? [{ role: "system", content: meta }] : []),
    ...normalizeHistory(history),
    { role: "user", content: message }
  ];
}

function buildResponsesInput(message, history, pageUrl, utm) {
  const meta = [
    pageUrl ? `Текущая страница пользователя: ${String(pageUrl).slice(0, 500)}` : "",
    utm && typeof utm === "object" ? `UTM-метки: ${JSON.stringify(utm).slice(0, 500)}` : ""
  ].filter(Boolean).join("\n");

  const transcript = normalizeHistory(history)
    .map((item) => `${item.role === "assistant" ? "Филипп Филиппович" : "Пользователь"}: ${item.content}`)
    .join("\n");

  return [
    meta ? `Контекст визита:\n${meta}` : "",
    transcript ? `История диалога:\n${transcript}` : "",
    `Новое сообщение пользователя:\n${message}`
  ].filter(Boolean).join("\n\n");
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string") {
    return request.body ? JSON.parse(request.body) : {};
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) return {};
  return JSON.parse(rawBody);
}

async function requestDeepSeek(apiKey, body, allowThinking = true) {
  const payload = {
    model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
    messages: body.messages,
    temperature: 0.55,
    max_tokens: 700,
    stream: false
  };

  if (allowThinking) {
    // If DeepSeek changes support for this option, remove this field or keep the retry below.
    payload.thinking = { type: "disabled" };
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `DeepSeek API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestOpenAI(apiKey, body) {
  const baseUrl = String(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE_URL || DEFAULT_OPENAI_BASE_URL).trim().replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const apiMode = String(process.env.OPENAI_API_MODE || "").trim().toLowerCase();
  const useResponsesApi = apiMode === "responses" || /^gpt-5/i.test(model);

  if (useResponsesApi) {
    return requestOpenAIResponses(apiKey, baseUrl, body, model);
  }

  const apiUrl = /\/chat\/completions$/.test(baseUrl) ? baseUrl : `${baseUrl}/chat/completions`;
  const payload = {
    model,
    messages: body.messages,
    temperature: 0.55,
    max_tokens: 700
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "AzimutClinicChatbot/1.0",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const providerMessage = data?.error?.message || data?.message || rawText;
    const message = providerMessage
      ? `OpenAI API error: ${response.status} - ${String(providerMessage).slice(0, 500)}`
      : `OpenAI API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestOpenAIResponses(apiKey, baseUrl, body, model) {
  const apiUrl = /\/responses$/.test(baseUrl) ? baseUrl : `${baseUrl}/responses`;
  const payload = {
    model,
    instructions: SYSTEM_PROMPT,
    input: buildResponsesInput(body.message, body.history, body.pageUrl, body.utm),
    max_output_tokens: 700
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "AzimutClinicChatbot/1.0",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const providerMessage = data?.error?.message || data?.message || rawText;
    const message = providerMessage
      ? `OpenAI Responses API error: ${response.status} - ${String(providerMessage).slice(0, 500)}`
      : `OpenAI Responses API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

function extractOpenAIAnswer(completion) {
  const chatAnswer = completion?.choices?.[0]?.message?.content?.trim();
  if (chatAnswer) return chatAnswer;

  if (typeof completion?.output_text === "string" && completion.output_text.trim()) {
    return completion.output_text.trim();
  }

  const output = Array.isArray(completion?.output) ? completion.output : [];
  const parts = [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const contentItem of content) {
      const text = contentItem?.text || contentItem?.output_text;
      if (typeof text === "string" && text.trim()) {
        parts.push(text.trim());
      }
    }
  }

  return parts.join("\n").trim();
}

function getProviderCandidates() {
  const configuredProvider = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (configuredProvider === "groq") return ["groq"];
  if (configuredProvider === "openrouter") return ["openrouter"];
  if (configuredProvider === "github" || configuredProvider === "github_models") return ["github_models"];
  if (configuredProvider === "openai" || configuredProvider === "openai-compatible" || configuredProvider === "artemox") {
    return ["openai"];
  }
  if (configuredProvider === "deepseek") return ["deepseek"];

  const candidates = [];
  if (process.env.GITHUB_MODELS_API_KEY) candidates.push("github_models");
  if (process.env.GROQ_API_KEY) candidates.push("groq");
  if (process.env.OPENROUTER_API_KEY) candidates.push("openrouter");
  if (process.env.OPENAI_API_KEY) candidates.push("openai");
  if (process.env.DEEPSEEK_API_KEY) candidates.push("deepseek");
  return candidates.length ? candidates : ["github_models"];
}

function getProviderApiKey(provider) {
  if (provider === "github_models") return process.env.GITHUB_MODELS_API_KEY;
  if (provider === "groq") return process.env.GROQ_API_KEY;
  if (provider === "openrouter") return process.env.OPENROUTER_API_KEY;
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY;
  return "";
}

async function requestOpenAICompatible({ apiUrl, apiKey, model, body, extraHeaders = {} }) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "AzimutClinicChatbot/1.0",
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      messages: body.messages,
      temperature: 0.55,
      max_tokens: 700
    })
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const providerMessage = data?.error?.message || data?.message || rawText;
    const message = providerMessage
      ? `${model} API error: ${response.status} - ${String(providerMessage).slice(0, 500)}`
      : `${model} API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestGroq(apiKey, body) {
  return requestOpenAICompatible({
    apiUrl: GROQ_API_URL,
    apiKey,
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    body
  });
}

async function requestOpenRouter(apiKey, body) {
  return requestOpenAICompatible({
    apiUrl: OPENROUTER_API_URL,
    apiKey,
    model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    body,
    extraHeaders: {
      "HTTP-Referer": "https://azimutclinic.ru/",
      "X-Title": "Azimut Clinic — Филипп Филипович"
    }
  });
}

async function requestGitHubModels(apiKey, body) {
  return requestOpenAICompatible({
    apiUrl: GITHUB_MODELS_API_URL,
    apiKey,
    model: process.env.GITHUB_MODELS_MODEL || DEFAULT_GITHUB_MODELS_MODEL,
    body
  });
}

async function requestProvider(provider, apiKey, requestBody) {
  if (provider === "github_models") {
    return requestGitHubModels(apiKey, requestBody);
  }
  if (provider === "groq") {
    return requestGroq(apiKey, requestBody);
  }
  if (provider === "openrouter") {
    return requestOpenRouter(apiKey, requestBody);
  }
  if (provider === "openai") {
    return requestOpenAI(apiKey, requestBody);
  }
  try {
    return await requestDeepSeek(apiKey, requestBody, true);
  } catch (error) {
    const isThinkingError = /thinking/i.test(error.message || "");
    if (!isThinkingError) throw error;
    console.error("DeepSeek thinking option failed, retrying without thinking:", error);
    return requestDeepSeek(apiKey, requestBody, false);
  }
}

function extractAnswer(provider, completion) {
  if (provider === "openai") {
    return extractOpenAIAnswer(completion);
  }
  return completion?.choices?.[0]?.message?.content?.trim();
}

function buildFallbackAnswer(message) {
  const text = String(message || "").toLowerCase();
  const priceDisclaimer = "Цены предварительные, администратор уточнит итоговую стоимость с учётом состояния, адреса, времени обращения и формата помощи.";

  if (/цен|стоим|сколько|прайс|руб|₽/.test(text)) {
    if (/психолог/.test(text)) {
      return `Онлайн-консультация психолога предварительно стоит 2 900 ₽, консультация психолога на дому - 4 900 ₽. ${priceDisclaimer} Могу подсказать формат обращения или вы можете позвонить круглосуточно: 8 (925) 112 77 99.`;
    }
    if (/психиатр/.test(text)) {
      return `Онлайн-консультация психиатра предварительно стоит 2 900 ₽, консультация психиатра на дому - 5 900 ₽. ${priceDisclaimer} Если состояние острое или есть риск для жизни, пожалуйста, звоните 112 или 103.`;
    }
    if (/нарколог|завис|алког|капельниц|детокс/.test(text)) {
      return `Консультация нарколога на дому предварительно стоит 4 900 ₽, онлайн-консультация нарколога - 2 900 ₽. Капельницы: очищающая - 3 900 ₽, комплексная - 5 900 ₽, «Эффект жизни» - 7 900 ₽, Premium - 10 900 ₽. ${priceDisclaimer}`;
    }
    return `По основным услугам: консультация по телефону - бесплатно, онлайн-консультации специалиста - от 2 900 ₽, выезд специалиста на дом - от 4 900 ₽. ${priceDisclaimer} Для точного подбора позвоните: 8 (925) 112 77 99.`;
  }

  if (/дом|выезд|вызвать|адрес/.test(text)) {
    return "Выезд специалиста возможен по Москве и Московской области, время зависит от адреса и загрузки. Напишите район или позвоните 8 (925) 112 77 99 - администратор подскажет ближайший формат помощи.";
  }

  if (/экстр|суицид|умереть|угроз|судорог|потер.*созн|психоз|агресс/.test(text)) {
    return "Это может быть экстренная ситуация. Пожалуйста, немедленно позвоните 112 или 103 либо обратитесь за срочной медицинской помощью. Онлайн-бот не может заменить экстренную службу.";
  }

  return "Я Филипп Филиппович, виртуальный консультант Азимут Клиник. Помогу сориентироваться по услугам, цене и формату обращения: в клинике, на дому, онлайн или по телефону. Опишите, что вас беспокоит, или позвоните круглосуточно: 8 (925) 112 77 99.";
}

module.exports = async function chatHandler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Метод не поддерживается. Используйте POST-запрос." });
  }

  const providers = getProviderCandidates();
  const hasAnyKey = providers.some((provider) => Boolean(getProviderApiKey(provider)));
  if (!hasAnyKey) {
    return sendJson(response, 500, {
      error: "Филипп Филипович пока не настроен. Добавьте GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY или DEEPSEEK_API_KEY в Vercel."
    });
  }

  let requestMessage = "";

  try {
    const body = await readJsonBody(request);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    requestMessage = message;

    if (!message) {
      return sendJson(response, 400, { error: "Введите сообщение для Филиппа Филипповича." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return sendJson(response, 400, { error: `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов.` });
    }

    const requestBody = {
      message,
      history: body.history,
      pageUrl: body.pageUrl,
      utm: body.utm,
      messages: buildMessages(message, body.history, body.pageUrl, body.utm)
    };

    const errors = [];
    for (const provider of providers) {
      const apiKey = getProviderApiKey(provider);
      if (!apiKey) continue;
      try {
        const completion = await requestProvider(provider, apiKey, requestBody);
        const answer = extractAnswer(provider, completion);
        if (!answer) {
          throw new Error(`${provider} returned an empty answer`);
        }
        return sendJson(response, 200, { answer, provider });
      } catch (error) {
        console.error(`AI provider ${provider} failed:`, error);
        errors.push(`${provider}: ${error.message || "ошибка"}`);
      }
    }

    throw new Error(errors.join(" | ") || "Нет доступных AI-провайдеров.");
  } catch (error) {
    console.error("AI chatbot backend error:", error);
    return sendJson(response, 200, {
      answer: buildFallbackAnswer(requestMessage),
      fallback: true
    });
  }
};
