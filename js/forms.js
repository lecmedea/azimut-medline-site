(function () {
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function serialize(form) {
    ensureHiddenFields(form);
    return Object.fromEntries(new FormData(form).entries());
  }

  function ensureHiddenFields(form) {
    [...UTM_KEYS, "page_url", "form_name", "selected_service", "selected_price"].forEach((name) => {
      if (!form.elements[name]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
    });
    const params = new URLSearchParams(location.search);
    UTM_KEYS.forEach((name) => {
      form.elements[name].value = params.get(name) || sessionStorage.getItem(name) || "";
      if (params.get(name)) sessionStorage.setItem(name, params.get(name));
    });
    form.elements.page_url.value = location.href;
    form.elements.form_name.value = form.dataset.formName || form.dataset.form || "lead";
  }

  function normalizeLead(form) {
    const raw = serialize(form);
    return {
      NAME: raw.name || "",
      PHONE: raw.phone || "",
      SERVICE_TYPE: raw.service_type || raw.format || "",
      DIRECTION: raw.direction || raw.topic || "",
      COMMENTS: raw.message || raw.comments || "",
      SELECTED_SERVICE: raw.selected_service || raw.service || "",
      SELECTED_PRICE: raw.selected_price || raw.amount || "",
      SOURCE_ID: "site",
      UTM_SOURCE: raw.utm_source || "",
      UTM_MEDIUM: raw.utm_medium || "",
      UTM_CAMPAIGN: raw.utm_campaign || "",
      UTM_CONTENT: raw.utm_content || "",
      UTM_TERM: raw.utm_term || "",
      FORM_NAME: raw.form_name || "",
      PAGE_URL: raw.page_url || location.href
    };
  }

  async function handleLead(form, status) {
    const payload = normalizeLead(form);
    await (window.AzimutBitrix ? window.AzimutBitrix.sendLead(payload) : Promise.resolve());
    status.textContent = "Заявка подготовлена. В рабочей интеграции она будет отправлена в CRM.";
    form.reset();
  }

  async function handlePayment(form, status) {
    const order = serialize(form);
    await (window.AzimutPayment ? window.AzimutPayment.createPayment(order) : Promise.resolve());
    status.textContent = "Заявка на оплату принята. Администратор согласует сумму и отправит ссылку после подтверждения записи.";
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-form]").forEach((form) => {
      ensureHiddenFields(form);
      const status = form.querySelector(".form-status");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        status.textContent = "Обрабатываем...";
        try {
          if (form.dataset.form === "payment") {
            await handlePayment(form, status);
          } else {
            await handleLead(form, status);
          }
        } catch (error) {
          console.error(error);
          status.textContent = "Не удалось обработать форму. Попробуйте позвонить в центр.";
        }
      });
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-select-service]");
      if (!trigger) return;
      const service = trigger.dataset.selectService || "";
      const price = trigger.dataset.selectPrice || "";
      document.querySelectorAll("form[data-form]").forEach((form) => {
        ensureHiddenFields(form);
        form.elements.selected_service.value = service;
        form.elements.selected_price.value = price;
        const visibleService = form.elements.service || form.elements.topic;
        if (visibleService && service) visibleService.value = service;
      });
    });
  });
})();
