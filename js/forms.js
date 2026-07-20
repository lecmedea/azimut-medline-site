(function () {
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const HIDDEN_NAMES = new Set([
    ...UTM_KEYS,
    "page_url",
    "form_name",
    "selected_service",
    "selected_price"
  ]);

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

  /** Visible user-facing controls that must be filled before submit. */
  function getRequiredFields(form) {
    return [...form.elements].filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (!el.name || el.disabled) return false;
      if (HIDDEN_NAMES.has(el.name)) return false;
      if (el.type === "hidden" || el.type === "submit" || el.type === "button" || el.type === "reset") {
        return false;
      }
      // radio groups: only the first radio is tracked for "has selection"
      if (el.type === "radio") {
        return form.querySelector(`input[type="radio"][name="${CSS.escape(el.name)}"]`) === el;
      }
      return true;
    });
  }

  function ensureSelectPlaceholder(select) {
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.dataset.placeholderReady === "1") return;
    const hasEmpty = [...select.options].some((opt) => opt.value === "" && !opt.disabled);
    if (!hasEmpty) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Выберите…";
      select.insertBefore(opt, select.firstChild);
    }
    // Force empty choice until the user picks a real option
    if (!select.value || select.selectedIndex === 0) {
      select.value = "";
      select.selectedIndex = 0;
    }
    select.dataset.placeholderReady = "1";
    select.required = true;
  }

  function isFieldFilled(el, form) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "radio") {
      return Boolean(form.querySelector(`input[type="radio"][name="${CSS.escape(el.name)}"]:checked`));
    }
    if (el instanceof HTMLSelectElement) {
      return String(el.value || "").trim().length > 0;
    }
    return String(el.value || "").trim().length > 0;
  }

  function syncSubmitState(form) {
    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submit) return;

    const fields = getRequiredFields(form);
    fields.forEach((el) => {
      if (el instanceof HTMLSelectElement) ensureSelectPlaceholder(el);
      el.required = true;
    });

    const complete = fields.every((el) => isFieldFilled(el, form));
    submit.disabled = !complete;
    submit.setAttribute("aria-disabled", complete ? "false" : "true");
    submit.classList.toggle("is-disabled", !complete);
    if (!complete) {
      submit.title = "Заполните все поля формы, чтобы отправить заявку";
    } else {
      submit.removeAttribute("title");
    }
  }

  function bindRequiredForm(form) {
    ensureHiddenFields(form);
    getRequiredFields(form).forEach((el) => {
      if (el instanceof HTMLSelectElement) ensureSelectPlaceholder(el);
      el.required = true;
    });
    syncSubmitState(form);

    const onChange = () => syncSubmitState(form);
    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    form.addEventListener("reset", () => {
      // After native reset, re-apply placeholders and lock submit
      requestAnimationFrame(() => {
        getRequiredFields(form).forEach((el) => {
          if (el instanceof HTMLSelectElement) {
            el.dataset.placeholderReady = "0";
            ensureSelectPlaceholder(el);
          }
        });
        syncSubmitState(form);
      });
    });
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
    const crm = window.AzimutCRM || window.AzimutBitrix;
    const result = await (crm?.sendLead ? crm.sendLead(payload) : Promise.resolve({ mode: "pending-endpoint" }));
    status.textContent = result.mode === "sent"
      ? "Заявка отправлена. Мы свяжемся с вами в ближайшее время."
      : "Заявка подготовлена. Если вопрос срочный, пожалуйста, позвоните в центр.";
    form.reset();
    syncSubmitState(form);
  }

  async function handlePayment(form, status) {
    const order = serialize(form);
    await (window.AzimutPayment ? window.AzimutPayment.createPayment(order) : Promise.resolve());
    status.textContent = "Заявка на оплату принята. Администратор согласует сумму и отправит ссылку после подтверждения записи.";
    form.reset();
    syncSubmitState(form);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-form]").forEach((form) => {
      bindRequiredForm(form);
      const status = form.querySelector(".form-status");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        syncSubmitState(form);
        const submit = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submit?.disabled || !form.checkValidity()) {
          form.reportValidity();
          return;
        }
        if (status) status.textContent = "Обрабатываем...";
        try {
          if (form.dataset.form === "payment") {
            await handlePayment(form, status || { textContent: "" });
          } else {
            await handleLead(form, status || { textContent: "" });
          }
        } catch (error) {
          console.error(error);
          if (status) status.textContent = "Не удалось обработать форму. Попробуйте позвонить в центр.";
        } finally {
          syncSubmitState(form);
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
        syncSubmitState(form);
      });
    });
  });
})();
