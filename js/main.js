(function () {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function setActiveNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    $$(".main-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.split("#")[0] === current) link.classList.add("active");
    });
  }

  function closeDropdowns(except) {
    $$(".nav-item.dropdown-open").forEach((item) => {
      if (item === except) return;
      item.classList.remove("dropdown-open");
      const link = $(".nav-link[aria-expanded]", item);
      const button = $(".mobile-nav-accordion", item);
      if (link) link.setAttribute("aria-expanded", "false");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function setDropdown(item, open) {
    item.classList.toggle("dropdown-open", open);
    const link = $(".nav-link[aria-expanded]", item);
    const button = $(".mobile-nav-accordion", item);
    if (link) link.setAttribute("aria-expanded", String(open));
    if (button) button.setAttribute("aria-expanded", String(open));
  }

  function initDropdowns() {
    const items = $$(".nav-item.has-dropdown");
    items.forEach((item) => {
      const link = $(".nav-link", item);
      const button = $(".mobile-nav-accordion", item);
      let closeTimer;

      const openDesktop = () => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        clearTimeout(closeTimer);
        closeDropdowns(item);
        setDropdown(item, true);
      };

      const scheduleCloseDesktop = () => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => setDropdown(item, false), 450);
      };

      item.addEventListener("mouseenter", openDesktop);
      item.addEventListener("mouseleave", scheduleCloseDesktop);

      item.addEventListener("focusin", () => {
        clearTimeout(closeTimer);
        closeDropdowns(item);
        setDropdown(item, true);
      });

      item.addEventListener("focusout", (event) => {
        if (!item.contains(event.relatedTarget)) {
          closeTimer = setTimeout(() => setDropdown(item, false), 180);
        }
      });

      if (button) {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const willOpen = !item.classList.contains("dropdown-open");
          closeDropdowns(item);
          setDropdown(item, willOpen);
        });
      }

      if (link) {
        link.addEventListener("keydown", (event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            closeDropdowns(item);
            setDropdown(item, true);
            $(".nav-dropdown-link", item)?.focus();
          }
        });
      }
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-header")) closeDropdowns();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdowns();
        document.body.classList.remove("nav-open");
        $(".nav-toggle")?.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initMenu() {
    const toggle = $(".nav-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) closeDropdowns();
    });
  }

  function initCompass() {
    const compass = $(".compass-card");
    if (!compass) return;
    let usesDeviceOrientation = false;

    const setNeedleAngle = (angle, mode) => {
      compass.style.setProperty("--needle-angle", `${angle}deg`);
      compass.classList.toggle("is-orientation", mode === "orientation");
      compass.classList.toggle("is-following", mode === "pointer");
    };

    const normalizeHeading = (event) => {
      if (typeof event.webkitCompassHeading === "number") {
        return event.webkitCompassHeading;
      }
      if (typeof event.alpha === "number") {
        return 360 - event.alpha;
      }
      return null;
    };

    const updateNorthNeedle = (event) => {
      const heading = normalizeHeading(event);
      if (heading === null) return;
      usesDeviceOrientation = true;
      const screenAngle = screen.orientation?.angle || window.orientation || 0;
      setNeedleAngle(-heading - 90 + screenAngle, "orientation");
    };

    const startOrientationCompass = async () => {
      if (!window.DeviceOrientationEvent) return;
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") return;
        } catch {
          return;
        }
      }
      window.addEventListener("deviceorientation", updateNorthNeedle, true);
    };

    const updateNeedle = (event) => {
      if (usesDeviceOrientation) return;
      const rect = compass.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI;
      setNeedleAngle(angle, "pointer");
    };
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      window.addEventListener("mousemove", updateNeedle);
    }
    startOrientationCompass();
    compass.addEventListener("click", startOrientationCompass);
    compass.addEventListener("touchstart", startOrientationCompass, { passive: true, once: true });
  }

  function renderServices(target) {
    const groups = window.AZIMUT_SERVICE_GROUPS || [];
    target.innerHTML = groups.map((group) => `
      <article class="service-group-card">
        <p class="eyebrow">${group.group}</p>
        <h3>${group.group}</h3>
        <p>${group.summary}</p>
        <div class="service-list">
          ${group.items.map(([title, format, description, price]) => `
            <div class="service-row">
              <div>
                <strong>${title}</strong>
                <span>${format}</span>
                <p>${description}</p>
              </div>
              <button class="button button-ghost" type="button" data-select-service="${title}" data-select-price="${price}" onclick="location.hash='service-form'">${price}</button>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderHelpTopics(target) {
    target.innerHTML = (window.AZIMUT_HELP_TOPICS || []).map((topic) => `<article class="mini-card">${topic}</article>`).join("");
  }

  function renderFormats(target) {
    target.innerHTML = (window.AZIMUT_FORMATS || []).map((item, index) => `
      <article class="feature-card">
        <span class="icon-dot">${String(index + 1).padStart(2, "0")}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <a href="services.html#service-form">Получить консультацию</a>
      </article>
    `).join("");
  }

  function renderPopularPrices(target) {
    target.innerHTML = (window.AZIMUT_POPULAR_PRICES || []).map(([service, price]) => `
      <article class="price-mini-card">
        <span>${service}</span>
        <strong>${price}</strong>
        <button class="button button-ghost" type="button" data-select-service="${service}" data-select-price="${price}" onclick="location.hash='appointment'">Выбрать</button>
      </article>
    `).join("");
  }

  function renderPrices(target) {
    const sections = window.AZIMUT_PRICE_SECTIONS || [];
    const notice = window.AZIMUT_PRICE_NOTICE || "";
    target.innerHTML = `<p class="notice">${notice}</p>` + sections.map((section) => {
      if (section.type === "notes") {
        return `<section class="price-section"><h2>${section.title}</h2><ul class="clean-list">${section.items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
      }
      return `
        <section class="price-section">
          <h2>${section.title}</h2>
          ${section.disclaimer ? `<p class="notice">${section.disclaimer}</p>` : ""}
          <div class="price-card-grid">
            ${section.items.map(([title, description, price]) => `
              <article class="price-card">
                <div>
                  <h3>${title}</h3>
                  <p>${description}</p>
                </div>
                <strong>${price}</strong>
                <button class="button button-secondary" type="button" data-select-service="${title}" data-select-price="${price}" onclick="location.hash='price-form'">Выбрать услугу</button>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderPriceFaq(target) {
    target.innerHTML = (window.AZIMUT_PRICE_FAQ || []).map(([question, answer]) => `<div class="faq-item"><h3>${question}</h3><p>${answer}</p></div>`).join("");
  }

  function renderDoctors(target) {
    const limit = Number(target.dataset.limit || 0);
    const items = (window.AZIMUT_DOCTORS || []).slice(0, limit || undefined);
    target.innerHTML = items.map((item) => `
      <article class="doctor-card">
        ${item.photo ? `<div class="doctor-photo" role="img" aria-label="${item.role}" style="background-image: url('${item.photo}'); background-position: ${item.photoPosition || "50% 50%"}"></div>` : ""}
        <p class="eyebrow">${item.role}</p>
        <h3>${item.name}</h3>
        <p><strong>${item.experience}</strong></p>
        <p>${item.focus}</p>
        <a class="button button-secondary" href="contacts.html#appointment" data-select-service="${item.role}" data-select-price="">Записаться</a>
      </article>
    `).join("");
  }

  function renderReviews(target) {
    const items = window.AZIMUT_REVIEWS || [];
    target.innerHTML = items.map((item) => `
      <article class="review-card">
        <p>«${item.text}»</p>
        <strong>${item.name}</strong>
      </article>
    `).join("");
  }

  function renderArticles(target, category = "all") {
    const limit = Number(target.dataset.limit || 0);
    let items = window.AZIMUT_ARTICLES || [];
    if (category !== "all") {
      items = items.filter((item) => item.category === category);
    }
    items = items.slice(0, limit || undefined);
    target.innerHTML = items.map((item) => `
      <article class="article-card" data-category="${item.category}">
        ${item.image ? `<div class="article-image" role="img" aria-label="${item.title}" style="background-image: url('${item.image}'); background-position: ${item.imagePosition || "center"}"></div>` : ""}
        <div class="meta"><span>${item.category}</span><span>${item.readTime}</span></div>
        <h3>${item.title}</h3>
        <p>${item.excerpt}</p>
        <a href="article.html?slug=${item.slug}">Читать статью</a>
      </article>
    `).join("");
  }

  function renderBlocks() {
    $$("[data-render]").forEach((target) => {
      const type = target.dataset.render;
      if (type === "services") renderServices(target);
      if (type === "help-topics") renderHelpTopics(target);
      if (type === "formats") renderFormats(target);
      if (type === "popular-prices") renderPopularPrices(target);
      if (type === "prices") renderPrices(target);
      if (type === "price-faq") renderPriceFaq(target);
      if (type === "doctors") renderDoctors(target);
      if (type === "reviews") renderReviews(target);
      if (type === "articles") renderArticles(target);
      if (type === "article" && window.AzimutBlog) window.AzimutBlog.renderArticle(target);
    });
  }

  window.AzimutRender = {
    renderArticles
  };

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initMenu();
    initDropdowns();
    initCompass();
    renderBlocks();
  });
})();
