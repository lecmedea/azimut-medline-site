const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash";
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
Ты виртуальный помощник сайта «Центр ментального здоровья Азимут Клиник».

Твоя задача:
- спокойно отвечать на вопросы о центре, услугах, форматах помощи, ценах, записи и контактах;
- помогать пользователю сориентироваться, какое направление может подойти: психиатрия, психология, наркология, психологическое тестирование;
- объяснять разницу между форматами: в клинике, на дому, онлайн, по телефону;
- рассказывать о предварительных ценах, если они есть на сайте;
- предлагать оставить заявку или позвонить по телефону 8 (925) 112 77 99;
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
    model: MODEL,
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

module.exports = async function chatHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Метод не поддерживается. Используйте POST-запрос." });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return sendJson(response, 500, { error: "AI-помощник пока не настроен. Администратору нужно добавить DEEPSEEK_API_KEY." });
  }

  try {
    const body = await readJsonBody(request);
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return sendJson(response, 400, { error: "Введите сообщение для AI-помощника." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return sendJson(response, 400, { error: `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов.` });
    }

    const requestBody = {
      messages: buildMessages(message, body.history, body.pageUrl, body.utm)
    };

    let completion;
    try {
      completion = await requestDeepSeek(apiKey, requestBody, true);
    } catch (error) {
      const isThinkingError = /thinking/i.test(error.message || "");
      if (!isThinkingError) throw error;
      console.error("DeepSeek thinking option failed, retrying without thinking:", error);
      completion = await requestDeepSeek(apiKey, requestBody, false);
    }

    const answer = completion?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      console.error("DeepSeek returned an empty answer:", completion);
      return sendJson(response, 502, { error: "AI-помощник не смог подготовить ответ. Попробуйте ещё раз." });
    }

    return sendJson(response, 200, { answer });
  } catch (error) {
    console.error("AI chatbot backend error:", error);
    return sendJson(response, 500, { error: "AI-помощник временно недоступен. Попробуйте позже или позвоните в центр." });
  }
};
