(function () {
  const PIN = "2206";
  const SESSION_MS = 2 * 60 * 60 * 1000;
  const STORAGE_KEY = "azimut_pin_access_until";

  const getAccessUntil = () => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) || 0);
    } catch {
      return 0;
    }
  };

  const setAccessUntil = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // If storage is blocked, keep access only for the current page load.
    }
  };

  const clearAccess = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private modes.
    }
  };

  const hasAccess = () => getAccessUntil() > Date.now();

  if (!hasAccess()) {
    document.documentElement.classList.add("pin-gate-locked");
  }

  function scheduleExpiry() {
    const delay = getAccessUntil() - Date.now();
    if (delay <= 0) return;
    window.setTimeout(() => {
      clearAccess();
      document.documentElement.classList.add("pin-gate-locked");
      renderGate();
    }, Math.min(delay, SESSION_MS));
  }

  function unlock(gate) {
    setAccessUntil(Date.now() + SESSION_MS);
    document.documentElement.classList.remove("pin-gate-locked");
    gate.remove();
    scheduleExpiry();
  }

  function renderGate() {
    if (!document.documentElement.classList.contains("pin-gate-locked")) {
      scheduleExpiry();
      return;
    }
    if (document.querySelector(".pin-gate")) return;

    const gate = document.createElement("section");
    gate.className = "pin-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "pin-gate-title");
    gate.innerHTML = `
      <div class="pin-gate-panel">
        <img class="pin-gate-logo" src="assets/logo-header-transparent.png" alt="Азимут Клиник">
        <h1 class="pin-gate-title" id="pin-gate-title">Закрытый просмотр</h1>
        <p class="pin-gate-text">Сайт временно открыт только для команды. Введите PIN-код, чтобы продолжить.</p>
        <form class="pin-gate-form">
          <label class="visually-hidden" for="pin-gate-input">PIN-код</label>
          <input class="pin-gate-input" id="pin-gate-input" name="pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="2206" aria-describedby="pin-gate-error">
          <button class="pin-gate-button" type="submit">Войти на сайт</button>
          <p class="pin-gate-error" id="pin-gate-error" aria-live="polite"></p>
        </form>
      </div>
    `;

    document.body.append(gate);
    const form = gate.querySelector(".pin-gate-form");
    const input = gate.querySelector(".pin-gate-input");
    const error = gate.querySelector(".pin-gate-error");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value.trim() === PIN) {
        unlock(gate);
        return;
      }
      error.textContent = "Неверный PIN-код.";
      input.value = "";
      input.focus();
    });

    window.setTimeout(() => input.focus(), 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderGate);
  } else {
    renderGate();
  }
})();
