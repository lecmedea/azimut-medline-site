const MAX_TEXT = 12000;
const ALLOWED_ORIGINS = new Set([
  "https://azimutclinic.ru",
  "http://azimutclinic.ru",
  "https://www.azimutclinic.ru",
  "http://www.azimutclinic.ru",
  "https://lecmedea.github.io",
  "https://azimut-medline-site.vercel.app",
  "null"
]);

function clean(value, limit = 1000) {
  return String(value ?? "").replace(/\0/g, "").trim().slice(0, limit);
}

function normalizePhone(value) {
  const raw = clean(value, 64);
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return raw;
}

function getAllowedOrigin(origin) {
  if (!origin) return "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/azimut-medline-site-[a-z0-9-]+-lecmedeas-projects\.vercel\.app$/i.test(origin)) return origin;
  return "";
}

function setCors(request, response) {
  const origin = getAllowedOrigin(request.headers.origin || "");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Azimut-Key");
  response.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === "string") return request.body ? JSON.parse(request.body) : {};
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function parseFieldMap() {
  if (!process.env.AMOCRM_FIELD_MAP) return {};
  try {
    return JSON.parse(process.env.AMOCRM_FIELD_MAP);
  } catch (error) {
    throw new Error(`AMOCRM_FIELD_MAP contains invalid JSON: ${error.message}`);
  }
}

function configuredCustomFields(body, fieldMap) {
  const aliases = {
    SOURCE_ID: ["SOURCE_ID", "source", "sourceId"],
    SERVICE_TYPE: ["SERVICE_TYPE", "serviceType", "format"],
    DIRECTION: ["DIRECTION", "direction", "topic"],
    SELECTED_SERVICE: ["SELECTED_SERVICE", "selectedService", "service"],
    SELECTED_PRICE: ["SELECTED_PRICE", "selectedPrice"],
    FORM_NAME: ["FORM_NAME", "formName"],
    PAGE_URL: ["PAGE_URL", "pageUrl"],
    UTM_SOURCE: ["UTM_SOURCE", "utmSource"],
    UTM_MEDIUM: ["UTM_MEDIUM", "utmMedium"],
    UTM_CAMPAIGN: ["UTM_CAMPAIGN", "utmCampaign"],
    UTM_CONTENT: ["UTM_CONTENT", "utmContent"],
    UTM_TERM: ["UTM_TERM", "utmTerm"],
    TELEGRAM_CHAT_ID: ["TELEGRAM_CHAT_ID", "telegramChatId"],
    TELEGRAM_USERNAME: ["TELEGRAM_USERNAME", "telegramUsername"]
  };

  return Object.entries(aliases).flatMap(([logicalName, keys]) => {
    const fieldId = Number(fieldMap[logicalName]);
    if (!fieldId) return [];
    const key = keys.find((candidate) => body[candidate] !== undefined && body[candidate] !== null);
    const value = key ? clean(body[key], 2000) : "";
    if (!value) return [];
    return [{ field_id: fieldId, values: [{ value }] }];
  });
}

function buildNote(body, normalized) {
  const utm = ["source", "medium", "campaign", "content", "term"]
    .map((key) => {
      const value = clean(body[`UTM_${key.toUpperCase()}`] ?? body[`utm${key[0].toUpperCase()}${key.slice(1)}`], 500);
      return value ? `utm_${key}: ${value}` : "";
    })
    .filter(Boolean);

  return [
    `Источник: ${normalized.source || "не указан"}`,
    normalized.service ? `Услуга/направление: ${normalized.service}` : "",
    normalized.formName ? `Форма: ${normalized.formName}` : "",
    normalized.pageUrl ? `Страница: ${normalized.pageUrl}` : "",
    normalized.telegramChatId ? `Telegram chat ID: ${normalized.telegramChatId}` : "",
    normalized.telegramUsername ? `Telegram: @${normalized.telegramUsername.replace(/^@/, "")}` : "",
    ...utm,
    normalized.comment ? `\nКомментарий:\n${normalized.comment}` : ""
  ].filter(Boolean).join("\n").slice(0, MAX_TEXT);
}

