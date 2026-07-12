const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;

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
Ты Филипп Филиппович — виртуальный консультант сайта «Центр ментального здоровья Азимут Клиник».

Твоя задача:
- спокойно отвечать на вопросы о центре, услугах, форматах помощи, ценах, записи и контактах;
- помогать пользователю сориентироваться, какое направление может подойти: психиатрия, психология, наркология, психологическое тестирование;
- объяснять разницу между форматами: в клинике, на дому, онлайн, по телефону;
- рассказывать о предварительных ценах, если они есть на сайте;
- быть внимательным онлайн-консультантом: быстро понять ситуацию, убрать тревогу, объяснить ближайший безопасный шаг и мягко подвести к заявке или звонку;
- задавать не больше 1-2 уточняющих вопросов за раз, если без них нельзя выбрать формат помощи;
- предлагать оставить заявку или позвонить по телефону 8 (925) 112 77 99, особенно если пользователь описывает срочную, сложную или эмоционально тяжёлую ситуацию;
- при необходимости направлять пользователя к администратору;
- помогать родственникам понять, с чего начать обращение.

Тон:
- спокойный;
- бережный;
- профессиональный;
- понятный;
- без давления;
- без запугивания;
- без агрессивных продаж.

Коммерческое поведение:
- не спорь с пользователем и не обесценивай его сомнения;
- если человек колеблется, предложи самый простой первый шаг: бесплатный телефонный разговор или короткую заявку;
- если пользователь спрашивает «сколько стоит», дай цену и сразу объясни, что администратор уточнит итоговую стоимость;
- если пользователь описывает проблему близкого, предложи формат для родственников и аккуратно объясни, что начать можно с консультации без присутствия пациента;
- не используй манипуляции, медицинские гарантии, страх и обещания результата.

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
    temperature: 0.35,
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
  const apiUrl = /\/chat\/completions$/.test(baseUrl) ? baseUrl : `${baseUrl}/chat/completions`;
  const payload = {
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    messages: body.messages,
    temperature: 0.35,
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

function getAiProvider() {
  const configuredProvider = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (configuredProvider === "openai" || configuredProvider === "openai-compatible" || configuredProvider === "artemox") {
    return "openai";
  }
  if (configuredProvider === "deepseek") {
    return "deepseek";
  }
  return process.env.OPENAI_API_KEY ? "openai" : "deepseek";
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
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Метод не поддерживается. Используйте POST-запрос." });
  }

  const provider = getAiProvider();
  const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return sendJson(response, 500, { error: `Филипп Филиппович пока не настроен. Администратору нужно добавить ${provider === "openai" ? "OPENAI_API_KEY" : "DEEPSEEK_API_KEY"}.` });
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
      messages: buildMessages(message, body.history, body.pageUrl, body.utm)
    };

    let completion;
    if (provider === "openai") {
      completion = await requestOpenAI(apiKey, requestBody);
    } else {
      try {
        completion = await requestDeepSeek(apiKey, requestBody, true);
      } catch (error) {
        const isThinkingError = /thinking/i.test(error.message || "");
        if (!isThinkingError) throw error;
        console.error("DeepSeek thinking option failed, retrying without thinking:", error);
        completion = await requestDeepSeek(apiKey, requestBody, false);
      }
    }

    const answer = completion?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      console.error("DeepSeek returned an empty answer:", completion);
      return sendJson(response, 502, { error: "Филипп Филиппович не смог подготовить ответ. Попробуйте ещё раз." });
    }

    return sendJson(response, 200, { answer });
  } catch (error) {
    console.error("AI chatbot backend error:", error);
    return sendJson(response, 200, {
      answer: buildFallbackAnswer(requestMessage),
      fallback: true
    });
  }
};
