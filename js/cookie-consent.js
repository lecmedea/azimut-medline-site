(function () {
  const STORAGE_KEY = "azimut_cookie_consent_v1";
  const PRIVACY_HREF = "privacy.html";

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveConsent(choice) {
    const payload = {
      choice,
      at: new Date().toISOString(),
      version: 1
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      /* ignore quota */
    }
    window.dispatchEvent(new CustomEvent("azimut:cookie-consent", { detail: payload }));
    return payload;
  }

  function removeBanner() {
    document.getElementById("azimut-cookie-banner")?.remove();
    document.documentElement.classList.remove("cookie-banner-open");
  }

  function buildBanner() {
    const root = document.createElement("div");
    root.id = "azimut-cookie-banner";
    root.className = "azimut-cookie-banner";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "azimut-cookie-title");
    root.innerHTML = `
      <div class="azimut-cookie-panel">
        <h2 id="azimut-cookie-title" class="azimut-cookie-title">Для начала выберите вариант использования файлов cookie 🍪</h2>
        <p class="azimut-cookie-text">
          Мы используем основные файлы cookie для надлежащей работы <strong>Азимут Клиник</strong>.
          Предоставьте своё разрешение на использование файлов cookie, которые помогают улучшить работу
          с платформой, настраивают показ нашей и сторонней рекламы, а также позволяют нам анализировать
          эффективность веб-сайта. Подробные сведения об этих файлах см. в нашей
          <a href="${PRIVACY_HREF}">политике использования файлов cookie</a>.
        </p>
        <div class="azimut-cookie-actions">
          <button type="button" class="azimut-cookie-btn azimut-cookie-btn--primary" data-cookie-choice="all">
            Разрешить использование всех файлов cookie
          </button>
          <button type="button" class="azimut-cookie-btn azimut-cookie-btn--ghost" data-cookie-choice="reject">
            Отклонить все файлы cookie
          </button>
          <button type="button" class="azimut-cookie-btn azimut-cookie-btn--link" data-cookie-choice="manage">
            Управлять файлами cookie
          </button>
        </div>
        <div class="azimut-cookie-manage" id="azimut-cookie-manage" hidden>
          <label class="azimut-cookie-check">
            <input type="checkbox" checked disabled>
            <span>Необходимые cookie — всегда включены (работа форм, безопасность, согласие)</span>
          </label>
          <label class="azimut-cookie-check">
            <input type="checkbox" id="azimut-cookie-analytics" checked>
            <span>Аналитические cookie — помогают понимать, как используют сайт</span>
          </label>
          <label class="azimut-cookie-check">
            <input type="checkbox" id="azimut-cookie-marketing">
            <span>Маркетинговые cookie — персонализация и реклама</span>
          </label>
          <button type="button" class="azimut-cookie-btn azimut-cookie-btn--primary" data-cookie-choice="save">
            Сохранить настройки
          </button>
        </div>
      </div>
    `;

    root.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-cookie-choice]");
      if (!btn) return;
      const choice = btn.dataset.cookieChoice;

      if (choice === "manage") {
        const panel = root.querySelector("#azimut-cookie-manage");
        if (panel) panel.hidden = !panel.hidden;
        return;
      }

      if (choice === "all") {
        saveConsent({ necessary: true, analytics: true, marketing: true, mode: "all" });
        removeBanner();
        return;
      }

      if (choice === "reject") {
        saveConsent({ necessary: true, analytics: false, marketing: false, mode: "reject" });
        removeBanner();
        return;
      }

      if (choice === "save") {
        const analytics = Boolean(root.querySelector("#azimut-cookie-analytics")?.checked);
        const marketing = Boolean(root.querySelector("#azimut-cookie-marketing")?.checked);
        saveConsent({
          necessary: true,
          analytics,
          marketing,
          mode: "custom"
        });
        removeBanner();
      }
    });

    return root;
  }

  function init() {
    if (getConsent()) return;
    document.documentElement.classList.add("cookie-banner-open");
    document.body.appendChild(buildBanner());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.AzimutCookieConsent = { getConsent, saveConsent };
})();
