(function () {
  const STORAGE_KEY = "azimut-ai-chat-history";
  const MAX_HISTORY = 12;
  const MAX_MESSAGE_LENGTH = 2000;

  const quickActions = [
    ["Узнать стоимость", "Расскажите, пожалуйста, сколько стоят основные услуги"],
    ["Вызвать специалиста", "Хочу вызвать специалиста на дом"],
    ["Онлайн-консультация", "Хочу записаться на онлайн-консультацию"],
    ["Позвонить", "Подскажите, как позвонить в центр"]
  ];

  const config = window.AZIMUT_CHAT_CONFIG || {};
  const agentName = config.agentName || "Филипп Филипович";
  const agentTitle = config.agentTitle || agentName;
  const fallbackPhone = config.fallbackPhone || "8 (925) 112 77 99";
  const fallbackGreeting = `Здравствуйте. Я ${agentName}, виртуальный помощник Азимут Клиник. Могу подсказать по услугам, ценам, форматам помощи и записи. В экстренной ситуации звоните 112 или 103.`;

  let history = loadHistory();
  let isOpen = false;
  let isSending = false;

  function loadHistory() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .slice(-MAX_HISTORY);
    } catch {
      return [];
    }
  }

  function saveHistory() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  }

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].reduce((acc, key) => {
      const value = params.get(key) || sessionStorage.getItem(key) || "";
      if (value) {
        acc[key.toUpperCase()] = value;
        sessionStorage.setItem(key, value);
      }
      return acc;
    }, {});
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMessage(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function findPhone(text) {
    const match = text.match(/(?:\+7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]?\d{2}[\s-]?\d{2}/);
    return match ? match[0].trim() : "";
  }

  function buildChatLead(phone, message) {
    const utm = getUtmParams();
    return {
      NAME: "Пользователь из AI-чата",
      PHONE: phone,
      COMMENTS: [message, ...history.slice(-6).map((item) => `${item.role}: ${item.content}`)].join("\n"),
      SOURCE_ID: "AI chatbot",
      PAGE_URL: window.location.href,
      UTM_SOURCE: utm.UTM_SOURCE || "",
      UTM_MEDIUM: utm.UTM_MEDIUM || "",
      UTM_CAMPAIGN: utm.UTM_CAMPAIGN || "",
      UTM_CONTENT: utm.UTM_CONTENT || "",
      UTM_TERM: utm.UTM_TERM || ""
    };
  }

  function maybePrepareLead(message) {
    const phone = findPhone(message);
    if (!phone) return;
    const leadData = buildChatLead(phone, message);
    if (window.AzimutBitrix?.sendChatLeadToBitrix24) {
      window.AzimutBitrix.sendChatLeadToBitrix24(leadData);
    } else {
      console.log("Здесь будет отправка лида из AI-чата в Битрикс24", leadData);
    }
  }

  function resolveChatEndpoint() {
    const explicit = (config.endpoint || "").trim();
    if (explicit) return explicit;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "/api/chat";
    return "";
  }

  function createWidget() {
    const widget = document.createElement("section");
    widget.className = "ai-chatbot";
    widget.setAttribute("aria-label", agentName + " — виртуальный помощник Азимут Клиник");
    widget.innerHTML = `
      <button class="ai-chatbot-toggle" type="button" aria-expanded="false" aria-controls="ai-chatbot-panel" title="${escapeHtml(agentName)}">
        <span class="ai-chatbot-toggle-icon" aria-hidden="true"><img src="assets/icons/philipp-filippovich-avatar.jpg" width="34" height="34" alt=""></span>
        <span class="ai-chatbot-toggle-label">${escapeHtml(agentName)}</span>
      </button>
      <div class="ai-chatbot-panel" id="ai-chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="ai-chatbot-title">
        <div class="ai-chatbot-orbit" aria-hidden="true"></div>
        <header class="ai-chatbot-header">
          <div>
            <p class="ai-chatbot-kicker">Круглосуточно</p>
            <h2 id="ai-chatbot-title">${escapeHtml(agentTitle)}</h2>
            <p class="ai-chatbot-agent">${escapeHtml(agentName)}</p>
            <p>Помогу сориентироваться по услугам, ценам и записи</p>
          </div>
          <div class="ai-chatbot-actions">
            <button class="ai-chatbot-icon-btn" type="button" data-chat-close aria-label="Закрыть чат">×</button>
          </div>
        </header>
        <div class="ai-chatbot-warning">${escapeHtml(agentName)} не заменяет консультацию врача. В экстренной ситуации звоните 112 или 103.</div>
        <div class="ai-chatbot-messages" data-chat-messages aria-live="polite"></div>
        <div class="ai-chatbot-quick" aria-label="Быстрые вопросы">
          ${quickActions.map(([label, message]) => `<button type="button" data-chat-quick="${escapeHtml(message)}">${escapeHtml(label)}</button>`).join("")}
        </div>
        <form class="ai-chatbot-form" data-chat-form>
          <label class="visually-hidden" for="ai-chatbot-input">Сообщение ${escapeHtml(agentName)}</label>
          <textarea id="ai-chatbot-input" name="message" rows="1" maxlength="${MAX_MESSAGE_LENGTH}" placeholder="Напишите вопрос"></textarea>
          <button class="ai-chatbot-send" type="submit">Отправить</button>
        </form>
        <p class="ai-chatbot-status" data-chat-status aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(widget);
    return widget;
  }

  function renderMessages(root) {
    const messages = root.querySelector("[data-chat-messages]");
    const items = history.length ? history : [{ role: "assistant", content: fallbackGreeting }];
    messages.innerHTML = items.map((item) => `
      <article class="ai-chatbot-message is-${item.role}">
        <div>${formatMessage(item.content)}</div>
      </article>
    `).join("");
    messages.scrollTop = messages.scrollHeight;
  }

  function setOpen(root, nextOpen) {
    isOpen = nextOpen;
    root.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("ai-chatbot-open", isOpen);
    root.querySelector(".ai-chatbot-toggle").setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      setTimeout(() => root.querySelector("textarea")?.focus(), 140);
    }
  }

  function setSending(root, nextSending) {
    isSending = nextSending;
    root.classList.toggle("is-sending", isSending);
    root.querySelector(".ai-chatbot-send").disabled = isSending;
    root.querySelector("textarea").disabled = isSending;
    root.querySelector("[data-chat-status]").textContent = isSending ? "Печатает..." : "";
  }

  function addTyping(root) {
    const messages = root.querySelector("[data-chat-messages]");
    const typing = document.createElement("article");
    typing.className = "ai-chatbot-message is-assistant is-typing";
    typing.setAttribute("data-chat-typing", "");
    typing.innerHTML = "<div><span></span><span></span><span></span></div>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping(root) {
    root.querySelector("[data-chat-typing]")?.remove();
  }

  async function sendMessage(root, rawMessage) {
    const message = rawMessage.trim();
    const status = root.querySelector("[data-chat-status]");

    if (!message || isSending) return;
    if (!resolveChatEndpoint()) {
      status.textContent = `${agentName} не настроен: добавьте endpoint в js/chat-config.js`;
      history.push({ role: "user", content: message });
      history.push({
        role: "assistant",
        content: `${agentName} пока не подключён к серверу. Для GitHub Pages укажите n8n webhook в js/chat-config.js. Позвоните нам: ${fallbackPhone}.`
      });
      history = history.slice(-MAX_HISTORY);
      saveHistory();
      renderMessages(root);
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      status.textContent = `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов.`;
      return;
    }

    history.push({ role: "user", content: message });
    history = history.slice(-MAX_HISTORY);
    saveHistory();
    maybePrepareLead(message);
    renderMessages(root);
    addTyping(root);
    setSending(root, true);

    try {
      const payload = {
        message,
        history: history.slice(0, -1),
        pageUrl: window.location.href,
        utm: getUtmParams(),
        agent: agentName
      };
      const endpoint = resolveChatEndpoint();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      const answer = data.answer || data.output || data.text || data.message;
      if (!response.ok || !answer) {
        throw new Error(data.error || `${agentName} временно недоступен.`);
      }

      history.push({ role: "assistant", content: answer });
      history = history.slice(-MAX_HISTORY);
      saveHistory();
      removeTyping(root);
      renderMessages(root);
    } catch (error) {
      console.error(error);
      removeTyping(root);
      history.push({
        role: "assistant",
        content: `Сейчас не получается связаться с ${agentName}. Укажите webhook в js/chat-config.js (n8n или OpenAI-прокси) или позвоните: ${fallbackPhone}.`
      });
      history = history.slice(-MAX_HISTORY);
      saveHistory();
      renderMessages(root);
    } finally {
      setSending(root, false);
    }
  }

  function autosize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  function initWidget() {
    const root = createWidget();
    const form = root.querySelector("[data-chat-form]");
    const textarea = root.querySelector("textarea");

    renderMessages(root);

    root.querySelector(".ai-chatbot-toggle").addEventListener("click", () => setOpen(root, !isOpen));
    root.querySelectorAll("[data-chat-close]").forEach((button) => {
      button.addEventListener("click", () => setOpen(root, false));
    });
    root.querySelectorAll("[data-chat-quick]").forEach((button) => {
      button.addEventListener("click", () => sendMessage(root, button.dataset.chatQuick || button.textContent));
    });

    textarea.addEventListener("input", () => autosize(textarea));
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = textarea.value;
      textarea.value = "";
      autosize(textarea);
      sendMessage(root, message);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) setOpen(root, false);
    });
  }

  document.addEventListener("DOMContentLoaded", initWidget);
})();
