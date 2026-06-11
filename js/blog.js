(function () {
  function getArticle() {
    const params = new URLSearchParams(location.search);
    const slug = params.get("slug") || "panic-attacks";
    return (window.AZIMUT_ARTICLES || []).find((item) => item.slug === slug) || (window.AZIMUT_ARTICLES || [])[0];
  }

  function renderArticle(target) {
    const article = getArticle();
    if (!article) {
      target.innerHTML = "<h1>Статья не найдена</h1><p>Вернитесь в блог и выберите материал из списка.</p>";
      return;
    }
    document.title = `${article.title} — Азимут Медлайн`;
    target.innerHTML = `
      <p class="eyebrow">${article.category}</p>
      <h1>${article.title}</h1>
      <div class="article-meta">${new Date(article.date).toLocaleDateString("ru-RU")} · ${article.readTime}</div>
      ${article.content.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      <div class="faq-block">
        <h2>FAQ</h2>
        ${article.faq.map(([question, answer]) => `<div class="faq-item"><h3>${question}</h3><p>${answer}</p></div>`).join("")}
      </div>
    `;
  }

  function initFilters() {
    const articleList = document.querySelector('[data-render="articles"]');
    if (!articleList || !window.AzimutRender) return;
    document.querySelectorAll(".tabs [data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tabs [data-category]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        window.AzimutRender.renderArticles(articleList, button.dataset.category);
      });
    });
  }

  window.AzimutBlog = {
    renderArticle
  };

  document.addEventListener("DOMContentLoaded", initFilters);
})();
