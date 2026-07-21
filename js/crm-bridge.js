(function () {
  const PIPELINES = {
    intake: {
      id: 11108006,
      name: "Неразобранное",
      statuses: {
        chat: { id: 87274334, name: "Обращения из чатов" },
        site: { id: 87274338, name: "Обращения на сайте" },
        ads: { id: 87274342, name: "Лид реклама" },
        partner: { id: 87274346, name: "Лид от партнёра" }
      }
    },
    ambulatory: { id: 11115734, name: "Амбулатория" },
    partners: { id: 11115738, name: "Партнеры" },
    homeVisits: { id: 11115742, name: "Выезды" },
    inpatient: { id: 11115746, name: "Стационар" },
    rehab: { id: 11115750, name: "РЦ" }
  };

  const FIELD_NAMES = {
    patientName: "ФИО Пациента",
    phone: "Телефон",
    serviceType: "Тип услуги",
    direction: "Специализация врача",
    plannedServices: "Планируемые услуги",
    complaint: "Жалобы",
    extraInfo: "Доп информация",
    source: "Источник лида, партнер",
    isSiteForm: "Это ФОС"
  };

  /** Production serverless bridge → amoCRM (Vercel). Site itself is on GitHub Pages. */
  const DEFAULT_ENDPOINT = "https://azimut-medline-site.vercel.app/api/amo-lead";

  function getEndpoint() {
    if (window.AZIMUT_CRM_ENDPOINT) return String(window.AZIMUT_CRM_ENDPOINT).trim();
    const meta = document.querySelector('meta[name="azimut-crm-endpoint"]');
    if (meta?.content) return meta.content.trim();
    const script = document.currentScript || document.querySelector('script[src*="crm-bridge.js"]');
    const fromScript = script?.dataset?.endpoint?.trim();
    if (fromScript) return fromScript;
    return DEFAULT_ENDPOINT;
  }

  function getApiKey() {
    if (window.AZIMUT_CRM_API_KEY) return String(window.AZIMUT_CRM_API_KEY).trim();
    const meta = document.querySelector('meta[name="azimut-crm-key"]');
    return meta?.content?.trim() || "";
  }

  function clean(value) {
    return String(value || "").trim();
  }

  /**
   * Flat payload contract for api/amo-lead.js (production).
   * Nested lead/raw objects are NOT accepted for phone/name.
   */
  function buildFlatLeadPayload(payload, options = {}) {
    const sourceId = clean(payload.SOURCE_ID || options.sourceId || "site");
    return {
      NAME: clean(payload.NAME),
      PHONE: clean(payload.PHONE),
      EMAIL: clean(payload.EMAIL),
      SERVICE_TYPE: clean(payload.SERVICE_TYPE),
      DIRECTION: clean(payload.DIRECTION),
      COMMENTS: clean(payload.COMMENTS),
      SELECTED_SERVICE: clean(payload.SELECTED_SERVICE || payload.SERVICE_TYPE),
      SELECTED_PRICE: clean(payload.SELECTED_PRICE),
      SOURCE_ID: sourceId,
      FORM_NAME: clean(payload.FORM_NAME || options.formName || "site"),
      PAGE_URL: clean(payload.PAGE_URL || location.href),
      UTM_SOURCE: clean(payload.UTM_SOURCE),
      UTM_MEDIUM: clean(payload.UTM_MEDIUM),
      UTM_CAMPAIGN: clean(payload.UTM_CAMPAIGN),
      UTM_CONTENT: clean(payload.UTM_CONTENT),
      UTM_TERM: clean(payload.UTM_TERM),
      TELEGRAM_CHAT_ID: clean(payload.TELEGRAM_CHAT_ID),
      TELEGRAM_USERNAME: clean(payload.TELEGRAM_USERNAME),
      // keep legacy nested shape for debugging/logging only (server ignores if PHONE top-level present)
      legacy: options.includeLegacy === true ? payload : undefined
    };
  }

  /** @deprecated kept for chat/debug callers that still expect nested shape */
  function buildAmoPayload(payload, options = {}) {
    return buildFlatLeadPayload(payload, options);
  }

  async function sendToEndpoint(endpoint, payload) {
    const headers = { "Content-Type": "application/json" };
    const apiKey = getApiKey();
    if (apiKey) headers["X-Azimut-Key"] = apiKey;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `CRM endpoint returned ${response.status}`);
    }
    return data;
  }

  async function sendLead(payload, options = {}) {
    const flat = buildFlatLeadPayload(payload, options);
    const endpoint = getEndpoint();

    if (!endpoint) {
      console.info("amoCRM payload is ready. Configure AZIMUT_CRM_ENDPOINT to send it:", flat);
      return { ok: true, mode: "pending-endpoint", payload: flat };
    }

    if (!flat.PHONE) {
      throw new Error("Укажите телефон для обратной связи.");
    }

    const data = await sendToEndpoint(endpoint, flat);
    const warnings = Array.isArray(data.warnings) ? data.warnings : [];
    const amoFailed = warnings.includes("AMOCRM_ERROR");
    const amoOk =
      Boolean(data.leadId) ||
      data.deliveryMode === "public-form" ||
      data.deliveryMode === "api-v4" ||
      warnings.includes("AMOCRM_VIA_PUBLIC_FORM");
    const mode = data.ok === false
      ? "error"
      : amoFailed && !amoOk
        ? "captured"
        : amoOk
          ? "sent"
          : data.captured
            ? "captured"
            : "sent";

    return {
      ok: Boolean(data.ok !== false),
      mode,
      payload: flat,
      response: data,
      leadId: data.leadId || null
    };
  }

  async function sendChatLead(leadData) {
    return sendLead({
      ...leadData,
      SOURCE_ID: leadData.SOURCE_ID || "AI chatbot",
      FORM_NAME: leadData.FORM_NAME || "ai_chat"
    }, {
      sourceId: leadData.SOURCE_ID || "AI chatbot",
      formName: "ai_chat"
    });
  }

  window.AzimutCRM = {
    pipelines: PIPELINES,
    fieldNames: FIELD_NAMES,
    endpoint: getEndpoint(),
    buildAmoPayload,
    buildFlatLeadPayload,
    sendLead,
    sendChatLead
  };

  window.AzimutBitrix = {
    sendLead,
    sendChatLeadToBitrix24: sendChatLead
  };
})();