function getAmoAccessToken() {
  // Prefer dedicated access token; accept legacy aliases if misnamed on Vercel.
  return (
    clean(process.env.AMOCRM_ACCESS_TOKEN, 5000) ||
    clean(process.env.AMO_ACCESS_TOKEN, 5000) ||
    clean(process.env.AMOCRM_TOKEN, 5000)
  );
}

async function amoRequest(path, options = {}) {
  const baseUrl = clean(process.env.AMOCRM_BASE_URL || "https://lecmedea.amocrm.ru", 300).replace(/\/+$/, "");
  const token = getAmoAccessToken();
  if (!token) {
    throw new Error(
      "AMOCRM_ACCESS_TOKEN is not configured on Vercel (Production). " +
        "Create a long-lived token in amoCRM → Integrations → private integration, then set env AMOCRM_ACCESS_TOKEN."
    );
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.detail || data?.title || data?.message || text || `HTTP ${response.status}`;
    const error = new Error(`amoCRM ${response.status}: ${String(message).slice(0, 800)}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function findOrCreateContact(name, phone, email) {
  if (!phone) return null;
  const search = await amoRequest(`/api/v4/contacts?query=${encodeURIComponent(phone)}&limit=1`, { method: "GET" });
  const existing = search?._embedded?.contacts?.[0];
  if (existing?.id) return existing.id;

  const customFields = [
    { field_code: "PHONE", values: [{ value: phone, enum_code: "WORK" }] },
    ...(email ? [{ field_code: "EMAIL", values: [{ value: email, enum_code: "WORK" }] }] : [])
  ];
  const created = await amoRequest("/api/v4/contacts", {
    method: "POST",
    body: JSON.stringify([{
      name: name || "Пациент из заявки",
      custom_fields_values: customFields
    }])
  });
  return created?._embedded?.contacts?.[0]?.id || null;
}

function routeStatusId(source) {
  const isChat = /chat|telegram|бот|чат/i.test(source);
  const chatStatus = Number(process.env.AMOCRM_CHAT_STATUS_ID || 87274334);
  const siteStatus = Number(process.env.AMOCRM_SITE_STATUS_ID || 87274338);
  return isChat ? chatStatus : siteStatus;
}

async function sendToLeadRegistry(payload) {
  const endpoint = clean(process.env.LEADS_WEBHOOK_URL, 2000);
  const secret = clean(process.env.LEADS_WEBHOOK_SECRET, 2000);
  if (!endpoint || !secret) throw new Error("Lead registry webhook is not configured");

  const registryResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret })
  });
  const data = await registryResponse.json().catch(() => ({}));
  if (!registryResponse.ok || !data.ok) {
    throw new Error(data.error || `Lead registry HTTP ${registryResponse.status}`);
  }
  return data;
}

function registryPayload(body, normalized, crm) {
  return {
    ...body,
    NAME: normalized.name,
    PHONE: normalized.phone,
    EMAIL: normalized.email,
    SOURCE_ID: normalized.source,
    SELECTED_SERVICE: normalized.service,
    COMMENTS: normalized.comment,
    FORM_NAME: normalized.formName,
    PAGE_URL: normalized.pageUrl,
    TELEGRAM_CHAT_ID: normalized.telegramChatId,
    TELEGRAM_USERNAME: normalized.telegramUsername,
    requestId: normalized.requestId,
    submittedAt: normalized.submittedAt,
    platform: /telegram|bot/i.test(normalized.source) ? "Telegram" : "Сайт",
    amoLeadId: crm.leadId || "",
    amoPipelineId: crm.pipelineId || "",
    amoStatusId: crm.statusId || "",
    crmResult: crm.ok ? "created" : "error",
    deliveryResult: "email-and-sheet",
    crmError: crm.error || ""
  };
}

/**
 * Fallback: official amoCRM web form endpoint (no OAuth token required).
 * Form: lecmedea / form_id 1732346 (ФИО, телефон, email, примечание).
 * Override via AMOCRM_FORM_ID / AMOCRM_FORM_HASH if the form is rebuilt.
 */
async function sendViaAmoPublicForm(normalized) {
  const formId = clean(process.env.AMOCRM_FORM_ID || "1732346", 32);
  const hash = clean(process.env.AMOCRM_FORM_HASH || "192d2bf44a2541064146ce8a15f25a01", 64);
  if (!formId || !hash) throw new Error("AMOCRM public form is not configured");

  const note = [
    normalized.comment || "",
    normalized.service ? `Услуга/направление: ${normalized.service}` : "",
    normalized.source ? `Источник: ${normalized.source}` : "",
    normalized.formName ? `Форма: ${normalized.formName}` : "",
    normalized.pageUrl ? `Страница: ${normalized.pageUrl}` : "",
    normalized.telegramChatId ? `TG chat: ${normalized.telegramChatId}` : "",
    normalized.telegramUsername ? `TG: @${normalized.telegramUsername.replace(/^@/, "")}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);

  const body = new URLSearchParams();
  body.set("form_id", formId);
  body.set("hash", hash);
  body.set("user_origin", normalized.pageUrl || "https://azimutclinic.ru/");
  body.set("fields[name_1]", normalized.name || "Пациент с сайта");
  body.set("fields[907951_1][1073443]", normalized.phone);
  if (normalized.email) body.set("fields[907953_1][1073455]", normalized.email);
  body.set("fields[note_2]", note || "Заявка с сайта azimutclinic.ru");

  const response = await fetch("https://forms.amocrm.ru/queue/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Origin: "https://azimutclinic.ru",
      Referer: "https://azimutclinic.ru/"
    },
    body: body.toString()
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok || Number(data.error_code || 0) !== 0) {
    throw new Error(`amo form HTTP ${response.status}: ${String(text).slice(0, 400)}`);
  }
  return { ok: true, mode: "public-form", formId, raw: data };
}

