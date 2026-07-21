/**
 * Развлечения — лёгкие психологические мини-игры.
 * Без Flash, без тяжёлых ML-моделей (чтобы страница не зависала).
 * Каждая игра монтируется только при открытии и полностью уничтожается при закрытии.
 */
(function () {
  const COLORS = [
    { name: "красный", css: "#dc2626" },
    { name: "синий", css: "#2563eb" },
    { name: "зелёный", css: "#16a34a" },
    { name: "жёлтый", css: "#ca8a04" }
  ];

  const MOOD_EMOJI = ["😌", "🙂", "😐", "😟", "😢", "😠", "😮", "😴"];

  const GAMES = {
    stroop: {
      title: "Эффект Струпа",
      hint: "Назовите цвет шрифта, а не слово. Классический эксперимент внимания (Stroop, 1935).",
      mount: mountStroop
    },
    memory: {
      title: "Память эмоций",
      hint: "Откройте две карточки — найдите пары эмодзи-настроений. Тренировка рабочей памяти.",
      mount: mountMemory
    },
    reaction: {
      title: "Фокус и реакция",
      hint: "Ждите зелёного поля и нажмите как можно быстрее. Ранний клик — фальстарт.",
      mount: mountReaction
    },
    breath: {
      title: "Дыхательный круг",
      hint: "Спокойное дыхание 4–4–4: вдох — пауза — выдох. Только визуальная подсказка, без аудио.",
      mount: mountBreath
    }
  };

  let activeCleanup = null;
  let rafId = 0;

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function cancelLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function ensureStage() {
    let stage = $("[data-fun-stage]");
    if (stage) return stage;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="fun-stage" data-fun-stage aria-hidden="true">
        <div class="fun-stage__backdrop" data-fun-close></div>
        <section class="fun-stage__dialog" role="dialog" aria-modal="true" aria-labelledby="fun-stage-title">
          <button type="button" class="fun-stage__close" data-fun-close aria-label="Закрыть">×</button>
          <h2 class="fun-stage__title" id="fun-stage-title"></h2>
          <p class="fun-stage__hint" data-fun-hint></p>
          <p class="fun-stage__status" data-fun-status aria-live="polite"></p>
          <div class="fun-stage__board" data-fun-board></div>
          <div class="fun-stage__actions">
            <button type="button" class="button button-secondary" data-fun-restart>Сначала</button>
            <button type="button" class="button button-primary" data-fun-close>Закрыть</button>
          </div>
        </section>
      </div>
    `.trim();
    stage = wrap.firstElementChild;
    document.body.appendChild(stage);

    stage.addEventListener("click", (event) => {
      if (event.target.closest("[data-fun-close]")) closeGame();
      if (event.target.closest("[data-fun-restart]")) {
        const id = stage.dataset.gameId;
        if (id) openGame(id);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && stage.classList.contains("is-open")) closeGame();
    });

    return stage;
  }

  function openGame(id) {
    const meta = GAMES[id];
    if (!meta) return;
    closeGame(false);

    const stage = ensureStage();
    stage.dataset.gameId = id;
    $("#fun-stage-title", stage).textContent = meta.title;
    $("[data-fun-hint]", stage).textContent = meta.hint;
    $("[data-fun-status]", stage).textContent = "";
    const board = $("[data-fun-board]", stage);
    board.innerHTML = "";

    stage.classList.add("is-open");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("fun-stage-open");

    // Defer mount one frame so paint stays smooth
    requestAnimationFrame(() => {
      activeCleanup = meta.mount(board, {
        setStatus(text) {
          const node = $("[data-fun-status]", stage);
          if (node) node.textContent = text;
        }
      }) || null;
    });
  }

  function closeGame(hide = true) {
    cancelLoop();
    if (typeof activeCleanup === "function") {
      try {
        activeCleanup();
      } catch (_) {
        /* ignore */
      }
    }
    activeCleanup = null;
    if (!hide) return;
    const stage = $("[data-fun-stage]");
    if (!stage) return;
    stage.classList.remove("is-open");
    stage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fun-stage-open");
    const board = $("[data-fun-board]", stage);
    if (board) board.innerHTML = "";
    delete stage.dataset.gameId;
  }

  /* ——— Stroop ——— */
  function mountStroop(board, api) {
    let score = 0;
    let round = 0;
    const total = 12;
    let locked = false;

    const scoreEl = document.createElement("div");
    scoreEl.className = "fun-score";
    const stim = document.createElement("div");
    stim.className = "fun-stimulus";
    stim.setAttribute("aria-live", "polite");
    const row = document.createElement("div");
    row.className = "fun-btn-row";

    board.append(scoreEl, stim, row);

    function paintScore() {
      scoreEl.innerHTML = `<span>Раунд: <strong>${round}/${total}</strong></span><span>Верно: <strong>${score}</strong></span>`;
    }

    function next() {
      if (round >= total) {
        stim.textContent = "Готово!";
        stim.style.color = "#0f766e";
        row.innerHTML = "";
        api.setStatus(`Результат: ${score} из ${total}. Эффект Струпа — про рассогласование слова и цвета.`);
        return;
      }
      locked = false;
      round += 1;
      paintScore();
      const word = COLORS[Math.floor(Math.random() * COLORS.length)];
      let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
      // ~60% incongruent
      if (Math.random() < 0.6 && ink.name === word.name) {
        ink = COLORS[(COLORS.indexOf(ink) + 1) % COLORS.length];
      }
      stim.textContent = word.name.toUpperCase();
      stim.style.color = ink.css;
      stim.dataset.answer = ink.name;

      row.innerHTML = "";
      COLORS.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fun-choice";
        btn.textContent = c.name;
        btn.style.color = c.css;
        btn.addEventListener("click", () => {
          if (locked) return;
          locked = true;
          if (c.name === stim.dataset.answer) {
            score += 1;
            api.setStatus("Верно — назвали цвет, а не слово.");
          } else {
            api.setStatus("Мимо. Нужен цвет букв, не смысл слова.");
          }
          paintScore();
          setTimeout(next, 420);
        });
        row.appendChild(btn);
      });
    }

    paintScore();
    next();
    return () => {
      locked = true;
      row.innerHTML = "";
    };
  }

  /* ——— Memory ——— */
  function mountMemory(board, api) {
    const pairs = MOOD_EMOJI.slice(0, 6);
    let deck = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
    let open = [];
    let matches = 0;
    let moves = 0;
    let lock = false;

    const scoreEl = document.createElement("div");
    scoreEl.className = "fun-score";
    const grid = document.createElement("div");
    grid.className = "fun-memory-grid";
    board.append(scoreEl, grid);

    function paintScore() {
      scoreEl.innerHTML = `<span>Ходы: <strong>${moves}</strong></span><span>Пары: <strong>${matches}/${pairs.length}</strong></span>`;
    }

    deck.forEach((emoji, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "fun-memory-card";
      card.dataset.emoji = emoji;
      card.dataset.index = String(index);
      card.setAttribute("aria-label", "Закрытая карточка");
      card.addEventListener("click", () => {
        if (lock || card.classList.contains("is-open") || card.classList.contains("is-matched")) return;
        card.classList.add("is-open");
        card.textContent = emoji;
        card.setAttribute("aria-label", `Эмоция ${emoji}`);
        open.push(card);
        if (open.length < 2) return;
        moves += 1;
        paintScore();
        const [a, b] = open;
        if (a.dataset.emoji === b.dataset.emoji) {
          a.classList.add("is-matched");
          b.classList.add("is-matched");
          a.disabled = true;
          b.disabled = true;
          open = [];
          matches += 1;
          paintScore();
          if (matches === pairs.length) {
            api.setStatus(`Все пары найдены за ${moves} ходов. Рабочая память в деле.`);
          }
        } else {
          lock = true;
          setTimeout(() => {
            a.classList.remove("is-open");
            b.classList.remove("is-open");
            a.textContent = "";
            b.textContent = "";
            a.setAttribute("aria-label", "Закрытая карточка");
            b.setAttribute("aria-label", "Закрытая карточка");
            open = [];
            lock = false;
          }, 650);
        }
      });
      grid.appendChild(card);
    });

    paintScore();
    api.setStatus("Найдите пары настроений.");
    return () => {
      lock = true;
      grid.innerHTML = "";
    };
  }

  /* ——— Reaction ——— */
  function mountReaction(board, api) {
    let phase = "idle"; // idle | wait | go
    let goAt = 0;
    let timer = 0;
    const times = [];

    const scoreEl = document.createElement("div");
    scoreEl.className = "fun-score";
    const pad = document.createElement("button");
    pad.type = "button";
    pad.className = "fun-reaction-pad";
    pad.textContent = "Нажмите, чтобы начать";
    board.append(scoreEl, pad);

    function paintScore() {
      if (!times.length) {
        scoreEl.innerHTML = `<span>Попытки: <strong>0</strong></span>`;
        return;
      }
      const last = times[times.length - 1];
      const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
      scoreEl.innerHTML = `<span>Последняя: <strong>${last} мс</strong></span><span>Средняя: <strong>${avg} мс</strong></span><span>n=<strong>${times.length}</strong></span>`;
    }

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
    }

    function armWait() {
      phase = "wait";
      pad.className = "fun-reaction-pad is-wait";
      pad.textContent = "Ждите зелёного…";
      api.setStatus("Не нажимайте раньше времени.");
      const delay = 1200 + Math.random() * 2800;
      clearTimer();
      timer = setTimeout(() => {
        phase = "go";
        goAt = performance.now();
        pad.className = "fun-reaction-pad is-go";
        pad.textContent = "Жмите!";
      }, delay);
    }

    pad.addEventListener("click", () => {
      if (phase === "idle") {
        armWait();
        return;
      }
      if (phase === "wait") {
        clearTimer();
        phase = "idle";
        pad.className = "fun-reaction-pad is-fail";
        pad.textContent = "Рано! Нажмите, чтобы снова";
        api.setStatus("Фальстарт — подождите зелёный сигнал.");
        return;
      }
      if (phase === "go") {
        const ms = Math.round(performance.now() - goAt);
        times.push(ms);
        if (times.length > 12) times.shift();
        paintScore();
        phase = "idle";
        pad.className = "fun-reaction-pad";
        pad.textContent = `${ms} мс — ещё раз?`;
        api.setStatus(ms < 250 ? "Очень быстро." : ms < 350 ? "Хороший результат." : "Можно ещё чуть быстрее.");
      }
    });

    paintScore();
    return () => {
      clearTimer();
      phase = "idle";
    };
  }

  /* ——— Breath ——— */
  function mountBreath(board, api) {
    const wrap = document.createElement("div");
    wrap.className = "fun-breath-wrap";
    const orb = document.createElement("div");
    orb.className = "fun-breath-orb";
    const label = document.createElement("div");
    label.className = "fun-breath-label";
    wrap.append(orb, label);
    board.appendChild(wrap);

    // 4s in, 4s hold, 4s out — cycle 12s
    const cycle = 12000;
    let start = performance.now();
    let running = true;

    function frame(now) {
      if (!running) return;
      const t = ((now - start) % cycle) / cycle;
      let scale = 0.72;
      let text = "Вдох";
      if (t < 1 / 3) {
        const p = t * 3;
        scale = 0.72 + p * 0.55;
        text = "Вдох";
      } else if (t < 2 / 3) {
        scale = 1.27;
        text = "Пауза";
      } else {
        const p = (t - 2 / 3) * 3;
        scale = 1.27 - p * 0.55;
        text = "Выдох";
      }
      orb.style.transform = `scale(${scale.toFixed(3)})`;
      label.textContent = text;
      rafId = requestAnimationFrame(frame);
    }

    api.setStatus("Следуйте за кругом. Можно закрыть в любой момент.");
    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelLoop();
    };
  }

  function init() {
    // Capture phase so site-wide click handlers cannot swallow "Играть"
    document.addEventListener(
      "click",
      (event) => {
        const btn = event.target.closest("[data-fun-open]");
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const id = btn.getAttribute("data-fun-open") || btn.dataset.funOpen;
        if (id) openGame(id);
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.AzimutFun = { open: openGame, close: closeGame };
})();
