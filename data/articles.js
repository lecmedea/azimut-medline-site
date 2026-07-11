/**
 * Совместимость: объединяет индекс и контент для страниц,
 * которые ещё подключают единый articles.js.
 * blog.html и article.html используют раздельные файлы.
 */
(function () {
  var index = window.AZIMUT_ARTICLES_INDEX || [];
  var content = window.AZIMUT_ARTICLES_CONTENT || {};
  window.AZIMUT_ARTICLES = index.map(function (item) {
    var body = content[item.slug] || {};
    return Object.assign({}, item, {
      content: body.blocks || body.content || [],
      faq: body.faq || []
    });
  });
})();
