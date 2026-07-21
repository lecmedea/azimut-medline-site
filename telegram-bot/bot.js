/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

/** Load KEY=VALUE pairs from telegram-bot/.env into process.env (no extra deps). */
function loadDotEnv(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const eq = line.indexOf("=");
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    console.warn("Could not read .env:", error.message);
  }
}

loadDotEnv(path.join(__dirname, ".env"));

/**
 * Telegram Bot API base ending with `/bot`.
 * On Yandex Cloud, api.telegram.org is often blocked — set:
 *   TELEGRAM_API=https://azimut-medline-site.vercel.app/api/tg-proxy/bot
 *   TG_PROXY_SECRET=...
 */
const TELEGRAM_API = (() => {
  const raw = (process.env.TELEGRAM_API || "https://api.telegram.org/bot").trim();
  if (raw.endsWith("/bot")) return raw;
  if (raw.endsWith("/bot/")) return raw.slice(0, -1);
  if (raw.endsWith("/")) return `${raw}bot`;
  return `${raw}/bot`;
})();
const TG_PROXY_SECRET = process.env.TG_PROXY_SECRET || "";
/** Long-poll seconds; keep ≤8 when using a serverless proxy (Vercel free ~10–60s). */
const TELEGRAM_POLL_TIMEOUT = Number(process.env.TELEGRAM_POLL_TIMEOUT || (TG_PROXY_SECRET ? 8 : 25));
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const CLINIC_NAME = process.env.CLINIC_NAME || "Азимут Клиник";
const CLINIC_PHONE = process.env.CLINIC_PHONE || "+79251127799";
const CLINIC_SITE_URL = process.env.CLINIC_SITE_URL || "https://azimutclinic.ru/";
const BOT_LOGO_URL = process.env.BOT_LOGO_URL || `${CLINIC_SITE_URL.replace(/\/$/, "")}/assets/images/bot-welcome-clinic.jpg`;
const WELCOME_PHOTO_PATH =
  process.env.WELCOME_PHOTO_PATH || path.join(__dirname, "assets", "welcome-clinic.jpg");
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
/** Google Apps Script web app URL that appends rows to the clinic leads spreadsheet */
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";
const GOOGLE_SHEETS_WEBHOOK_SECRET = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || "azimut-tg-leads-2026";
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || "14mN2aNqmYdg-TdLrKIWrLK7z8woTECd3qpLNqy6mMq8";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

function isPlaceholderToken(token) {
  if (!token || !String(token).trim()) return true;
  const t = String(token).trim().toLowerCase();
  if (t.includes("replace") || t.includes("your_") || t.includes("changeme") || t === "[sensitive]") return true;
  // Real Bot API tokens look like 123456789:AA...
  if (!/^\d{6,15}:[A-Za-z0-9_-]{20,}$/.test(String(token).trim())) return true;
  return false;
}

if (isPlaceholderToken(TELEGRAM_BOT_TOKEN)) {
  console.error(
    "Missing or invalid TELEGRAM_BOT_TOKEN.\n" +
      "1) Open @BotFather → your bot @azimut_clinic_bot → API Token\n" +
      "2) Put it into telegram-bot/.env as TELEGRAM_BOT_TOKEN=123456:ABC...\n" +
      "3) Run: bash telegram-bot/start-bot.sh"
  );
  process.exit(1);
}

if (!DEEPSEEK_API_KEY) {
  console.warn("DEEPSEEK_API_KEY is not set. AI consultation will return a setup message.");
}

const userState = new Map();
let updateOffset = 0;

