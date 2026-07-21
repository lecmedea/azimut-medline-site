(function () {
  function initMuseum() {
    const stage = document.getElementById("museum-stage");
    if (!stage) return;

    stage.querySelectorAll("[data-toggle-pair]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        const next = !open;
        btn.setAttribute("aria-expanded", String(next));
        const closed = btn.querySelector(".museum-state.is-default");
        const opened = btn.querySelector(".museum-state.is-open");
        if (closed) closed.hidden = next;
        if (opened) opened.hidden = !next;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMuseum);
  } else {
    initMuseum();
  }
})();
