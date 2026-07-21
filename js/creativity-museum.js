/**
 * Карусель из 4 ретро-гостиных + open/close мебель.
 */
(function () {
  const ASSET_V = "20260721-rooms-furn";

  /** Per-room furniture paths (cabinet/table/frames match each living room). */
  function roomAssets(id) {
    const base = `assets/creativity/${id}`;
    return {
      cabinetClosed: `${base}/cabinet-closed.png?v=${ASSET_V}`,
      cabinetOpen: `${base}/cabinet-open.png?v=${ASSET_V}`,
      tableClosed: `${base}/table-closed.png?v=${ASSET_V}`,
      tableOpen: `${base}/table-open.png?v=${ASSET_V}`,
      frameA: `${base}/frame-canvas.png?v=${ASSET_V}`,
      frameB: `${base}/frame-canvas-2.png?v=${ASSET_V}`
    };
  }

  const ROOMS = [
    {
      id: "ru",
      country: "Россия",
      title: "Светлая русская гостиная",
      blurb: "Крем, дерево, бордовая штора — тихий дом, куда хочется принести рисунок или стихи.",
      bg: `assets/creativity/room-bg-ru.jpg?v=${ASSET_V}`,
      alt: "Ретро-гостиная в русском стиле",
      assets: roomAssets("ru")
    },
    {
      id: "jp",
      country: "Япония",
      title: "Японская комната васи",
      blurb: "Татами, сёдзи и дерево — место для спокойных работ и коротких строк.",
      bg: `assets/creativity/room-bg-jp.jpg?v=${ASSET_V}`,
      alt: "Ретро-гостиная в японском стиле",
      assets: roomAssets("jp")
    },
    {
      id: "fr",
      country: "Франция",
      title: "Парижская квартира",
      blurb: "Лепнина, паркет «ёлочкой» и кружевные шторы — гостиная для дневников и акварели.",
      bg: `assets/creativity/room-bg-fr.jpg?v=${ASSET_V}`,
      alt: "Ретро-гостиная во французском стиле",
      assets: roomAssets("fr")
    },
    {
      id: "uk",
      country: "Англия",
      title: "Викторианский салон",
      blurb: "Тёмное дерево, камин и бордовый бархат — комната для историй и рукописей.",
      bg: `assets/creativity/room-bg-uk.jpg?v=${ASSET_V}`,
      alt: "Ретро-гостиная в английском стиле",
      assets: roomAssets("uk")
    }
  ];

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $$(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  }

  function bindTogglePairs(root) {
    root.querySelectorAll("[data-toggle-pair]").forEach((btn) => {
      const closed = btn.querySelector(".museum-state.is-default");
      const opened = btn.querySelector(".museum-state.is-open");
      if (closed) closed.hidden = false;
      if (opened) opened.hidden = true;
      btn.setAttribute("aria-expanded", "false");

      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        const next = !isOpen;
        btn.setAttribute("aria-expanded", String(next));
        if (closed) closed.hidden = next;
        if (opened) opened.hidden = !next;
      });
    });
  }

  function buildStageMarkup(room, index) {
    const a = room.assets || roomAssets(room.id);
    return `
      <div class="museum-stage museum-slide${index === 0 ? " is-active" : ""}" data-museum-slide="${index}" data-room-id="${room.id}" ${index === 0 ? "" : "hidden"}>
        <img class="museum-room" src="${room.bg}" width="1280" height="720" alt="${room.alt}" decoding="async" ${index === 0 ? "" : 'loading="lazy"'}>

        <button type="button" class="museum-hotspot museum-frame museum-frame--a" aria-label="${room.country}: картина слева">
          <img src="${a.frameA}" alt="Картина в багете" loading="lazy" decoding="async">
          <span class="museum-tooltip">Здесь может висеть ваша картина</span>
        </button>
        <button type="button" class="museum-hotspot museum-frame museum-frame--b" aria-label="${room.country}: картина справа">
          <img src="${a.frameB}" alt="Вторая картина" loading="lazy" decoding="async">
          <span class="museum-tooltip">И ваша тоже</span>
        </button>

        <button type="button" class="museum-hotspot museum-cabinet" data-toggle-pair aria-expanded="false" aria-label="${room.country}: шкаф — открыть">
          <img class="museum-state is-default" src="${a.cabinetClosed}" alt="Шкаф закрыт" loading="lazy" decoding="async" width="400" height="400">
          <img class="museum-state is-open" src="${a.cabinetOpen}" alt="Шкаф открыт" loading="lazy" decoding="async" width="400" height="400" hidden>
          <span class="museum-tooltip">Откройте — для стихов и открыток</span>
        </button>

        <button type="button" class="museum-hotspot museum-table" data-toggle-pair aria-expanded="false" aria-label="${room.country}: столик — открыть">
          <img class="museum-state is-default" src="${a.tableClosed}" alt="Столик закрыт" loading="lazy" decoding="async" width="400" height="400">
          <img class="museum-state is-open" src="${a.tableOpen}" alt="Столик открыт" loading="lazy" decoding="async" width="400" height="400" hidden>
          <span class="museum-tooltip">Откройте — для тетрадей</span>
        </button>
      </div>
    `;
  }

  function initCarousel() {
    const root = document.getElementById("museum-carousel");
    if (!root) {
      // fallback: single stage
      const stage = document.getElementById("museum-stage");
      if (stage) bindTogglePairs(stage);
      return;
    }

    const track = root.querySelector("[data-museum-track]");
    const labelCountry = root.querySelector("[data-museum-country]");
    const labelTitle = root.querySelector("[data-museum-title]");
    const labelBlurb = root.querySelector("[data-museum-blurb]");
    const dotsHost = root.querySelector("[data-museum-dots]");
    const btnPrev = root.querySelector("[data-museum-prev]");
    const btnNext = root.querySelector("[data-museum-next]");

    track.innerHTML = ROOMS.map((room, i) => buildStageMarkup(room, i)).join("");
    bindTogglePairs(track);

    let index = 0;

    function paintMeta() {
      const room = ROOMS[index];
      if (labelCountry) labelCountry.textContent = room.country;
      if (labelTitle) labelTitle.textContent = room.title;
      if (labelBlurb) labelBlurb.textContent = room.blurb;
      $$("[data-museum-dot]", dotsHost || root).forEach((dot, i) => {
        const on = i === index;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-current", on ? "true" : "false");
      });
      if (btnPrev) btnPrev.disabled = false;
      if (btnNext) btnNext.disabled = false;
    }

    function goTo(next) {
      const slides = $$("[data-museum-slide]", track);
      if (!slides.length) return;
      index = ((next % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle("is-active", on);
        slide.hidden = !on;
        if (on) {
          // reset furniture to closed when switching rooms
          slide.querySelectorAll("[data-toggle-pair]").forEach((btn) => {
            btn.setAttribute("aria-expanded", "false");
            const closed = btn.querySelector(".museum-state.is-default");
            const opened = btn.querySelector(".museum-state.is-open");
            if (closed) closed.hidden = false;
            if (opened) opened.hidden = true;
          });
        }
      });
      paintMeta();
    }

    if (dotsHost) {
      dotsHost.innerHTML = ROOMS.map((room, i) => `
        <button type="button" class="museum-dot${i === 0 ? " is-active" : ""}" data-museum-dot="${i}" aria-label="Гостиная: ${room.country}" aria-current="${i === 0 ? "true" : "false"}"></button>
      `).join("");
      dotsHost.addEventListener("click", (event) => {
        const dot = event.target.closest("[data-museum-dot]");
        if (!dot) return;
        goTo(Number(dot.dataset.museumDot));
      });
    }

    btnPrev?.addEventListener("click", () => goTo(index - 1));
    btnNext?.addEventListener("click", () => goTo(index + 1));

    // keyboard when carousel focused
    root.tabIndex = 0;
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
    });

    // light swipe
    let touchX = null;
    root.addEventListener(
      "touchstart",
      (event) => {
        touchX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      (event) => {
        if (touchX == null) return;
        const x = event.changedTouches[0]?.clientX ?? touchX;
        const dx = x - touchX;
        touchX = null;
        if (Math.abs(dx) < 48) return;
        goTo(index + (dx < 0 ? 1 : -1));
      },
      { passive: true }
    );

    paintMeta();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousel);
  } else {
    initCarousel();
  }
})();
