(function () {
  const tracks = window.AZIMUT_AUDIO_TRACKS || [];
  if (!tracks.length) return;

  const storageKey = "azimut-audio-state";
  const audio = new Audio();
  audio.preload = "metadata";
  let index = 0;
  let collapsed = false;
  let fullRoot;
  let miniRoot;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      index = Math.min(Math.max(Number(saved.index || 0), 0), tracks.length - 1);
      audio.volume = saved.volume == null ? 0.75 : Number(saved.volume);
      audio.muted = Boolean(saved.muted);
      collapsed = Boolean(saved.collapsed);
    } catch {
      audio.volume = 0.75;
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({
      index,
      volume: audio.volume,
      muted: audio.muted,
      collapsed
    }));
  }

  function formatTime(value) {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function setTrack(nextIndex, playAfter = false) {
    index = (nextIndex + tracks.length) % tracks.length;
    audio.src = tracks[index].file;
    audio.load();
    saveState();
    renderState();
    if (playAfter) audio.play().catch(() => {});
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function controlsMarkup(compact = false) {
    return `
      <button class="player-btn" type="button" data-player="prev" aria-label="Предыдущий трек">‹</button>
      <button class="player-btn" type="button" data-player="play" aria-label="Воспроизвести или поставить на паузу">▶</button>
      <button class="player-btn" type="button" data-player="next" aria-label="Следующий трек">›</button>
      ${compact ? `<button class="player-btn" type="button" data-player="collapse" aria-label="Свернуть или развернуть плеер">⌄</button>` : ""}
    `;
  }

  function createFullPlayer(target) {
    target.innerHTML = `
      <div class="azimut-player">
        <div class="player-botanical" aria-hidden="true"></div>
        <div class="player-content">
          <div class="player-title"><span>Плейлист Азимут</span><strong data-player-title></strong></div>
          <div class="player-controls">${controlsMarkup()}</div>
          <div class="player-progress">
            <input data-player-progress type="range" min="0" max="100" value="0" aria-label="Прогресс трека">
            <div class="player-time"><span data-player-current>0:00</span><span data-player-duration>0:00</span></div>
          </div>
          <div class="player-volume">
            <button class="player-btn" type="button" data-player="mute" aria-label="Выключить или включить звук">♪</button>
            <input data-player-volume type="range" min="0" max="1" step="0.01" value="${audio.volume}" aria-label="Громкость">
          </div>
          <div class="player-playlist">${tracks.map((track, i) => `<button class="track-item" type="button" data-track="${i}"><span>${track.title}</span><small>${i + 1}</small></button>`).join("")}</div>
        </div>
      </div>
    `;
    fullRoot = target;
  }

  function createMiniPlayer() {
    miniRoot = document.createElement("div");
    miniRoot.className = `azimut-mini-player${collapsed ? " is-collapsed" : ""}`;
    miniRoot.innerHTML = `
      <div class="mini-collapsed" aria-label="Мини-плеер">
        <button class="mini-half mini-half-play" type="button" data-player="play" aria-label="Воспроизвести или поставить на паузу">▶</button>
        <button class="mini-half mini-half-expand" type="button" data-player="collapse" aria-label="Развернуть аудиоплеер" aria-expanded="${!collapsed}">⌃</button>
      </div>
      <div class="mini-row">
        <div class="mini-title">
          <span>Плейлист Азимут</span>
          <strong class="mini-track" data-player-title></strong>
        </div>
        ${controlsMarkup(true)}
      </div>
      <div class="mini-expanded">
        <div class="player-progress">
          <input data-player-progress type="range" min="0" max="100" value="0" aria-label="Прогресс трека">
          <div class="player-time"><span data-player-current>0:00</span><span data-player-duration>0:00</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(miniRoot);
  }

  function roots() {
    return [fullRoot, miniRoot].filter(Boolean);
  }

  function renderState() {
    roots().forEach((root) => {
      root.querySelectorAll("[data-player-title]").forEach((item) => item.textContent = tracks[index].title);
      root.querySelectorAll('[data-player="play"]').forEach((item) => item.textContent = audio.paused ? "▶" : "Ⅱ");
      root.querySelectorAll('[data-player="collapse"]').forEach((item) => {
        item.setAttribute("aria-expanded", String(!collapsed));
        if (item.classList.contains("mini-half-expand")) item.textContent = "⌃";
        else item.textContent = collapsed ? "⌃" : "⌄";
      });
      root.querySelectorAll("[data-player-volume]").forEach((item) => item.value = audio.volume);
      root.querySelectorAll("[data-player-current]").forEach((item) => item.textContent = formatTime(audio.currentTime));
      root.querySelectorAll("[data-player-duration]").forEach((item) => item.textContent = formatTime(audio.duration));
      root.querySelectorAll("[data-player-progress]").forEach((item) => item.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      root.querySelectorAll("[data-track]").forEach((item) => item.classList.toggle("active", Number(item.dataset.track) === index));
    });
    if (miniRoot) miniRoot.classList.toggle("is-collapsed", collapsed);
  }

  function bind(root) {
    root.addEventListener("click", (event) => {
      const action = event.target.closest("[data-player]");
      const track = event.target.closest("[data-track]");
      if (track) setTrack(Number(track.dataset.track), true);
      if (!action) return;
      const type = action.dataset.player;
      if (type === "play") togglePlay();
      if (type === "prev") setTrack(index - 1, !audio.paused);
      if (type === "next") setTrack(index + 1, !audio.paused);
      if (type === "mute") { audio.muted = !audio.muted; saveState(); renderState(); }
      if (type === "collapse") { collapsed = !collapsed; saveState(); renderState(); }
    });

    root.addEventListener("input", (event) => {
      if (event.target.matches("[data-player-progress]") && audio.duration) {
        audio.currentTime = (Number(event.target.value) / 100) * audio.duration;
      }
      if (event.target.matches("[data-player-volume]")) {
        audio.volume = Number(event.target.value);
        audio.muted = audio.volume === 0;
        saveState();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadState();
    document.querySelectorAll('[data-audio-player="full"]').forEach(createFullPlayer);
    createMiniPlayer();
    roots().forEach(bind);
    setTrack(index, false);
    ["play", "pause", "timeupdate", "durationchange", "volumechange", "loadedmetadata"].forEach((event) => audio.addEventListener(event, renderState));
    audio.addEventListener("ended", () => setTrack(index + 1, false));
    audio.addEventListener("error", () => {
      console.warn("Audio file is unavailable:", tracks[index].file);
      renderState();
    });
  });
})();
