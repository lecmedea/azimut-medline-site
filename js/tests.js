(function () {
  const options = [
    ["0", "Совсем нет"],
    ["1", "Несколько дней"],
    ["2", "Более половины дней"],
    ["3", "Почти каждый день"]
  ];

  const tests = {
    gad7: {
      questions: [
        "Нервозность, тревога или сильное напряжение",
        "Неспособность остановить или контролировать беспокойство",
        "Чрезмерное беспокойство по разным поводам",
        "Трудно расслабиться",
        "Беспокойство настолько сильное, что трудно усидеть на месте",
        "Раздражительность",
        "Страх, что может случиться что-то плохое"
      ],
      result(score) {
        if (score >= 15) return "Выраженная тревога. Стоит обсудить состояние со специалистом.";
        if (score >= 10) return "Умеренная тревога. Консультация может помочь разобраться с причинами и выбрать поддержку.";
        if (score >= 5) return "Лёгкие тревожные симптомы. Понаблюдайте за состоянием и обратитесь за помощью, если оно мешает жизни.";
        return "Минимальный уровень тревожных симптомов по скринингу.";
      }
    },
    phq9: {
      questions: [
        "Мало интереса или удовольствия от обычных занятий",
        "Подавленность, тоска или ощущение безнадёжности",
        "Проблемы со сном или чрезмерная сонливость",
        "Усталость или нехватка энергии",
        "Плохой аппетит или переедание",
        "Негативные мысли о себе, чувство вины или несостоятельности",
        "Трудно сосредоточиться",
        "Замедленность или, наоборот, заметная суетливость",
        "Мысли, что лучше было бы умереть или причинить себе вред"
      ],
      result(score, values) {
        if (Number(values[8] || 0) > 0) return "Есть ответ о риске самоповреждения. Пожалуйста, обратитесь за срочной помощью: 112 или 103. Онлайн-тест не заменяет экстренную службу.";
        if (score >= 20) return "Выраженные депрессивные симптомы. Рекомендуется обратиться к специалисту.";
        if (score >= 15) return "Умеренно выраженные симптомы. Консультация специалиста может быть важным шагом.";
        if (score >= 10) return "Умеренные симптомы. Лучше обсудить состояние со специалистом, особенно если оно длится больше двух недель.";
        if (score >= 5) return "Лёгкие симптомы. Понаблюдайте за состоянием и обратитесь за поддержкой, если оно мешает повседневной жизни.";
        return "Минимальный уровень депрессивных симптомов по скринингу.";
      }
    }
  };

  function renderTest(card) {
    const test = tests[card.dataset.test];
    if (!test) return;
    const root = card.querySelector("[data-test-questions]");
    root.innerHTML = test.questions.map((question, index) => `
      <fieldset class="test-question">
        <legend>${index + 1}. ${question}</legend>
        <div class="test-options">
          ${options.map(([value, label]) => `
            <label><input type="radio" name="${card.dataset.test}-${index}" value="${value}" required> ${label}</label>
          `).join("")}
        </div>
      </fieldset>
    `).join("");
    card.querySelector("[data-test-submit]").addEventListener("click", () => {
      const values = test.questions.map((_, index) => card.querySelector(`input[name="${card.dataset.test}-${index}"]:checked`)?.value);
      const result = card.querySelector(".test-result");
      if (values.some((value) => value == null)) {
        result.textContent = "Ответьте на все вопросы, чтобы увидеть результат.";
        return;
      }
      const score = values.reduce((sum, value) => sum + Number(value), 0);
      result.textContent = `${score} баллов. ${test.result(score, values)} Результат не является диагнозом.`;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-test]").forEach(renderTest);
  });
})();
