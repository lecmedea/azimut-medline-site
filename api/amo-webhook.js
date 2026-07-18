"use strict";

function clean(value, limit = 1000) {
  return String(value ?? "").replace(/\0/g, "").trim().slice(0, limit);
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function rawBody(request) {
  if (typeof request.body === "string") return request.body;
  if (request.body && typeof request.body === "object") return new URLSearchParams(request.body).toString();
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function amoGet(path) {
  const base = clean(process.env.AMOCRM_BASE_URL || "https://lecmedea.amocrm.ru", 500).replace(/\/+$/, "");
  const token = clean(process.env.AMOCRM_ACCESS_TOKEN, 5000);
  if (!token) throw new Error("AMOCRM_ACCESS_TOKEN is not configured");
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`amoCRM HTTP ${response.status}`);
  return data;
}

function customField(entity, code) {
  const field = (entity?.custom_fields_values || []).find((item) => item.field_code === code);
  return clean(field?.values?.[0]?.value, 500);
}

function firstParam(params, pattern) {
  for (const [key, value] of params.entries()) {
    if (pattern.test(key)) return clean(value, 500);
  }
  return "";
}

async function registryPost(payload) {
  const endpoint = clean(process.env.LEADS_WEBHOOK_URL, 2000);
  const secret = clean(process.env.LEADS_WEBHOOK_SECRET, 2000);
  if (!endpoint || !secret) throw new Error("Lead registry webhook is not configured");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || `Registry HTTP ${response.status}`);
  return data;
}

module.exports = async function amoWebhook(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false });
  }

  const configuredKey = clean(process.env.AMO_WEBHOOK_KEY, 1000);
  const providedKey = clean(request.query?.key, 1000);
  if (!configuredKey || providedKey !== configuredKey) return sendJson(response, 401, { ok: false });

  try {
    const params = new URLSearchParams(await rawBody(request));
    const leadId = firstParam(params, /^leads\[(add|status|update)\]\[\d+\]\[id\]$/i);
    if (!leadId) return sendJson(response, 202, { ok: true, ignored: true });

    const lead = await amoGet(`/api/v4/leads/${encodeURIComponent(leadId)}?with=contacts`);
    const contactId = lead?._embedded?.contacts?.[0]?.id;
    const contact = contactId ? await amoGet(`/api/v4/contacts/${contactId}`) : {};
    const createdAt = lead.created_at ? new Date(Number(lead.created_at) * 1000).toISOString() : new Date().toISOString();
    const registry = await registryPost({
      requestId: `amo-${leadId}`,
      submittedAt: createdAt,
      platform: "amoCRM",
      SOURCE_ID: "amoCRM",
      NAME: contact.name || lead.name || "",
      PHONE: customField(contact, "PHONE"),
      EMAIL: customField(contact, "EMAIL"),
      SELECTED_SERVICE: lead.name || "",
      COMMENTS: "Заявка создана или обновлена непосредственно в amoCRM",
      FORM_NAME: "amo-webhook",
      amoLeadId: String(lead.id || leadId),
      amoPipelineId: String(lead.pipeline_id || ""),
      amoStatusId: String(lead.status_id || ""),
      status: "Новая",
      crmResult: "webhook",
      deliveryResult: "email-and-sheet",
      owner: String(lead.responsible_user_id || "")
    });
    return sendJson(response, 200, { ok: true, duplicate: Boolean(registry.duplicate) });
  } catch (error) {
    console.error("amoCRM webhook delivery failed:", error);
    return sendJson(response, 500, { ok: false });
  }
};
