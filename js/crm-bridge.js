(function () {
  "use strict";

  const FORM_PAGE = "https://forms.amocrm.ru/rztvtdc";
  const FORM_SCRIPT = "https://forms.amocrm.ru/forms/assets/js/amoforms.js?1784405709";
  const FORM_BOOTSTRAP = "!function(a,m,o,c,r,m){a[o+c]=a[o+c]||{setMeta:function(p){this.params=(this.params||[]).concat([p])}},a[o+r]=a[o+r]||function(f){a[o+r].f=(a[o+r].f||[]).concat([f])},a[o+r]({id:\"1732346\",hash:\"192d2bf44a2541064146ce8a15f25a01\",locale:\"ru\"}),a[o+m]=a[o+m]||function(f,k){a[o+m].f=(a[o+m].f||[]).concat([[f,k]])}}(window,0,\"amo_forms_\",\"params\",\"load\",\"loaded\");";

  function officialFormUrl() {
    const query = new URLSearchParams(location.search);
    query.set("referrer", location.href);
    return `${FORM_PAGE}?${query.toString()}`;
  }

  function privacyNotice() {
    const note = document.createElement("p");
    note.className = "amo-native-form__privacy";
    note.innerHTML = 'Нажимая «Записаться», вы соглашаетесь с <a href="personal-data.html">обработкой персональных данных</a> и <a href="privacy.html">политикой конфиденциальности</a>.';
    return note;
  }

  function mountOfficialForm(target) {
    const shell = document.createElement("div");
    shell.className = "contact-form amo-native-form";
    if (target.id) shell.id = target.id;
    shell.setAttribute("data-amo-native-form", "1732346");

    const bootstrap = document.createElement("script");
    bootstrap.textContent = FORM_BOOTSTRAP;
    const loader = document.createElement("script");
    loader.id = "amoforms_script_1732346";
    loader.async = true;
    loader.charset = "utf-8";
    loader.src = FORM_SCRIPT;

    shell.append(bootstrap, loader, privacyNotice());
    target.replaceWith(shell);
  }

  function replaceExtraForm(target) {
    const shell = document.createElement("div");
    shell.className = "contact-form amo-native-form amo-native-form--link";
    shell.innerHTML = `<h3>Оставить заявку</h3><p>Единая защищённая форма создаёт обращение сразу в amoCRM.</p><a class="button button-primary" href="${officialFormUrl()}" target="_blank" rel="noopener">Открыть форму записи</a>`;
    shell.append(privacyNotice());
    target.replaceWith(shell);
  }

  function mountForms() {
    const forms = [...document.querySelectorAll('form[data-form="lead"]')];
    forms.forEach((form, index) => index === 0 ? mountOfficialForm(form) : replaceExtraForm(form));
  }

  function openForm() {
    const modalButton = document.querySelector('[data-modal-open="appointment-modal"]');
    if (modalButton) {
      modalButton.click();
      return true;
    }
    location.href = location.pathname.endsWith("contacts.html") ? "#appointment" : "contacts.html#appointment";
    return true;
  }

  document.addEventListener("DOMContentLoaded", mountForms);

  window.AzimutCRM = {
    formUrl: officialFormUrl,
    openForm,
    sendLead() {
      openForm();
      return Promise.resolve({ ok: true, routedToOfficialForm: true });
    },
    sendChatLead(payload) {
      try { sessionStorage.setItem("azimut-chat-lead-draft", JSON.stringify(payload || {})); } catch (_) {}
      openForm();
      return Promise.resolve({ ok: true, routedToOfficialForm: true });
    }
  };
})();
