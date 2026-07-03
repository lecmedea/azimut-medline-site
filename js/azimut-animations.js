(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = ".hero, .page-hero, .hero-banners-section, .premium-accordion-section, .specialists-section, .conditions-section, .formats-section, .directions-section, .you-alone-section, .order-panel-section, .audio-section, .cta-band, .site-footer";

  function createPathLayer() {
    return `
      <div class="azimut-clear-path" aria-hidden="true">
        <svg viewBox="0 0 1200 420" preserveAspectRatio="none">
          <path d="M-40 330 C 180 250, 260 390, 420 240 S 720 80, 900 180 S 1090 300, 1240 120"></path>
          <circle cx="420" cy="240" r="8"></circle>
          <circle cx="900" cy="180" r="8"></circle>
        </svg>
      </div>
    `;
  }

  function addBackgrounds() {
    document.querySelectorAll(targets).forEach((section) => {
      if (section.querySelector(".purification-bg")) return;
      const bg = document.createElement("div");
      bg.className = "purification-bg";
      bg.innerHTML = `
        <div class="purification-layer" aria-hidden="true"></div>
        <div class="purification-mist" aria-hidden="true"></div>
        ${createPathLayer()}
        <canvas class="purification-particles" aria-hidden="true"></canvas>
        <div class="botanical-corner" aria-hidden="true"></div>
      `;
      section.prepend(bg);
    });
  }

  function initClarityScroll() {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const progress = Math.min(1, scrollY / max);
      document.documentElement.style.setProperty("--clarity-progress", progress.toFixed(3));
      document.body.classList.toggle("clarity-state", progress > 0.18);
    };
    update();
    addEventListener("scroll", update, { passive: true });
  }

  function initParticles() {
    if (reduceMotion) return;
    document.querySelectorAll(".purification-particles").forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      const particles = Array.from({ length: 14 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 1 + Math.random() * 2.2,
        s: 0.00025 + Math.random() * 0.00045,
        a: 0.18 + Math.random() * 0.24
      }));
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
        canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
      };
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.y -= p.s;
          if (p.y < -0.05) p.y = 1.05;
          ctx.beginPath();
          ctx.fillStyle = `rgba(185, 144, 89, ${p.a})`;
          ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(draw);
      };
      resize();
      addEventListener("resize", resize, { passive: true });
      draw();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    addBackgrounds();
    initClarityScroll();
    initParticles();
  });
})();
