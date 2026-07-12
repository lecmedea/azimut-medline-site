(function () {
  function getArticleIndex() {
    return window.AZIMUT_ARTICLES_INDEX || window.AZIMUT_ARTICLES || [];
  }

  function getArticleContent(slug) {
    var contentMap = window.AZIMUT_ARTICLES_CONTENT;
    if (contentMap && contentMap[slug]) return contentMap[slug];
    var legacy = (window.AZIMUT_ARTICLES || []).find(function (item) { return item.slug === slug; });
    if (!legacy) return null;
    return {
      blocks: legacy.content || [],
      faq: legacy.faq || []
    };
  }

  function getArticle() {
    var params = new URLSearchParams(location.search);
    var slug = params.get("slug") || "panic-attacks";
    var meta = getArticleIndex().find(function (item) { return item.slug === slug; });
    if (!meta) meta = getArticleIndex()[0];
    if (!meta) return null;
    var body = getArticleContent(meta.slug) || {};
    return Object.assign({}, meta, body);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderImageSlot(slot, caption, extraClass) {
    var label = escapeHtml(slot || "article-image");
    var cap = caption ? "<figcaption>" + escapeHtml(caption) + "</figcaption>" : "";
    return (
      '<figure class="article-image-slot' + (extraClass ? " " + extraClass : "") + '" data-image-slot="' + label + '" data-image-pending="true">' +
        '<div class="article-image-slot__frame" data-slot-label="' + label + '" role="img" aria-label="Место для иллюстрации"></div>' +
        cap +
      "</figure>"
    );
  }

  function renderBlock(block, article) {
    if (!block) return "";
    if (typeof block === "string") return "<p>" + escapeHtml(block) + "</p>";

    switch (block.type) {
      case "paragraph":
        return "<p>" + escapeHtml(block.text) + "</p>";
      case "heading":
        return "<h2>" + escapeHtml(block.text) + "</h2>";
      case "list":
        return "<ul>" + (block.items || []).map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        }).join("") + "</ul>";
      case "image-slot":
        if (article && article.image) {
          var alt = block.caption || article.title || "Иллюстрация к статье";
          var cap = block.caption ? "<figcaption>" + escapeHtml(block.caption) + "</figcaption>" : "";
          return (
            '<figure class="article-image-slot">' +
              '<img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async" />' +
              cap +
            "</figure>"
          );
        }
        return renderImageSlot(block.slot, block.caption);
      case "callout":
        return '<aside class="article-callout"><p>' + escapeHtml(block.text) + "</p></aside>";
      default:
        return "";
    }
  }

  function renderArticleHero(article) {
    if (article.image) {
      return (
        '<img class="article-hero-image" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'assets/images/azimut-consultation-room.jpg\'" />'
      );
    }
    if (article.imageSlot || article.imagePending) {
      return renderImageSlot(article.imageSlot || article.slug + "-hero", "Обложка статьи — иллюстрация будет добавлена", "article-hero-slot");
    }
    return "";
  }

  function renderArticle(target) {
    var article = getArticle();
    if (!article) {
      target.innerHTML = "<h1>Статья не найдена</h1><p>Вернитесь в блог и выберите материал из списка.</p>";
      return;
    }

    var blocks = article.blocks || article.content || [];
    document.title = article.title + " — Азимут Клиник";

    target.innerHTML =
      '<p class="eyebrow">' + escapeHtml(article.category) + "</p>" +
      "<h1>" + escapeHtml(article.title) + "</h1>" +
      '<div class="article-meta">' + new Date(article.date).toLocaleDateString("ru-RU") + " · " + escapeHtml(article.readTime) + "</div>" +
      renderArticleHero(article) +
      blocks.map(function (block) { return renderBlock(block, article); }).join("") +
      '<div class="faq-block">' +
        "<h2>Частые вопросы</h2>" +
        (article.faq || []).map(function (pair) {
          return '<div class="faq-item"><h3>' + escapeHtml(pair[0]) + "</h3><p>" + escapeHtml(pair[1]) + "</p></div>";
        }).join("") +
      "</div>";
  }

  function initFilters() {
    var articleList = document.querySelector('[data-render="articles"]');
    if (!articleList || !window.AzimutRender) return;

    document.querySelectorAll(".tabs [data-category]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.querySelectorAll(".tabs [data-category]").forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
        window.AzimutRender.renderArticles(articleList, button.dataset.category);
        updateArticlesCount(button.dataset.category);
      });
    });

    document.querySelectorAll(".blog-topic-chips [data-category]").forEach(function (button) {
      button.addEventListener("click", function () {
        var category = button.dataset.category;
        document.querySelectorAll(".tabs [data-category]").forEach(function (tab) {
          tab.classList.toggle("active", tab.dataset.category === category);
        });
        window.AzimutRender.renderArticles(articleList, category);
        updateArticlesCount(category);
        articleList.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
    });

    updateArticlesCount("all");
  }

  function updateArticlesCount(category) {
    var counter = document.querySelector("[data-articles-count]");
    if (!counter) return;
    var items = getArticleIndex();
    if (category && category !== "all") {
      items = items.filter(function (item) { return item.category === category; });
    }
    counter.textContent = items.length + " " + pluralizeArticles(items.length);
  }

  function pluralizeArticles(count) {
    var mod10 = count % 10;
    var mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "статья";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "статьи";
    return "статей";
  }

  window.AzimutBlog = {
    renderArticle: renderArticle,
    getArticleIndex: getArticleIndex
  };

  document.addEventListener("DOMContentLoaded", initFilters);
})();