module.exports = async function amoLeadHandler(request, response) {
  setCors(request, response);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false, error: "Используйте POST-запрос." });
  }

  const serverKey = clean(process.env.AMO_LEAD_API_KEY, 500);
  if (serverKey && request.headers["x-azimut-key"] !== serverKey) {
    return sendJson(response, 401, { ok: false, error: "Неверный ключ интеграции." });
  }

  try {
    const body = await readJsonBody(request);
    const normalized = {
      name: clean(body.NAME ?? body.name, 200),
      phone: normalizePhone(body.PHONE ?? body.phone),
      email: clean(body.EMAIL ?? body.email, 200),
      source: clean(body.SOURCE_ID ?? body.source ?? body.sourceId, 200),
      service: clean(body.SELECTED_SERVICE ?? body.SERVICE_TYPE ?? body.DIRECTION ?? body.service, 500),
      comment: clean(body.COMMENTS ?? body.comment ?? body.message, MAX_TEXT),
      formName: clean(body.FORM_NAME ?? body.formName, 200),
      pageUrl: clean(body.PAGE_URL ?? body.pageUrl, 1000),
      telegramChatId: clean(body.TELEGRAM_CHAT_ID ?? body.telegramChatId, 100),
      telegramUsername: clean(body.TELEGRAM_USERNAME ?? body.telegramUsername, 100),
      requestId: clean(body.requestId ?? body.REQUEST_ID, 160) || `azimut-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      submittedAt: clean(body.submittedAt ?? body.createdAt, 100) || new Date().toISOString()
    };

    if (!normalized.phone) {
      return sendJson(response, 400, { ok: false, error: "Укажите телефон для обратной связи." });
    }

    const pipelineId = Number(process.env.AMOCRM_PIPELINE_ID || 11108006);
    const statusId = routeStatusId(normalized.source);
    const fieldMap = parseFieldMap();
    let crm = { ok: false, leadId: null, contactId: null, pipelineId, statusId, error: "" };
    const price = Number(String(body.SELECTED_PRICE ?? body.selectedPrice ?? "").replace(/[^0-9.,]/g, "").replace(",", "."));
    const leadName = `${/chat|telegram|бот|чат/i.test(normalized.source) ? "Чат" : "Сайт"}: ${normalized.name || normalized.phone}`.slice(0, 255);

    try {
      const contactId = await findOrCreateContact(normalized.name, normalized.phone, normalized.email);
      const lead = {
        name: leadName,
        pipeline_id: pipelineId,
        status_id: statusId,
        custom_fields_values: configuredCustomFields(body, fieldMap),
        ...(Number.isFinite(price) && price > 0 ? { price: Math.round(price) } : {}),
        ...(contactId ? { _embedded: { contacts: [{ id: contactId }] } } : {})
      };
      const created = await amoRequest("/api/v4/leads", { method: "POST", body: JSON.stringify([lead]) });
      const leadId = created?._embedded?.leads?.[0]?.id;
      if (!leadId) throw new Error("amoCRM did not return the created lead ID");
      const note = buildNote(body, normalized);
      if (note) {
        await amoRequest(`/api/v4/leads/${leadId}/notes`, {
          method: "POST",
          body: JSON.stringify([{ note_type: "common", params: { text: note } }])
        });
      }
      crm = { ok: true, leadId, contactId, pipelineId, statusId, error: "", mode: "api-v4" };
    } catch (crmError) {
      crm.error = String(crmError.message || crmError).slice(0, 1000);
      crm.status = crmError.status;
      console.error("amoCRM API delivery failed:", crmError);
      // Fallback without OAuth: public amo form (always available if form id/hash correct)
      try {
        const formResult = await sendViaAmoPublicForm(normalized);
        crm = {
          ok: true,
          leadId: null,
          contactId: null,
          pipelineId,
          statusId,
          error: "",
          mode: formResult.mode,
          formId: formResult.formId
        };
        console.info("amoCRM public form fallback succeeded for", normalized.phone);
      } catch (formError) {
        crm.error = `${crm.error} | form-fallback: ${String(formError.message || formError).slice(0, 400)}`;
        console.error("amoCRM public form fallback failed:", formError);
      }
    }

    let registry = { ok: false, error: "" };
    try {
      registry = await sendToLeadRegistry(registryPayload(body, normalized, crm));
    } catch (registryError) {
      registry.error = String(registryError.message || registryError).slice(0, 1000);
      console.error("Lead registry delivery failed:", registryError);
    }

    if (!crm.ok && !registry.ok) {
      return sendJson(response, crm.status && crm.status < 500 ? crm.status : 500, {
        ok: false,
        error: "Не удалось зарегистрировать заявку. Позвоните 8 (925) 112-77-99.",
        code: "ALL_DELIVERIES_FAILED"
      });
    }

    const warnings = [
      crm.mode === "public-form" ? "AMOCRM_VIA_PUBLIC_FORM" : "",
      !crm.ok ? "AMOCRM_ERROR" : "",
      !registry.ok ? "REGISTRY_ERROR" : ""
    ].filter(Boolean);
    if (!crm.ok && /AMOCRM_ACCESS_TOKEN is not configured/i.test(crm.error || "")) {
      warnings.push("AMOCRM_TOKEN_MISSING");
    }

    return sendJson(response, crm.ok ? 201 : 202, {
      ok: true,
      captured: registry.ok,
      leadId: crm.leadId,
      contactId: crm.contactId,
      pipelineId,
      statusId,
      deliveryMode: crm.mode || (crm.ok ? "api-v4" : "none"),
      warnings,
      // Safe diagnostic for operators (no secrets). Helps debug Vercel env / expired token.
      crmError: crm.ok ? undefined : String(crm.error || "unknown amoCRM error").slice(0, 300)
    });
  } catch (error) {
    console.error("amoCRM lead endpoint error:", error);
    return sendJson(response, error.status && error.status < 500 ? error.status : 500, {
      ok: false,
      error: "Не удалось передать заявку в CRM. Позвоните 8 (925) 112-77-99.",
      code: error.status || "AMOCRM_ERROR"
    });
  }
};
