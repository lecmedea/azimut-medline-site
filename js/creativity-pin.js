/**
 * PIN-gate only for «Наше творчество» (team preview).
 * Code: 2206. Independent of public access-gate.js.
 */
(function () {
  const PIN = "2206";
  const STORAGE_KEY = "azimut_creativity_pin_until";
  const SESSION_MS = 4 * 60 * 60 * 1000; // 4 hours for team

  function getUntil() {
    try {
      return Number(sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY) || 0);
    } catch {
      return 0;
    }
  }

  function setUntil(ts) {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(ts));
      localStorage.setItem(STORAGE_KEY, String(ts));
    } catch {
      /* private mode */
    }
  }

  function hasAccess() {
    return getUntil() > Date.now();
  }

  function unlock() {
    setUntil(Date.now() + SESSION_MS);
    document.documentElement.classList.remove("creativity-pin-locked");
    document.querySelector(".creativity-pin-gate")?.remove();
  }

  if (hasAccess()) return;

  document.documentElement.classList.add("creativity-pin-locked");

  function render() {
    if (document.querySelector(".creativity-pin-gate")) return;
    const gate = document.createElement("section");
    gate.className = "creativity-pin-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "creativity-pin-title");
    gate.innerHTML = `
      <div class="creativity-pin-panel">
        <img class="creativity-pin-logo" src="assets/logo-header-transparent.png" alt="Азимут Клиник" width="160" height="48">
        <p class="creativity-pin-eyebrow">Раздел в подготовке</p>
        <h1 class="creativity-pin-title" id="creativity-pin-title">Наше творчество</h1>
        <p class="creativity-pin-text">Пока раздел доступен только команде клиники. Введите код доступа.</p>
        <form class="creativity-pin-form" autocomplete="off">
          <label class="creativity-pin-label" for="creativity-pin-input">Код</label>
          <input id="creativity-pin-input" class="creativity-pin-input" type="password" inputmode="numeric" maxlength="8" placeholder="••••" required>
          <p class="creativity-pin-error" data-creativity-pin-error hidden>Неверный код</p>
          <button class="button button-primary creativity-pin-submit" type="submit">Войти</button>
        </form>
        <a class="creativity-pin-back" href="blog.html">← К блогу</a>
      </div>
    `;
    document.body.appendChild(gate);

    const form = gate.querySelector(".creativity-pin-form");
    const input = gate.querySelector("#creativity-pin-input");
    const err = gate.querySelector("[data-creativity-pin-error]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (String(input.value || "").trim() === PIN) {
        unlock();
        return;
      }
      err.hidden = false;
      input.value = "";
      input.focus();
    });
    setTimeout(() => input?.focus(), 80);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