const SYSTEM_PROMPT = `
Ты круглосуточный онлайн-консультант центра ментального здоровья "Азимут Клиник".
Помогай пациентам и родственникам спокойно сориентироваться по услугам клиники: наркология,
психиатрия, психология, психологическое тестирование, консультации онлайн, в клинике, на дому
и по телефону.

Тон: бережный, понятный, уверенный, без давления и запугивания. Всегда предлагай оформить заявку
или позвонить, если человеку нужна помощь.

Важные данные:
- Телефон клиники: ${CLINIC_PHONE}
- Сайт: ${CLINIC_SITE_URL}
- Работа: круглосуточно
- Форматы: в клинике, на дому по Москве и МО, онлайн по РФ, по телефону
- Популярные цены: консультация по телефону бесплатно; онлайн-консультация специалиста от 2 900 ₽;
  консультация нарколога на дому от 4 900 ₽; консультация психиатра на дому от 5 900 ₽;
  выведение из запоя от 3 900 ₽.

Медицинские ограничения:
- Не ставь диагнозы.
- Не назначай препараты, дозировки или лечение.
- Не обещай гарантированный результат.
- Не заменяй врача.
- При угрозе жизни, судорогах, потере сознания, острой боли, попытке суицида, психозе,
  агрессии или сильном отравлении рекомендуй срочно звонить 112 или 103.

Если вопрос подходит для записи, мягко предложи нажать кнопку "Оформить заявку".
`.trim();

