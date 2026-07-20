"use strict";

function clean(value, limit = 2000) {
  return String(value ?? "").replace(/\0/g, "").trim().slice(0, limit);
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function rawBody(request) {
  if (typeof request.body === "string") return request.body;
  if (request.body && typeof request.body === "object") {
    return new URLSearchParams(request.body).toString();
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function registryPost(payload) {
  const endpoint = clean(process.env.LEADS_WEBHOOK_URL, 2000);
  const secret = clean(process.env.LEADS_WEBHOOK_SECRET, 2000);
  if (!endpoint || !secret) throw new Error("Lead registry webhook is not configured");

  const result = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok || !data.ok) throw new Error(data.error || `Registry HTTP ${result.status}`);
  return data;
}

function fieldByLabel(fields, pattern) {
  const match = fields.find(({ label }) => pattern.test(label));
  return clean(match?.value, 2000);
}

function utmFromUrl(value) {
  const source = clean(value, 2000);
  if (!source) return {};
  try {
    const url = new URL(source, "https://azimutclinic.ru");
    return Object.fromEntries(
      ["source", "medium", "campaign", "content", "term"]
        .map((key) => [key, clean(url.searchParams.get(`utm_${key}`), 500)])
        .filter(([, item]) => item)
    );
  } catch {
    return {};
  }
}

function parseEvent(params) {
  const entries = [...params.entries()];
  const leadId = clean(entries.find(([key]) => /^leads\[(add|update|status)\]\[\d+\]\[id\]$/i.test(key))?.[1], 100);
  const unsortedUid = clean(entries.find(([key]) => /^unsorted\[(add|update)\]\[\d+\]\[uid\]$/i.test(key))?.[1], 200);
  const eventType = unsortedUid ? "unsorted" : leadId ? "lead" : "";
  if (!eventType) return null;

  const pick = (pattern, limit = 500) => clean(entries.find(([key]) => pattern.test(key))?.[1], limit);
  const dataRows = new Map();

  for (const [key, value] of entries) {
    const match = key.match(/^unsorted\[(?:add|update)\]\[\d+\]\[source_data\]\[data\]\[([^\]]+)\]\[(name|value)\]$/i);
    if (!match) continue;
    const row = dataRows.get(match[1]) || { label: "", value: "" };
    row[match[2].toLowerCase() === "name" ? "label" : "value"] = clean(value, 4000);
    dataRows.set(match[1], row);
  }

  const fields = [...dataRows.values()].filter((item) => item.label || item.value);
  const direct = (name) => pick(new RegExp(`^unsorted\\[(?:add|update)\\]\\[\\d+\\]\\[source_data\\]\\[data\\]\\[${name}\\]$`, "i"), 2000);
  const timestamp = Number(pick(/^(?:leads\[(?:add|update|status)\]|unsorted\[(?:add|update)\])\[\d+\]\[(?:created_at|date_create)\]$/i, 30));
  const createdAt = Number.isFinite(timestamp) && timestamp > 0
    ? new Date(timestamp * 1000).toISOString()
    : new Date().toISOString();

  const name = direct("name") || fieldByLabel(fields, /^(фио|имя|name|full name)$/i);
  const phone = direct("phone") || fieldByLabel(fields, /(телефон|phone|мобил)/i);
  const email = direct("email") || fieldByLabel(fields, /e-?mail|почт/i);
  const comment = direct("message") || fieldByLabel(fields, /(примеч|коммент|сообщен|описан)/i);
  const service = fieldByLabel(fields, /(услуг|направлен|формат|программ)/i);
  const sourceUrl =
    pick(/^unsorted\[(?:add|update)\]\[\d+\]\[source_data\]\[(?:from|url)\]$/i, 1000) ||
    pick(/^unsorted\[(?:add|update)\]\[\d+\]\[source_data\]\[origin\]\[(?:referer|url)\]$/i, 1000);
  const sourceName = pick(/^unsorted\[(?:add|update)\]\[\d+\]\[source\]$/i, 300) || "amoCRM";
  const pipelineId = pick(/^(?:leads\[(?:add|update|status)\]|unsorted\[(?:add|update)\])\[\d+\]\[pipeline_id\]$/i, 100);
  const statusId = pick(/^(?:leads\[(?:add|update|status)\]|unsorted\[(?:add|update)\])\[\d+\]\[status_id\]$/i, 100);
  const owner = pick(/^(?:leads\[(?:add|update|status)\]|unsorted\[(?:add|update)\])\[\d+\]\[responsible_user_id\]$/i, 100);
  const formId = pick(/^unsorted\[(?:add|update)\]\[\d+\]\[source_data\]\[form_id\]$/i, 200);

  const urlUtm = utmFromUrl(sourceUrl);
  const utm = {};
  for (const key of ["source", "medium", "campaign", "content", "term"]) {
    utm[`UTM_${key.toUpperCase()}`] =
      fieldByLabel(fields, new RegExp(`utm[ _-]?${key}`, "i")) || urlUtm[key] || "";
  }

  return {
    requestId: `amo-${unsortedUid || leadId}-${eventType}`,
    submittedAt: createdAt,
    platform: "amoCRM",
    SOURCE_ID: sourceName,
    NAME: name,
    PHONE: phone,
    EMAIL: email,
    SELECTED_SERVICE: service,
    COMMENTS: comment || `Событие ${eventType} получено из amoCRM`,
    FORM_NAME: formId ? `amo-form-${formId}` : "amo-webhook",
    PAGE_URL: sourceUrl,
    amoLeadId: leadId,
    amoPipelineId: pipelineId,
    amoStatusId: statusId,
    // Keep this ASCII-safe because this file is also deployed as a standalone
    // Vercel function and must match the Google Sheet validation value exactly.
    status: "\u041d\u043e\u0432\u0430\u044f",
    crmResult: "webhook",
    deliveryResult: "email-and-sheet",
    owner,
    ...utm
  };
}

module.exports = async function amoWebhook(request, response) {
  if (request.method === "GET" || request.method === "HEAD") {
    if (request.method === "HEAD") {
      response.statusCode = 204;
      return response.end();
    }
    return sendJson(response, 200, { ok: true, service: "amo-webhook" });
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false });
  }

  const configuredKey = clean(process.env.AMO_WEBHOOK_KEY, 1000);
  const providedKey = clean(request.query?.key, 1000);
  if (!configuredKey || providedKey !== configuredKey) return sendJson(response, 401, { ok: false });

  try {
    const payload = parseEvent(new URLSearchParams(await rawBody(request)));
    if (!payload) return sendJson(response, 202, { ok: true, ignored: true });
    const registry = await registryPost(payload);
    return sendJson(response, 200, { ok: true, duplicate: Boolean(registry.duplicate) });
  } catch (error) {
    console.error("amoCRM webhook delivery failed:", error);
    return sendJson(response, 500, { ok: false });
  }
};

module.exports.parseEvent = parseEvent;
