(function () {
  function initMuseum() {
    const stage = document.getElementById("museum-stage");
    if (!stage) return;

    stage.querySelectorAll("[data-toggle-pair]").forEach((btn) => {
      // ensure closed state is visible, open is hidden at start
      const closed = btn.querySelector(".museum-state.is-default");
      const opened = btn.querySelector(".museum-state.is-open");
      if (closed) closed.hidden = false;
      if (opened) opened.hidden = true;
      btn.setAttribute("aria-expanded", "false");

      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        const next = !isOpen;
        btn.setAttribute("aria-expanded", String(next));
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
