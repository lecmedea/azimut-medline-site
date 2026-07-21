(function () {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function pluralize(value, forms) {
    const number = Math.abs(value) % 100;
    const lastDigit = number % 10;
    if (number > 10 && number < 20) return forms[2];
    if (lastDigit > 1 && lastDigit < 5) return forms[1];
    if (lastDigit === 1) return forms[0];
    return forms[2];
  }

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

      const isMobileMenu = () =>
        matchMedia("(max-width: 1180px)").matches && document.body.classList.contains("nav-open");

      const openDesktop = () => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches || isMobileMenu()) return;
        clearTimeout(closeTimer);
        closeDropdowns(item);
        setDropdown(item, true);
      };

      const scheduleCloseDesktop = () => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches || isMobileMenu()) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => setDropdown(item, false), 450);
      };

      item.addEventListener("mouseenter", openDesktop);
      item.addEventListener("mouseleave", scheduleCloseDesktop);

      item.addEventListener("focusin", () => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches || isMobileMenu()) return;
        clearTimeout(closeTimer);
        closeDropdowns(item);
        setDropdown(item, true);
      });

      item.addEventListener("focusout", (event) => {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches || isMobileMenu()) return;
        if (!item.contains(event.relatedTarget)) {
          closeTimer = setTimeout(() => setDropdown(item, false), 180);
        }
      });

      if (button) {
        let accordionIntent = null;

        button.addEventListener("pointerdown", () => {
          if (!matchMedia("(max-width: 1180px)").matches) return;
          accordionIntent = !item.classList.contains("dropdown-open");
        });

        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!matchMedia("(max-width: 1180px)").matches) return;
          const willOpen = accordionIntent ?? !item.classList.contains("dropdown-open");
          accordionIntent = null;
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
      if (event.target.closest(".site-header") || event.target.closest(".mobile-nav-portal")) return;
      closeDropdowns();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdowns();
        window.AzimutNav?.close?.();
      }
    });
  }

  function initMenu() {
    const toggle = $(".nav-toggle");
    const headerInner = $(".header-inner");
    const nav = $(".main-nav");
    const actions = $(".header-actions");
    if (!toggle || !headerInner || !nav) return;

    let backdrop = $(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }

    let portal = $(".mobile-nav-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.className = "mobile-nav-portal";
      portal.setAttribute("aria-hidden", "true");
      document.body.appendChild(portal);
    }

    const navAnchor = document.createComment("main-nav-anchor");
    const actionsAnchor = document.createComment("header-actions-anchor");
    headerInner.insertBefore(navAnchor, nav);
    if (actions) headerInner.insertBefore(actionsAnchor, actions);

    const restoreNav = () => {
      if (navAnchor.parentNode) {
        navAnchor.parentNode.insertBefore(nav, navAnchor.nextSibling);
      }
      if (actions && actionsAnchor.parentNode) {
        actionsAnchor.parentNode.insertBefore(actions, actionsAnchor.nextSibling);
      }
    };

    const closeMenu = () => {
      if (!document.body.classList.contains("nav-open")) return;
      document.body.classList.remove("nav-open");
      backdrop.hidden = true;
      portal.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      closeDropdowns();
      restoreNav();
    };

    const openMenu = () => {
      portal.appendChild(nav);
      if (actions) portal.appendChild(actions);
      document.body.classList.add("nav-open");
      backdrop.hidden = false;
      portal.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", () => {
      if (document.body.classList.contains("nav-open")) closeMenu();
      else openMenu();
    });

    backdrop.addEventListener("click", closeMenu);

    $$(".main-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        if (matchMedia("(max-width: 1180px)").matches) closeMenu();
      });
    });

    window.AzimutNav = { close: closeMenu };
  }

  function initCompass() {
    const compass = $(".compass-card");
    if (!compass) return;

    /** Clinic: Старокалужское ш., 62 */
    const CLINIC = { lat: 55.660607, lon: 37.538170 };
    const mobileQuery = matchMedia("(max-width: 860px)");
    const hint = $(".compass-hint");

    let currentNeedleAngle = -90;
    let userLat = null;
    let userLon = null;
    let deviceHeading = null;
    let orientationActive = false;
    let geoWatchId = null;
    let rafId = 0;

    const setHint = (text) => {
      if (hint) hint.innerHTML = text;
    };

    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;

    /** Initial bearing from point A to B (degrees clockwise from true north). */
    const bearingToClinic = (lat, lon) => {
      const φ1 = toRad(lat);
      const φ2 = toRad(CLINIC.lat);
      const Δλ = toRad(CLINIC.lon - lon);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const setNeedleAngle = (angle, mode) => {
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const normalizedCurrent = ((currentNeedleAngle % 360) + 360) % 360;
      let delta = normalizedAngle - normalizedCurrent;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const ease = mode === "pointer" ? 0.24 : mode === "orientation" ? 0.28 : 1;
      currentNeedleAngle += delta * ease;
      compass.style.setProperty("--needle-angle", `${currentNeedleAngle}deg`);
      compass.classList.toggle("is-routing", mode === "routing");
      compass.classList.toggle("is-orientation", mode === "orientation");
      compass.classList.toggle("is-following", mode === "pointer");
    };

    const updateOrientationNeedle = () => {
      if (!mobileQuery.matches) return;
      if (userLat == null || userLon == null || deviceHeading == null) return;
      const bearing = bearingToClinic(userLat, userLon);
      // CSS needle 0° points east (like CSS rotate from positive X); -90° points up/north.
      // Device heading: 0 = north. Relative angle on screen: bearing - heading, then -90 for "up".
      const relative = bearing - deviceHeading;
      const cssAngle = relative - 90;
      setNeedleAngle(cssAngle, "orientation");
    };

    const scheduleOrientationUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updateOrientationNeedle();
      });
    };

    const onDeviceOrientation = (event) => {
      let heading = null;
      if (typeof event.webkitCompassHeading === "number" && !Number.isNaN(event.webkitCompassHeading)) {
        heading = event.webkitCompassHeading;
      } else if (typeof event.alpha === "number" && event.absolute !== false) {
        // alpha: 0 when device top points north (absolute) on many Android devices
        heading = (360 - event.alpha) % 360;
      } else if (typeof event.alpha === "number") {
        heading = (360 - event.alpha) % 360;
      }
      if (heading == null || Number.isNaN(heading)) return;
      deviceHeading = heading;
      scheduleOrientationUpdate();
    };

    const startGeo = () => {
      if (!navigator.geolocation || geoWatchId != null) return;
      geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          userLat = pos.coords.latitude;
          userLon = pos.coords.longitude;
          if (deviceHeading == null) {
            // Without heading yet: point "up" toward bearing as if device faces north
            const bearing = bearingToClinic(userLat, userLon);
            setNeedleAngle(bearing - 90, "routing");
            setHint("Ваш путь в Азимут. Ваш путь к себе.");
          } else {
            setHint("Ваш путь в Азимут. Ваш путь к себе.");
          }
          scheduleOrientationUpdate();
        },
        () => {
          setHint("Ваш путь в Азимут. Ваш путь к себе.");
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    };

    const startOrientation = async () => {
      if (orientationActive) return;
      try {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state !== "granted") {
            setHint("Ваш путь в Азимут. Ваш путь к себе.");
            return;
          }
        }
      } catch {
        setHint("Ваш путь в Азимут. Ваш путь к себе.");
        return;
      }
      window.addEventListener("deviceorientationabsolute", onDeviceOrientation, true);
      window.addEventListener("deviceorientation", onDeviceOrientation, true);
      orientationActive = true;
      startGeo();
      setHint("Ваш путь в Азимут. Ваш путь к себе.");
    };

    const updatePointerNeedle = (event) => {
      if (mobileQuery.matches) return;
      const rect = compass.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
      setNeedleAngle(angle, "pointer");
    };

    const onMobileActivate = (event) => {
      if (!mobileQuery.matches) return;
      // Prefer real compass; avoid accidental map open
      if (event && event.type === "click") event.preventDefault?.();
      startOrientation();
      // Fallback deep link if sensors unavailable after short wait
      window.setTimeout(() => {
        setHint("Ваш путь в Азимут. Ваш путь к себе.");
      }, 400);
    };

    const resetNeedle = () => {
      if (!mobileQuery.matches) {
        currentNeedleAngle = -90;
        compass.style.setProperty("--needle-angle", "-90deg");
        compass.classList.remove("is-routing", "is-orientation", "is-following");
        if (hint) {
          hint.textContent = "Коснитесь компаса и он мягко подскажет вам путь";
        }
      }
    };

    window.addEventListener("mousemove", updatePointerNeedle, { passive: true });
    compass.addEventListener("click", onMobileActivate);
    compass.addEventListener(
      "touchstart",
      (e) => {
        if (mobileQuery.matches) onMobileActivate(e);
      },
      { passive: true }
    );
    mobileQuery.addEventListener("change", () => {
      if (mobileQuery.matches) {
        setHint("Коснитесь компаса и он мягко подскажет вам путь");
      } else {
        resetNeedle();
      }
    });

    if (mobileQuery.matches) {
      setHint("Коснитесь компаса и он мягко подскажет вам путь");
    } else {
      resetNeedle();
    }
  }

  function initScrollTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scroll-top-btn";
    button.setAttribute("aria-label", "Наверх страницы");
    button.innerHTML = '<span aria-hidden="true">↑</span>';
    button.hidden = true;
    document.body.appendChild(button);

    const mobileQuery = matchMedia("(max-width: 860px)");
    const updateVisibility = () => {
      if (!mobileQuery.matches) {
        button.hidden = true;
        return;
      }
      button.hidden = window.scrollY < 280;
    };

    button.addEventListener("click", () => {
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: 0, behavior });
    });

    window.addEventListener("scroll", updateVisibility, { passive: true });
    mobileQuery.addEventListener("change", updateVisibility);
    updateVisibility();
  }

  function initSiteJoystick() {
    // Джойстик: все страницы кроме главной; dock-режим только на mobile (как в блоге)
    const raw = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
    const pageName = raw.split("?")[0].split("#")[0] || "index.html";
    const isHome = pageName === "index.html" || pageName === "index" || pageName === "";
    if (isHome) return;

    const mobileQuery = matchMedia("(max-width: 860px)");
    const applyDockMode = () => {
      document.body.classList.toggle("blog-utility-mode", mobileQuery.matches);
    };
    applyDockMode();
    mobileQuery.addEventListener("change", applyDockMode);

    const joystick = document.createElement("div");
    joystick.className = "azimut-joystick";
    joystick.innerHTML = `
      <button class="azimut-joystick-main" type="button" aria-label="Открыть быстрые действия" aria-expanded="false">
        <span class="azimut-joystick-main-icon" aria-hidden="true">
          <img class="azimut-joystick-gear" src="assets/icons/joystick-gear.gif?v=20260721-slow2x" width="40" height="40" alt="" decoding="async">
        </span>
      </button>
      <div class="azimut-joystick-actions" aria-label="Быстрые действия">
        <button class="azimut-joystick-action" type="button" data-joystick-action="top" aria-label="Наверх страницы"><span aria-hidden="true">↑</span></button>
        <button class="azimut-joystick-action azimut-joystick-action--tests" type="button" data-joystick-action="tests" aria-label="Открыть тесты" title="Тесты">
          <span class="azimut-joystick-tests-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="#9A4C39" stroke-width="1.8"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="#AE8B66" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="16.5" cy="16" r="1.6" fill="#9A4C39"/>
            </svg>
          </span>
        </button>
        <button class="azimut-joystick-action azimut-joystick-action--philipp" type="button" data-joystick-action="chat" aria-label="Открыть Филиппа Филипповича">
          <img src="assets/icons/philipp-filippovich-avatar.jpg" width="34" height="34" alt="" decoding="async">
        </button>
      </div>
    `;
    document.body.appendChild(joystick);

    const main = $(".azimut-joystick-main", joystick);
    const setOpen = (open) => {
      joystick.classList.toggle("is-open", open);
      main.setAttribute("aria-expanded", String(open));
    };

    main.addEventListener("click", () => setOpen(!joystick.classList.contains("is-open")));

    joystick.addEventListener("click", (event) => {
      const action = event.target.closest("[data-joystick-action]");
      if (!action) return;
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

      if (action.dataset.joystickAction === "top") {
        window.scrollTo({ top: 0, behavior });
        setOpen(false);
      }

      if (action.dataset.joystickAction === "chat") {
        $(".ai-chatbot-toggle")?.click();
        setOpen(false);
      }

      if (action.dataset.joystickAction === "tests") {
        window.location.href = "tests.html";
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function initHomeDepthParallax() {
    const sections = $$("[data-parallax-bg], [data-parallax-bg-secondary]");
    if (!sections.length) return;

    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const update = () => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
        const centered = progress - 0.5;
        const isSecondary = section.hasAttribute("data-parallax-bg-secondary");
        const bgRange = isSecondary ? 104 : 140;
        const driftRange = isSecondary ? -30 : -42;
        const softRange = isSecondary ? -12 : -16;
        const visualRange = isSecondary ? 16 : 26;

        section.style.setProperty("--home-bg-y", `${(centered * bgRange).toFixed(1)}px`);
        section.style.setProperty("--home-bg-drift", `${(centered * driftRange).toFixed(1)}px`);
        section.style.setProperty("--home-depth-soft", `${(centered * softRange).toFixed(1)}px`);
        section.style.setProperty("--home-depth-visual", `${(centered * visualRange).toFixed(1)}px`);
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  }

  function loadScriptOnce(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  function ensureLeadPipeline() {
    const jobs = [];
    if (!window.AzimutCRM) {
      jobs.push(loadScriptOnce("js/crm-bridge.js?v=20260721-amo-endpoint"));
    }
    if (!document.querySelector('script[src*="forms.js"]')) {
      jobs.push(loadScriptOnce("js/forms.js?v=20260721-modal-lead"));
    }
    return Promise.all(jobs).catch((error) => {
      console.warn("Lead pipeline scripts:", error);
    });
  }

  /**
   * Форма как на «Контактах» / виджет amoCRM:
   * ФИО, телефон, email, примечание, красная «Отправить».
   * Ставится только в модалку (где ещё длинная кастомная форма).
   */
  function getAmoStyleLeadFormMarkup(formName) {
    return `
      <form class="contact-form amo-lead-form" data-form="lead" data-form-name="${formName || "site_modal"}" data-amo-style="1">
        <input class="amo-lead-form__field" name="name" type="text" placeholder="ФИО" required autocomplete="name" aria-label="ФИО">
        <input class="amo-lead-form__field" name="phone" type="tel" placeholder="+7 Телефон" required autocomplete="tel" inputmode="tel" aria-label="Телефон">
        <input class="amo-lead-form__field" name="email" type="email" placeholder="Email" required autocomplete="email" aria-label="Email">
        <textarea class="amo-lead-form__field amo-lead-form__note" name="message" rows="3" placeholder="Примечание" required aria-label="Примечание"></textarea>
        <button class="amo-lead-form__submit" type="submit" disabled aria-disabled="true">Отправить</button>
        <p class="form-status" aria-live="polite"></p>
        <p class="amo-lead-form__badge">Работает на amoCRM</p>
        <p class="amo-lead-form__legal">Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных и политикой конфиденциальности.</p>
      </form>
    `;
  }

  function ensureAppointmentModal() {
    let modal = $('[data-modal="appointment-modal"]');
    if (!modal) {
      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <div class="appointment-modal" data-modal="appointment-modal" aria-hidden="true">
          <div class="appointment-modal-backdrop" data-modal-close></div>
          <section class="appointment-dialog appointment-dialog--amo" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
            <button class="modal-close" type="button" data-modal-close aria-label="Закрыть окно записи">×</button>
            <div class="appointment-dialog__head">
              <p class="eyebrow">Запись</p>
              <h2 id="appointment-modal-title">Оставить заявку</h2>
              <p data-appointment-lead>Заявка уходит в amoCRM. Администратор свяжется с вами.</p>
            </div>
            ${getAmoStyleLeadFormMarkup("site_modal")}
          </section>
        </div>
      `.trim();
      modal = wrap.firstElementChild;
      document.body.appendChild(modal);
    } else {
      // Upgrade old long modal form → amo-style (only if not already)
      const form = modal.querySelector("form[data-form='lead']");
      if (form && form.dataset.amoStyle !== "1") {
        form.outerHTML = getAmoStyleLeadFormMarkup(form.dataset.formName || "site_modal");
      }
      const dialog = modal.querySelector(".appointment-dialog");
      if (dialog) dialog.classList.add("appointment-dialog--amo");
      const title = modal.querySelector("#appointment-modal-title");
      if (title && /консультац/i.test(title.textContent || "")) {
        title.textContent = "Оставить заявку";
      }
    }
    const form = modal.querySelector("form[data-form='lead']");
    if (form && window.AzimutForms?.bindForm) window.AzimutForms.bindForm(form);
    return modal;
  }

  function ensureCallModal() {
    if ($('[data-modal="call-modal"]')) return $('[data-modal="call-modal"]');
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="appointment-modal call-modal" data-modal="call-modal" aria-hidden="true">
        <div class="appointment-modal-backdrop" data-modal-close></div>
        <section class="appointment-dialog call-dialog" role="dialog" aria-modal="true" aria-labelledby="call-modal-title">
          <button class="modal-close" type="button" data-modal-close aria-label="Закрыть окно звонка">×</button>
          <p class="eyebrow">Круглосуточно</p>
          <h2 id="call-modal-title">Позвонить в клинику</h2>
          <p>Администратор бережно уточнит ситуацию и поможет записаться. Можно сразу оставить заявку в форме — она уйдёт в amoCRM.</p>
          <div class="call-dialog-actions">
            <a class="button button-primary" href="tel:+79251127799">Позвонить 8 (925) 112 77 99</a>
            <button class="button button-secondary" type="button" data-modal-open="appointment-modal" data-select-service="Заказ звонка" data-select-format="по телефону">Оставить заявку</button>
            <button class="button button-secondary" type="button" data-modal-close>Закрыть</button>
          </div>
        </section>
      </div>
    `.trim();
    const modal = wrap.firstElementChild;
    document.body.appendChild(modal);
    return modal;
  }

  function prefillAppointmentForm(opener) {
    const modal = ensureAppointmentModal();
    const form = modal.querySelector("form[data-form]");
    if (!form) return;

    const service = opener?.dataset?.selectService || "";
    const price = opener?.dataset?.selectPrice || "";
    const format = opener?.dataset?.selectFormat || "";
    const direction = opener?.dataset?.selectDirection || "";
    const formName = opener?.dataset?.formName || "site_modal";

    if (!form.elements.selected_service) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "selected_service";
      form.appendChild(input);
    }
    if (!form.elements.selected_price) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "selected_price";
      form.appendChild(input);
    }

    form.elements.selected_service.value = service;
    form.elements.selected_price.value = price;
    form.dataset.formName = formName;

    if (format && form.elements.service_type) {
      form.elements.service_type.value = format;
    }
    if (direction && form.elements.direction) {
      const options = [...form.elements.direction.options].map((o) => o.value.toLowerCase());
      const match = options.find((v) => v && direction.toLowerCase().includes(v));
      if (match) form.elements.direction.value = match;
      else if ([...form.elements.direction.options].some((o) => o.value === direction)) {
        form.elements.direction.value = direction;
      }
    }

    const title = modal.querySelector("#appointment-modal-title");
    const lead = modal.querySelector("[data-appointment-lead]");
    if (service && title) title.textContent = "Заявка: " + service;
    else if (title) title.textContent = "Записаться на консультацию";
    if (service && lead) {
      lead.textContent = "Услуга «" + service + "» уже отмечена в заявке. Оставьте контакты — заявка уйдёт в amoCRM.";
    } else if (lead) {
      lead.textContent = "Оставьте контакты — администратор уточнит ситуацию. Заявка поступит в amoCRM.";
    }

    if (window.AzimutForms?.syncSubmitState) {
      window.AzimutForms.syncSubmitState(form);
    }
  }

  function isBookingTrigger(el) {
    if (!(el instanceof Element)) return false;
    if (el.closest("form")) return false;
    if (el.matches("a[href^='tel:'], a[href^='mailto:']")) return false;
    if (el.dataset.modalOpen === "call-modal") return false;
    if (el.dataset.noBooking === "true") return false;

    if (el.hasAttribute("data-modal-open") && el.dataset.modalOpen === "appointment-modal") return true;
    if (el.hasAttribute("data-select-service")) return true;

    const href = (el.getAttribute("href") || "").trim();
    if (
      href.includes("#appointment") ||
      href === "#price-form" ||
      href.endsWith("#price-form") ||
      href === "#service-form" ||
      href.endsWith("#service-form") ||
      href === "services.html#home" ||
      href.endsWith("services.html#home")
    ) {
      return true;
    }

    const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!el.classList.contains("button") && !el.classList.contains("banner-cta") && !el.classList.contains("header-utility-link") && !el.classList.contains("nav-dropdown-link")) {
      return false;
    }
    return /записаться|оформить заявку|получить консультацию|заказать звонок|вызвать врача|вызвать специалиста|хочу оставить работу|форма обратной связи|записаться к специалисту|обсудить ситуацию/.test(text);
  }

  function bookingIntent(el) {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const href = (el.getAttribute("href") || "").trim();
    const intent = {
      service: el.dataset.selectService || "",
      price: el.dataset.selectPrice || "",
      format: el.dataset.selectFormat || "",
      direction: el.dataset.selectDirection || "",
      formName: el.dataset.formName || "site_modal"
    };

    if (/заказать звонок|заказ звонка/.test(text)) {
      intent.service = intent.service || "Заказ звонка";
      intent.format = intent.format || "по телефону";
      intent.formName = "callback_request";
    } else if (/вызвать врача|вызвать специалиста|на дому|services\.html#home/.test(text + href)) {
      intent.service = intent.service || "Вызов специалиста на дом";
      intent.format = intent.format || "на дому";
      intent.formName = "home_visit";
    } else if (/тестирован/.test(text)) {
      intent.direction = intent.direction || "психологическое тестирование";
      intent.formName = "test_invite";
    } else if (/музей|творчеств/.test(text)) {
      intent.service = intent.service || "Музей творчества";
      intent.formName = "creativity_museum";
    } else if (/партнёр|сотруднич/.test(text)) {
      intent.formName = "partnership";
    }

    return intent;
  }

  function initModals() {
    ensureLeadPipeline();
    ensureAppointmentModal();
    ensureCallModal();

    let lastFocus = null;

    const closeModal = (modal) => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      if (!$("[data-modal].is-open")) document.body.classList.remove("modal-open");
      lastFocus?.focus();
    };

    const openModal = (modal) => {
      if (!modal) return;
      lastFocus = document.activeElement;
      $$("[data-modal].is-open").forEach((open) => {
        if (open !== modal) closeModal(open);
      });
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      setTimeout(() => $("input, textarea, select, button", modal)?.focus(), 80);
    };

    window.AzimutAppointment = {
      open(options = {}) {
        ensureLeadPipeline().then(() => {
          const modal = ensureAppointmentModal();
          const fake = document.createElement("button");
          if (options.service) fake.dataset.selectService = options.service;
          if (options.price) fake.dataset.selectPrice = options.price;
          if (options.format) fake.dataset.selectFormat = options.format;
          if (options.direction) fake.dataset.selectDirection = options.direction;
          if (options.formName) fake.dataset.formName = options.formName;
          prefillAppointmentForm(fake);
          if (window.AzimutForms?.bindForm) {
            const form = modal.querySelector("form[data-form]");
            if (form && form.dataset.bound !== "true") window.AzimutForms.bindForm(form);
          }
          openModal(modal);
        });
      },
      close() {
        closeModal($('[data-modal="appointment-modal"].is-open'));
      }
    };

    document.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-modal-close]");
      if (closer) {
        const modal = closer.closest("[data-modal]");
        if (modal) {
          event.preventDefault();
          closeModal(modal);
        }
        return;
      }

      const explicit = event.target.closest("[data-modal-open]");
      if (explicit) {
        const id = explicit.dataset.modalOpen;
        if (id === "appointment-modal" || isBookingTrigger(explicit)) {
          event.preventDefault();
          const intent = bookingIntent(explicit);
          Object.entries(intent).forEach(([key, value]) => {
            if (!value) return;
            const attr = key === "formName" ? "formName" : "select" + key.charAt(0).toUpperCase() + key.slice(1);
            // map to dataset keys
          });
          explicit.dataset.selectService = intent.service || explicit.dataset.selectService || "";
          explicit.dataset.selectPrice = intent.price || explicit.dataset.selectPrice || "";
          explicit.dataset.selectFormat = intent.format || explicit.dataset.selectFormat || "";
          explicit.dataset.selectDirection = intent.direction || explicit.dataset.selectDirection || "";
          explicit.dataset.formName = intent.formName || explicit.dataset.formName || "site_modal";
          ensureLeadPipeline().then(() => {
            prefillAppointmentForm(explicit);
            const modal = ensureAppointmentModal();
            if (window.AzimutForms?.bindForm) {
              const form = modal.querySelector("form[data-form]");
              if (form) window.AzimutForms.bindForm(form);
            }
            openModal(modal);
          });
          return;
        }
        if (id === "call-modal") {
          event.preventDefault();
          openModal(ensureCallModal());
          return;
        }
        const modal = $(`[data-modal="${id}"]`);
        if (modal) {
          event.preventDefault();
          openModal(modal);
        }
        return;
      }

      const booking = event.target.closest("a, button");
      if (!booking || !isBookingTrigger(booking)) return;
      event.preventDefault();
      const intent = bookingIntent(booking);
      booking.dataset.selectService = intent.service || booking.dataset.selectService || "";
      booking.dataset.selectPrice = intent.price || booking.dataset.selectPrice || "";
      booking.dataset.selectFormat = intent.format || booking.dataset.selectFormat || "";
      booking.dataset.selectDirection = intent.direction || booking.dataset.selectDirection || "";
      booking.dataset.formName = intent.formName || "site_modal";
      ensureLeadPipeline().then(() => {
        prefillAppointmentForm(booking);
        const modal = ensureAppointmentModal();
        if (window.AzimutForms?.bindForm) {
          const form = modal.querySelector("form[data-form]");
          if (form) window.AzimutForms.bindForm(form);
        }
        openModal(modal);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const modal = $("[data-modal].is-open");
      if (modal) closeModal(modal);
    });
  }

  function initAccordions() {
    $$("[data-accordion-group]").forEach((group) => {
      $$("details", group).forEach((details) => {
        details.addEventListener("toggle", () => {
          if (!details.open) return;
          $$("details", group).forEach((item) => {
            if (item !== details) item.open = false;
          });
        });
      });
    });
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

  function getPriceAccordionHtml(formHash) {
    const sections = (window.AZIMUT_PRICE_SECTIONS || []).filter((section) => section.type !== "notes");
    return sections.map((section) => `
      <details class="service-price-item">
        <summary>
          <span>${section.title}</span>
          <small>${section.items.length} ${pluralize(section.items.length, ["услуга", "услуги", "услуг"])}</small>
        </summary>
        ${section.disclaimer ? `<p class="notice">${section.disclaimer}</p>` : ""}
        <div class="service-price-list" role="list">
          ${section.items.map(([title, description, price]) => `
            <div class="service-price-row" role="listitem">
              <div class="service-price-row-main">
                <strong class="service-price-row-title">${title}</strong>
                <p class="service-price-row-desc">${description}</p>
              </div>
              <div class="service-price-row-aside">
                <strong class="service-price-row-price">${price}</strong>
                <button class="button button-secondary" type="button" data-select-service="${title}" data-select-price="${price}" onclick="location.hash='${formHash}'">Выбрать</button>
              </div>
            </div>
          `).join("")}
        </div>
      </details>
    `).join("");
  }

  function renderServicePriceAccordion(target) {
    target.innerHTML = getPriceAccordionHtml("service-form");
    initPriceAccordionGroup(target);
  }

  function initPriceAccordionGroup(root) {
    const host = root.classList?.contains("service-price-accordion")
      ? root
      : root.querySelector?.(".service-price-accordion") || root;
    const items = $$("details.service-price-item", host);
    items.forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        items.forEach((item) => {
          if (item !== details) item.open = false;
        });
      });
    });
  }

  function renderPrices(target) {
    const sections = window.AZIMUT_PRICE_SECTIONS || [];
    const notice = window.AZIMUT_PRICE_NOTICE || "";
    const notes = sections.filter((section) => section.type === "notes");
    target.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">Услуги и цены</p>
        <h2>Выберите раздел прайса</h2>
        <p class="notice">Сначала выберите нужное направление. Внутри раскроется список услуг с описанием и ориентиром по стоимости.</p>
        ${notice ? `<p class="notice">${notice}</p>` : ""}
      </div>
      <div class="service-price-accordion">${getPriceAccordionHtml("price-form")}</div>
      ${notes.map((section) => `<section class="price-section"><h2>${section.title}</h2><ul class="clean-list">${section.items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`).join("")}
    `;
    initPriceAccordionGroup(target);
  }

  function renderPriceFaq(target) {
    target.innerHTML = (window.AZIMUT_PRICE_FAQ || []).map(([question, answer]) => `<div class="faq-item"><h3>${question}</h3><p>${answer}</p></div>`).join("");
  }

  function attachDoctorPhotoLoading(target) {
    const primaryPhotos = $$(".doctor-photo-primary[data-photo]", target);
    const loadPrimaryPhoto = (photo) => {
      if (photo.dataset.loaded === "true") return;
      photo.style.backgroundImage = `url('${photo.dataset.photo}')`;
      photo.dataset.loaded = "true";
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadPrimaryPhoto(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "520px 0px", threshold: 0.01 });
      primaryPhotos.forEach((photo) => observer.observe(photo));
    } else {
      primaryPhotos.forEach(loadPrimaryPhoto);
    }

    $$(".doctor-photo-smile[data-smile-photo]", target).forEach((photo) => {
      const card = photo.closest(".doctor-card");
      if (!card) return;

      const loadSmilePhoto = () => {
        if (photo.dataset.loaded === "true" || photo.dataset.loading === "true") return;
        photo.dataset.loading = "true";
        const preload = new Image();
        preload.onload = () => {
          photo.style.backgroundImage = `url('${photo.dataset.smilePhoto}')`;
          photo.dataset.loaded = "true";
          delete photo.dataset.loading;
          card.classList.add("doctor-smile-loaded");
        };
        preload.src = photo.dataset.smilePhoto;
      };

      card.addEventListener("pointerenter", loadSmilePhoto, { once: true });
      card.addEventListener("focusin", loadSmilePhoto, { once: true });
    });
  }

  function escapeDoctorHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDoctorEducation(item) {
    const education = item.education || [];
    if (!education.length) return "";
    return `
      <details class="doctor-details">
        <summary>Образование</summary>
        <ul class="doctor-meta-list">
          ${education.map((row) => `
            <li>
              <span class="doctor-meta-year">${escapeDoctorHtml(row.year)}</span>
              <div>
                <strong>${escapeDoctorHtml(row.specialty)}</strong>
                <span>${escapeDoctorHtml(row.place)}</span>
                ${row.kind ? `<em>${escapeDoctorHtml(row.kind)}</em>` : ""}
              </div>
            </li>
          `).join("")}
        </ul>
      </details>
    `;
  }

  function renderDoctorCourses(item) {
    const courses = item.courses || [];
    if (!courses.length) return "";
    return `
      <details class="doctor-details">
        <summary>Повышение квалификации</summary>
        <ul class="doctor-meta-list doctor-meta-list--plain">
          ${courses.map((row) => `
            <li>
              ${row.year && row.year !== "—" ? `<span class="doctor-meta-year">${escapeDoctorHtml(row.year)}</span>` : ""}
              <div><span>${escapeDoctorHtml(row.title)}</span></div>
            </li>
          `).join("")}
        </ul>
      </details>
    `;
  }

  function renderDoctorSpecialties(item) {
    const specialties = item.specialties || [];
    if (!specialties.length) return "";
    return `
      <details class="doctor-details" open>
        <summary>Направления работы</summary>
        <ul class="doctor-chip-list">
          ${specialties.map((s) => `<li>${escapeDoctorHtml(s)}</li>`).join("")}
        </ul>
      </details>
    `;
  }

  function renderDoctorExtra(item) {
    const blocks = [];
    if (item.experienceDetails && item.experienceDetails.length) {
      blocks.push(`
        <details class="doctor-details">
          <summary>Опыт работы</summary>
          <ul class="doctor-meta-list doctor-meta-list--plain">
            ${item.experienceDetails.map((line) => `<li><div><span>${escapeDoctorHtml(line)}</span></div></li>`).join("")}
          </ul>
        </details>
      `);
    }
    if (item.activity && item.activity.length) {
      blocks.push(`
        <details class="doctor-details">
          <summary>Научная и профессиональная деятельность</summary>
          <ul class="doctor-meta-list doctor-meta-list--plain">
            ${item.activity.map((line) => `<li><div><span>${escapeDoctorHtml(line)}</span></div></li>`).join("")}
          </ul>
        </details>
      `);
    }
    if (item.note) {
      blocks.push(`<p class="doctor-note">${escapeDoctorHtml(item.note)}</p>`);
    }
    return blocks.join("");
  }

  function ensureDoctorProfileModal() {
    let modal = document.querySelector('[data-modal="doctor-profile-modal"]');
    if (modal) return modal;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="doctor-profile-modal" data-modal="doctor-profile-modal" aria-hidden="true">
        <div class="doctor-profile-modal__backdrop" data-modal-close></div>
        <section class="doctor-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="doctor-profile-title">
          <button class="modal-close" type="button" data-modal-close aria-label="Закрыть карточку специалиста">×</button>
          <div class="doctor-profile-hero">
            <div class="doctor-profile-photo" data-doctor-profile-photo></div>
            <div>
              <p class="doctor-badge" data-doctor-profile-badge></p>
              <h2 id="doctor-profile-title" data-doctor-profile-name></h2>
              <p class="doctor-profile-role" data-doctor-profile-role></p>
              <p class="doctor-profile-exp" data-doctor-profile-exp></p>
            </div>
          </div>
          <div class="doctor-profile-body">
            <p class="doctor-profile-focus" data-doctor-profile-focus></p>
            <div data-doctor-profile-sections></div>
            <div class="doctor-profile-actions">
              <button class="button button-primary" type="button" data-doctor-profile-book>Записаться к специалисту</button>
              <button class="button button-secondary" type="button" data-modal-close>Закрыть</button>
            </div>
          </div>
        </section>
      </div>
    `.trim();
    modal = wrap.firstElementChild;
    document.body.appendChild(modal);
    return modal;
  }

  function openDoctorProfile(doctorId) {
    const doctor = (window.AZIMUT_DOCTORS || []).find((item) => item.id === doctorId || item.name === doctorId);
    if (!doctor) return;

    const modal = ensureDoctorProfileModal();
    const photo = modal.querySelector("[data-doctor-profile-photo]");
    const badge = modal.querySelector("[data-doctor-profile-badge]");
    const name = modal.querySelector("[data-doctor-profile-name]");
    const role = modal.querySelector("[data-doctor-profile-role]");
    const exp = modal.querySelector("[data-doctor-profile-exp]");
    const focus = modal.querySelector("[data-doctor-profile-focus]");
    const sections = modal.querySelector("[data-doctor-profile-sections]");
    const book = modal.querySelector("[data-doctor-profile-book]");

    if (photo) {
      photo.style.backgroundImage = doctor.photo ? `url('${doctor.photo}')` : "";
      photo.style.backgroundPosition = doctor.photoPosition || "50% 18%";
    }
    if (badge) badge.textContent = doctor.badge || doctor.role || "Специалист";
    if (name) name.textContent = doctor.name || "";
    if (role) role.textContent = doctor.role || "";
    if (exp) exp.textContent = doctor.experience || "";
    if (focus) focus.textContent = doctor.focus || doctor.homeHighlight || "";
    if (sections) {
      sections.innerHTML = [
        renderDoctorSpecialties(doctor),
        renderDoctorEducation(doctor),
        renderDoctorCourses(doctor),
        renderDoctorExtra(doctor)
      ].join("");
      // open key blocks by default in modal
      sections.querySelectorAll("details.doctor-details").forEach((details, index) => {
        if (index < 2) details.open = true;
      });
    }
    if (book) {
      book.dataset.modalOpen = "appointment-modal";
      book.dataset.selectService = doctor.role || doctor.name || "";
      book.dataset.selectDirection = (doctor.categories && doctor.categories[0]) || "";
      book.dataset.formName = "doctor_profile";
      book.dataset.selectPrice = "";
    }

    const lastFocus = document.activeElement;
    modal._lastFocus = lastFocus;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(() => modal.querySelector(".modal-close")?.focus(), 60);
  }

  function closeDoctorProfile() {
    const modal = document.querySelector('[data-modal="doctor-profile-modal"]');
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector("[data-modal].is-open")) {
      document.body.classList.remove("modal-open");
    }
    modal._lastFocus?.focus?.();
  }

  function initDoctorProfiles() {
    ensureDoctorProfileModal();

    document.addEventListener("click", (event) => {
      const closer = event.target.closest('[data-modal="doctor-profile-modal"] [data-modal-close]');
      if (closer) {
        event.preventDefault();
        closeDoctorProfile();
        return;
      }

      const openBtn = event.target.closest("[data-doctor-open]");
      if (openBtn) {
        event.preventDefault();
        openDoctorProfile(openBtn.dataset.doctorOpen || openBtn.closest("[data-doctor-id]")?.dataset.doctorId);
        return;
      }

      const card = event.target.closest(".doctor-card[data-doctor-id]");
      if (!card) return;
      // Don't open profile when booking or nested interactive controls fire
      if (event.target.closest("a, button, input, select, textarea, label, summary")) return;
      openDoctorProfile(card.dataset.doctorId);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeDoctorProfile();
    });

    window.AzimutDoctors = {
      open: openDoctorProfile,
      close: closeDoctorProfile
    };
  }

  /** «Фамилия Имя» без отчества — для карточек поверх фото. */
  function doctorCardDisplayName(item) {
    if (item.cardName) return String(item.cardName).trim();
    const full = String(item.name || "").trim();
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
    return full;
  }

  function renderDoctors(target) {
    const limit = Number(target.dataset.limit || 0);
    const hideActions = target.dataset.hideActions === "true";
    const detailed = target.dataset.detailed === "true";
    const excludedDoctors = (target.dataset.exclude || "").split(",").map((item) => item.trim()).filter(Boolean);
    const items = (window.AZIMUT_DOCTORS || [])
      .filter((item) => !excludedDoctors.includes(item.name) && !excludedDoctors.includes(item.id))
      .slice(0, limit || undefined);
    target.innerHTML = items.map((item) => {
      const displayFocus = item.homeHighlight || item.focus;
      const shortFocus = detailed
        ? displayFocus
        : (displayFocus || "").length > 140
          ? `${displayFocus.slice(0, 137).trim()}…`
          : displayFocus;
      // На карточках (особенно поверх фото) — только фамилия+имя и направление
      const cardName = doctorCardDisplayName(item);
      return `
      <article class="doctor-card doctor-card--clickable doctor-card--minimal${detailed ? " doctor-card--detailed" : ""}" data-doctor-id="${escapeDoctorHtml(item.id || "")}" tabindex="0" role="button" aria-label="Открыть профиль: ${escapeDoctorHtml(item.name)}">
        ${item.photo ? `<div class="doctor-photo-frame" role="img" aria-label="${escapeDoctorHtml(item.role)}">
          <div class="doctor-photo doctor-photo-primary" data-photo="${escapeDoctorHtml(item.photo)}" style="background-position: ${escapeDoctorHtml(item.photoPosition || "50% 50%")}"></div>
          ${item.smilePhoto ? `<div class="doctor-photo doctor-photo-smile" aria-hidden="true" data-smile-photo="${escapeDoctorHtml(item.smilePhoto)}" style="background-position: ${escapeDoctorHtml(item.photoPosition || "50% 50%")}"></div>` : ""}
        </div>` : ""}
        <div class="doctor-card__caption">
          <h3 class="doctor-card__name ${item.compactName ? "doctor-name-compact" : ""}">${escapeDoctorHtml(cardName)}</h3>
          <p class="doctor-role-line">${escapeDoctorHtml(item.role)}</p>
        </div>
        ${detailed ? `
        <p class="doctor-exp doctor-card__extra"><strong>${escapeDoctorHtml(item.experience)}</strong></p>
        <p class="doctor-focus doctor-card__extra">${escapeDoctorHtml(shortFocus)}</p>
        ` : ""}
        <p class="doctor-card__hint">Нажмите, чтобы открыть биографию</p>
        <div class="doctor-card__actions">
          <button class="button button-secondary" type="button" data-doctor-open="${escapeDoctorHtml(item.id || item.name)}">Подробнее</button>
          ${hideActions ? "" : `<button class="button button-primary" type="button" data-modal-open="appointment-modal" data-select-service="${escapeDoctorHtml(item.role)}" data-select-direction="${escapeDoctorHtml((item.categories && item.categories[0]) || "")}" data-form-name="doctor_card" data-select-price="">Записаться</button>`}
        </div>
      </article>
    `;
    }).join("");
    attachDoctorPhotoLoading(target);

    // keyboard open
    target.querySelectorAll(".doctor-card[data-doctor-id]").forEach((card) => {
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target !== card) return;
        event.preventDefault();
        openDoctorProfile(card.dataset.doctorId);
      });
    });
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

  function getArticleIndex() {
    if (window.AZIMUT_ARTICLES_INDEX && window.AZIMUT_ARTICLES_INDEX.length) {
      return window.AZIMUT_ARTICLES_INDEX;
    }
    return window.AZIMUT_ARTICLES || [];
  }

  function renderArticles(target, category = "all") {
    const limit = Number(target.dataset.limit || 0);
    let items = getArticleIndex();
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
      if (type === "service-price-accordion") renderServicePriceAccordion(target);
      if (type === "prices") renderPrices(target);
      if (type === "price-faq") renderPriceFaq(target);
      if (type === "doctors") renderDoctors(target);
      if (type === "reviews") renderReviews(target);
      if (type === "articles") renderArticles(target);
      if (type === "article" && window.AzimutBlog) window.AzimutBlog.renderArticle(target);
    });
  }

  function initRevealMotion() {
    const candidates = $$([
      ".section-heading",
      ".premium-accordion",
      ".banner-carousel",
      ".doctor-card",
      ".condition-card",
      ".photo-frame",
      ".contact-form",
      ".order-panel",
      ".you-alone-card"
    ].join(","));

    if (!candidates.length) return;

    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    candidates.forEach((item, index) => {
      item.classList.add("reveal-on-scroll");
      item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
      if (prefersReducedMotion) item.classList.add("is-visible");
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      candidates.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    candidates.forEach((item) => observer.observe(item));
  }

  window.AzimutRender = {
    renderArticles
  };

  function initBannerCarousel() {
    const root = document.querySelector("[data-banner-carousel]");
    if (!root) return;

    const slides = [...root.querySelectorAll(".banner-slide")];
    const viewport = root.querySelector(".banner-carousel-viewport");
    const dotsHost = root.querySelector("[data-banner-dots]");
    if (!slides.length) return;

    let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
    if (index < 0) index = 0;

    const loadSlide = (slide) => {
      if (!slide || slide.dataset.bannerLoaded === "true") return;
      $$("source[data-srcset]", slide).forEach((source) => {
        source.setAttribute("srcset", source.dataset.srcset);
        source.removeAttribute("data-srcset");
      });
      const image = $("img[data-src]", slide);
      if (image) {
        image.src = image.dataset.src;
        image.removeAttribute("data-src");
      }
      slide.dataset.bannerLoaded = "true";
    };

    const preloadCurrentSlides = () => {
      loadSlide(slides[index]);
      loadSlide(slides[(index + 1) % slides.length]);
    };

    const dots = slides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `banner-carousel-dot${i === index ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Баннер ${i + 1}`);
      dot.addEventListener("click", () => {
        index = i;
        paint();
        restart();
      });
      dotsHost?.append(dot);
      return dot;
    });

    let timer = null;

    const paint = () => {
      preloadCurrentSlides();
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    };

    const go = (step) => {
      index = (index + step + slides.length) % slides.length;
      paint();
    };

    const next = () => go(1);
    const prev = () => go(-1);

    const restart = () => {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(next, 5200);
    };

    if (viewport) {
      [
        ["prev", "Предыдущий баннер", prev],
        ["next", "Следующий баннер", next]
      ].forEach(([side, label, handler]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `banner-edge-control banner-edge-control--${side}`;
        button.setAttribute("aria-label", label);
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          handler();
          restart();
        });
        viewport.append(button);
      });
    }

    preloadCurrentSlides();
    paint();
    restart();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const raw = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
    const pageName = raw.split("?")[0].split("#")[0] || "index.html";
    if (pageName === "index.html" || pageName === "index" || pageName === "") {
      document.body.classList.add("is-home");
    }

    setActiveNav();
    initMenu();
    initDropdowns();
    initCompass();
    initScrollTop();
    initSiteJoystick();
    // Parallax depth layers removed from hero — skip heavy scroll work on home shell
    initHomeDepthParallax();
    initModals();
    initDoctorProfiles();
    initAccordions();
    renderBlocks();
    initRevealMotion();
    initBannerCarousel();
  });
})();