const MENU = {
  main: {
    title: "🧭 Главное меню",
    text: [
      "✨ Выберите, чем я могу помочь:",
      "",
      "Можно задать вопрос AI-консультанту, посмотреть услуги и цены или сразу оформить заявку."
    ].join("\n"),
    rows: [
      [{ text: "📝 Оформить заявку", data: "lead:start" }],
      [{ text: "🤖 AI-консультант 24/7", data: "ai:start" }],
      [
        { text: "🩺 Услуги", data: "menu:services" },
        { text: "💳 Цены", data: "menu:prices" }
      ],
      [
        { text: "👩‍⚕️ Врачи и направления", data: "menu:doctors" },
        { text: "📞 Контакты", data: "menu:contacts" }
      ],
      [
        { text: "💰 Оплата", data: "menu:payment" },
        { text: "🌐 Сайт клиники", url: CLINIC_SITE_URL }
      ]
    ]
  },
  services: {
    title: "🩺 Услуги",
    text: [
      "Основные направления помощи:",
      "",
      "• Наркология: запойные состояния, зависимость, консультации родственников.",
      "• Психиатрия: тревога, панические атаки, депрессивные состояния, кризисы.",
      "• Психология: стресс, выгорание, семейные и подростковые трудности.",
      "• Форматы: клиника, дом, онлайн, телефон."
    ].join("\n"),
    rows: [
      [{ text: "📝 Оформить заявку", data: "lead:start" }],
      [{ text: "🤖 Спросить AI по услугам", data: "ai:start_services" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ]
  },
  prices: {
    title: "💳 Цены",
    text: [
      "Ориентиры по стоимости:",
      "",
      "• Консультация по телефону: бесплатно",
      "• Онлайн-консультация специалиста: от 2 900 ₽",
      "• Консультация нарколога на дому: от 4 900 ₽",
      "• Консультация психиатра на дому: от 5 900 ₽",
      "• Выведение из запоя: от 3 900 ₽",
      "",
      "Точная стоимость зависит от ситуации и формата помощи."
    ].join("\n"),
    rows: [
      [{ text: "💬 Уточнить стоимость", data: "lead:start" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ]
  },
  doctors: {
    title: "👩‍⚕️ Врачи и направления",
    text: [
      "В центре доступны направления:",
      "",
      "• Психиатр",
      "• Нарколог",
      "• Психолог",
      "• Клинический психолог",
      "• Психотерапевт",
      "",
      "Если сложно выбрать специалиста, оставьте заявку: администратор поможет подобрать формат."
    ].join("\n"),
    rows: [
      [{ text: "🧑‍⚕️ Подобрать специалиста", data: "lead:start" }],
      [{ text: "🤖 Спросить AI", data: "ai:start_doctors" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ]
  },
  contacts: {
    title: "📞 Контакты",
    text: [
      `${CLINIC_NAME} работает круглосуточно.`,
      "",
      `Телефон: ${CLINIC_PHONE}`,
      `Сайт: ${CLINIC_SITE_URL}`,
      "",
      "Если ситуация острая и есть риск для жизни, звоните 112 или 103."
    ].join("\n"),
    rows: [
      [{ text: "📝 Оформить заявку", data: "lead:start" }],
      [{ text: "☎️ Показать телефон", data: "contact:phone" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ]
  },
  payment: {
    title: "💰 Оплата",
    text: [
      "Оплату и точный порядок расчёта лучше уточнить при записи.",
      "",
      "Администратор подскажет доступные способы оплаты для выбранного формата помощи."
    ].join("\n"),
    rows: [
      [{ text: "💬 Уточнить оплату", data: "lead:start" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ]
  }
};

function inlineKeyboard(rows) {
  return {
    inline_keyboard: rows.map((row) =>
      row.map((button) => {
        if (button.data && !button.callback_data) {
          const { data, ...rest } = button;
          return { ...rest, callback_data: data };
        }
        return button;
      })
    )
  };
}

function getChatId(update) {
  return update.message?.chat?.id || update.callback_query?.message?.chat?.id;
}

function telegramHeaders(extra = {}) {
  const headers = { ...extra };
  if (TG_PROXY_SECRET) headers["X-Azimut-Tg-Proxy"] = TG_PROXY_SECRET;
  return headers;
}

async function telegram(method, payload) {
  const response = await fetch(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: telegramHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  }
  return data.result;
}

/** sendPhoto with local file (multipart) — preferred for welcome image */
async function telegramSendPhotoFile(chatId, filePath, caption, extra = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Welcome photo not found: ${filePath}`);
  }
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (extra.reply_markup) {
    form.append("reply_markup", JSON.stringify(extra.reply_markup));
  }
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  form.append("photo", blob, path.basename(filePath));

  const response = await fetch(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: telegramHeaders(),
    body: form
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram sendPhoto(file) failed: ${JSON.stringify(data)}`);
  }
  return data.result;
}

function textOptions(extra = {}) {
  return {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra
  };
}

async function sendMessage(chatId, text, extra = {}) {
  return telegram("sendMessage", { chat_id: chatId, text, ...textOptions(extra) });
}

async function editMessage(chatId, messageId, text, rows) {
  return telegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    ...textOptions({ reply_markup: inlineKeyboard(rows) })
  });
}

async function answerCallback(callbackQueryId) {
  return telegram("answerCallbackQuery", { callback_query_id: callbackQueryId });
}

async function showMenu(chatId, menuName = "main", messageId = null) {
  const menu = MENU[menuName] || MENU.main;
  const text = `<b>${escapeHtml(menu.title)}</b>\n\n${escapeHtml(menu.text)}`;
  if (messageId) {
    await editMessage(chatId, messageId, text, menu.rows);
    return;
  }
  await sendMessage(chatId, text, { reply_markup: inlineKeyboard(menu.rows) });
}

async function sendWelcome(chatId, firstName = "") {
  const nameLine = firstName ? `${firstName}, здравствуйте!` : "Здравствуйте!";
  const caption = [
    `👋 <b>${escapeHtml(nameLine)}</b>`,
    "",
    `🧭 Я онлайн-консультант центра <b>${escapeHtml(CLINIC_NAME)}</b>. Помогу сориентироваться по услугам, стоимости, форматам помощи и записи.`,
    "",
    "🚨 Если вопрос срочный и есть риск для жизни или безопасности, пожалуйста, звоните <b>112</b> или <b>103</b>.",
    "",
    "👇 Выберите действие ниже."
  ].join("\n");

  const keyboard = { reply_markup: inlineKeyboard(MENU.main.rows) };
  try {
    // 1) Local welcome photo (cabinet with Azimut logo)
    if (fs.existsSync(WELCOME_PHOTO_PATH)) {
      await telegramSendPhotoFile(chatId, WELCOME_PHOTO_PATH, caption, keyboard);
      return;
    }
    // 2) Fallback: public URL
    await telegram("sendPhoto", {
      chat_id: chatId,
      photo: BOT_LOGO_URL,
      caption,
      parse_mode: "HTML",
      ...keyboard
    });
  } catch (error) {
    console.warn("Welcome photo was not sent, falling back to text:", error.message);
    await sendMessage(chatId, caption, keyboard);
  }
}

async function startLead(chatId) {
  userState.set(chatId, { mode: "lead", step: "name", lead: {} });
  await sendMessage(chatId, [
    "📝 <b>Оформление заявки</b>",
    "",
    "Я задам несколько коротких вопросов, чтобы администратор мог связаться с вами и подобрать формат помощи.",
    "",
    "👤 Как к вам обращаться?"
  ].join("\n"), {
    reply_markup: inlineKeyboard([[{ text: "⬅️ Назад", data: "menu:main" }]])
  });
}

async function startAi(chatId, contextHint = "") {
  userState.set(chatId, { mode: "ai", history: [], contextHint });
  await sendMessage(chatId, [
    "🤖 <b>AI-консультант 24/7</b>",
    "",
    "💬 Напишите вопрос в свободной форме. Я помогу сориентироваться по услугам и следующему шагу.",
    "",
    "⚕️ Я не ставлю диагнозы и не назначаю лечение. При срочной угрозе жизни звоните 112 или 103."
  ].join("\n"), {
    reply_markup: inlineKeyboard([
      [{ text: "📝 Оформить заявку", data: "lead:start" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ])
  });
}

async function handleLeadMessage(chatId, text) {
  const state = userState.get(chatId);
  if (!state || state.mode !== "lead") return false;

  const value = text.trim();
  if (!value) {
    await sendMessage(chatId, "✍️ Пожалуйста, напишите ответ текстом или нажмите «Назад».");
    return true;
  }

  if (state.step === "name") {
    state.lead.name = value;
    state.step = "phone";
    await sendMessage(chatId, "Спасибо. ☎️ Укажите, пожалуйста, номер телефона для связи.");
    return true;
  }

  if (state.step === "phone") {
    state.lead.phone = value;
    state.step = "service";
    await sendMessage(chatId, "🧭 Какой формат или направление вас интересует?", {
      reply_markup: inlineKeyboard([
        [
          { text: "🧬 Наркология", data: "lead_service:Наркология" },
          { text: "🧠 Психиатрия", data: "lead_service:Психиатрия" }
        ],
        [
          { text: "💬 Психология", data: "lead_service:Психология" },
          { text: "🧭 Не знаю", data: "lead_service:Нужна помощь с выбором" }
        ],
        [{ text: "⬅️ Назад", data: "menu:main" }]
      ])
    });
    return true;
  }

  if (state.step === "comment") {
    state.lead.comment = value;
    await finishLead(chatId, state.lead);
    return true;
  }

  await sendMessage(chatId, "👇 Выберите вариант кнопкой ниже или нажмите «Назад».");
  return true;
}

function moscowTimestamp(iso) {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(iso ? new Date(iso) : new Date()).replace("T", " ");
  } catch {
    return new Date().toISOString();
  }
}

async function sendLeadToGoogleSheets(lead) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn(
      "GOOGLE_SHEETS_WEBHOOK_URL is not set. Lead saved only to bot log. " +
        "Deploy telegram-bot/google-sheets-leads.gs and set the web app URL in .env"
    );
    return { ok: false, skipped: true };
  }

  const payload = {
    secret: GOOGLE_SHEETS_WEBHOOK_SECRET,
    id: lead.id || `tg-${Date.now()}`,
    createdAt: lead.createdAt,
    createdAtMsk: moscowTimestamp(lead.createdAt),
    source: lead.source || "Telegram bot",
    platform: "Telegram",
    name: lead.name || "",
    phone: lead.phone || "",
    email: lead.email || "",
    service: lead.service || "",
    direction: lead.service || "",
    comment: lead.comment || "",
    chatId: lead.chatId || "",
    telegramUsername: lead.username || "",
    pageUrl: "https://t.me/azimut_clinic_bot",
    form: "telegram_bot_lead",
    requestId: lead.id || `tg-${Date.now()}`,
    consent: true,
    status: "new",
    spreadsheetId: GOOGLE_SHEETS_ID
  };

  const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow"
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!response.ok || data?.ok === false) {
    throw new Error(`Sheets webhook failed: HTTP ${response.status} ${JSON.stringify(data)}`);
  }
  console.log("Lead written to Google Sheets:", JSON.stringify(data));
  return data;
}

async function finishLead(chatId, lead) {
  lead.createdAt = new Date().toISOString();
  lead.source = "Telegram bot";
  lead.chatId = String(chatId);
  lead.id = `tg-${chatId}-${Date.now()}`;
  console.log("Telegram clinic lead:", JSON.stringify(lead, null, 2));

  let sheetsOk = false;
  try {
    const sheetsResult = await sendLeadToGoogleSheets(lead);
    sheetsOk = !sheetsResult?.skipped;
  } catch (error) {
    console.error("Google Sheets lead error:", error.message);
  }

  if (ADMIN_CHAT_ID) {
    try {
      await sendMessage(ADMIN_CHAT_ID, [
        "🆕 <b>Новая заявка из Telegram-бота</b>",
        "",
        `👤 Имя: ${escapeHtml(lead.name || "не указано")}`,
        `☎️ Телефон: ${escapeHtml(lead.phone || "не указан")}`,
        `🧭 Направление: ${escapeHtml(lead.service || "не указано")}`,
        `📝 Комментарий: ${escapeHtml(lead.comment || "не указан")}`,
        sheetsOk ? "📊 Таблица: записано" : "📊 Таблица: не записано (проверьте webhook)"
      ].join("\n"));
    } catch (error) {
      console.warn("Admin notify failed:", error.message);
    }
  }

  userState.delete(chatId);
  await sendMessage(chatId, [
    "✅ <b>Заявка принята.</b>",
    "",
    "Спасибо. Администратор свяжется с вами, уточнит детали и подскажет ближайший подходящий формат помощи.",
    "",
    `☎️ Если нужно быстрее, можно позвонить: ${escapeHtml(CLINIC_PHONE)}`
  ].join("\n"), {
    reply_markup: inlineKeyboard([
      [{ text: "🧭 Главное меню", data: "menu:main" }],
      [{ text: "🤖 Задать вопрос AI", data: "ai:start" }]
    ])
  });
}

async function handleAiMessage(chatId, text) {
  const state = userState.get(chatId);
  if (!state || state.mode !== "ai") return false;

  const message = text.trim();
  if (!message) return true;

  if (!DEEPSEEK_API_KEY) {
    await sendMessage(chatId, [
      "⚙️ AI-консультант пока не настроен: не задан `DEEPSEEK_API_KEY`.",
      "",
      "📝 Можно оформить заявку, и администратор свяжется с вами."
    ].join("\n"), {
      reply_markup: inlineKeyboard([
        [{ text: "📝 Оформить заявку", data: "lead:start" }],
        [{ text: "⬅️ Назад", data: "menu:main" }]
      ])
    });
    return true;
  }

  await telegram("sendChatAction", { chat_id: chatId, action: "typing" });

  const reply = await askDeepSeek(message, state.history, state.contextHint).catch((error) => {
    console.error("DeepSeek request failed:", error);
    if (error.status === 402 || /Insufficient Balance/i.test(error.message)) {
      return "⚠️ AI-консультант сейчас не отвечает из-за ограничения DeepSeek API. Вы можете оформить заявку — администратор свяжется с вами и поможет сориентироваться.";
    }
    return "⚠️ Сейчас AI-консультант временно недоступен. Оставьте заявку или позвоните в клинику, и мы поможем сориентироваться.";
  });

  state.history.push({ role: "user", content: message });
  state.history.push({ role: "assistant", content: reply });
  state.history = state.history.slice(-8);

  await sendMessage(chatId, escapeHtml(reply), {
    reply_markup: inlineKeyboard([
      [{ text: "📝 Оформить заявку", data: "lead:start" }],
      [{ text: "⬅️ Назад", data: "menu:main" }]
    ])
  });
  return true;
}

async function askDeepSeek(message, history, contextHint) {
  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nКонтекст меню: ${contextHint || "общий вопрос"}` },
    ...history.slice(-6),
    { role: "user", content: message.slice(0, 2500) }
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.35,
      max_tokens: 700
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || JSON.stringify(data);
    const error = new Error(`DeepSeek HTTP ${response.status}: ${message}`);
    error.status = response.status;
    error.deepseek = data.error || data;
    throw error;
  }

  return data.choices?.[0]?.message?.content?.trim() || "Не получилось сформировать ответ. Попробуйте переформулировать вопрос.";
}

async function handleCallback(update) {
  const query = update.callback_query;
  if (!query) return false;

  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data || "";
  await answerCallback(query.id);

  if (data.startsWith("menu:")) {
    userState.delete(chatId);
    await showMenu(chatId, data.slice("menu:".length), messageId);
    return true;
  }

  if (data === "lead:start") {
    await startLead(chatId);
    return true;
  }

  if (data.startsWith("lead_service:")) {
    const state = userState.get(chatId);
    if (!state || state.mode !== "lead") {
      await startLead(chatId);
      return true;
    }
    state.lead.service = data.slice("lead_service:".length);
    state.step = "comment";
    await sendMessage(chatId, "📝 Кратко опишите ситуацию или удобное время для звонка.");
    return true;
  }

  if (data.startsWith("ai:start")) {
    await startAi(chatId, data.replace("ai:start", "").replace(/^_/, ""));
    return true;
  }

  if (data === "contact:phone") {
    await sendMessage(chatId, `☎️ Телефон клиники: ${escapeHtml(CLINIC_PHONE)}\n\n🌙 Мы на связи круглосуточно.`, {
      reply_markup: inlineKeyboard([[{ text: "⬅️ Назад", data: "menu:contacts" }]])
    });
    return true;
  }

  return false;
}

async function handleMessage(update) {
  const message = update.message;
  if (!message?.chat?.id) return;

  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/start" || text === "/menu") {
    userState.delete(chatId);
    await sendWelcome(chatId, message.from?.first_name || "");
    return;
  }

  if (text === "/help") {
    await sendMessage(chatId, "💬 Напишите вопрос, нажмите «Оформить заявку» или откройте /menu.");
    return;
  }

  if (await handleLeadMessage(chatId, text)) return;
  if (await handleAiMessage(chatId, text)) return;

  userState.set(chatId, { mode: "ai", history: [], contextHint: "пользователь написал без выбора меню" });
  await handleAiMessage(chatId, text);
}

async function poll() {
  while (true) {
    try {
      const updates = await telegram("getUpdates", {
        offset: updateOffset,
        timeout: Number.isFinite(TELEGRAM_POLL_TIMEOUT) ? TELEGRAM_POLL_TIMEOUT : 25,
        allowed_updates: ["message", "callback_query"]
      });

      for (const update of updates) {
        updateOffset = update.update_id + 1;
        try {
          if (await handleCallback(update)) continue;
          await handleMessage(update);
        } catch (error) {
          console.error("Update handling failed:", error);
          const chatId = getChatId(update);
          if (chatId) {
            await sendMessage(chatId, "⚠️ Произошла техническая ошибка. Попробуйте ещё раз или позвоните в клинику.");
          }
        }
      }
    } catch (error) {
      console.error("Polling failed:", error.message);
      await sleep(2000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

console.log(`${CLINIC_NAME} Telegram bot started.`);
poll();
