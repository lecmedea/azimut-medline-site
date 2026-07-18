(function () {
  "use strict";

  const DEFAULT_PRODUCTION_ENDPOINT = "https://azimut-medline-site.vercel.app/api/amo-lead";

  function endpoint() {
    const meta = document.querySelector('meta[name="azimut-crm-endpoint"]')?.content?.trim();
    const script = document.currentScript?.dataset?.endpoint?.trim();
    if (window.AZIMUT_CRM_ENDPOINT) return String(window.AZIMUT_CRM_ENDPOINT).trim();
    if (meta) return meta;
    if (script) return script;
    if (/localhost|127\.0\.0\.1|vercel\.app$/i.test(location.hostname)) return "/api/amo-lead";
    return DEFAULT_PRODUCTION_ENDPOINT;
  }

  function requestId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `azimut-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalize(payload, source) {
    return {
      ...payload,
      SOURCE_ID: payload.SOURCE_ID || source,
      PAGE_URL: payload.PAGE_URL || location.href,
      FORM_NAME: payload.FORM_NAME || source,
      requestId: payload.requestId || requestId(),
      submittedAt: new Date().toISOString()
    };
  }

  async function send(payload, source) {
    const body = normalize(payload || {}, source);
    if (!String(body.PHONE || body.phone || "").trim()) {
      throw new Error("Укажите телефон для обратной связи.");
    }
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось передать заявку в amoCRM.");
    }
    window.dispatchEvent(new CustomEvent("azimut:crm-success", { detail: result }));
    return result;
  }

  window.AzimutCRM = {
    endpoint,
    sendLead(payload) {
      return send(payload, "site");
    },
    sendChatLead(payload) {
      return send(payload, payload?.SOURCE_ID || "AI chatbot");
    }
  };
})();
