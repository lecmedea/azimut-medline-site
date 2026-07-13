(function () {
  var batch = [
  {
    "slug": "social-anxiety-work",
    "title": "Социальная тревога на работе: как не избегать важных разговоров",
    "category": "Тревога",
    "date": "2026-07-11",
    "excerpt": "Краснение, паузы, страх оценки — знакомые сигналы. Разбираем мягкие шаги к уверенности в коллективе.",
    "readTime": "7 минут",
    "image": "assets/blog/social-anxiety-work-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "insomnia-routine",
    "title": "Бессонница: вечерний ритуал, который реально помогает засыпать",
    "category": "Психология",
    "date": "2026-07-11",
    "excerpt": "Сон — не враг продуктивности. Простые правила гигиены сна без фанатизма.",
    "readTime": "6 минут",
    "image": "assets/blog/insomnia-routine-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "ocd-intrusive-thoughts",
    "title": "ОКР и навязчивые мысли: почему «просто не думай об этом» не работает",
    "category": "Психиатрия",
    "date": "2026-07-10",
    "excerpt": "Навязчивости пугают, но поддаются терапии. Что такое ритуалы и как с ними работают.",
    "readTime": "8 минут",
    "image": "assets/blog/ocd-intrusive-thoughts-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "bipolar-mood-swings",
    "title": "Биполярное расстройство: как отличить «качели» от обычных перепадов",
    "category": "Психиатрия",
    "date": "2026-07-10",
    "excerpt": "Эйфория и провалы — не каприз. Когда стоит обсудить состояние с врачом.",
    "readTime": "7 минут",
    "image": "assets/blog/bipolar-mood-swings-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "adhd-adults-signs",
    "title": "СДВГ у взрослых: забывчивость, прокрастинация и внутренний хаос",
    "category": "Психиатрия",
    "date": "2026-07-09",
    "excerpt": "СДВГ не только у детей. Какие признаки замечают взрослые и как проходит диагностика.",
    "readTime": "7 минут",
    "image": "assets/blog/adhd-adults-signs-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "ptsd-after-accident",
    "title": "ПТСР после ДТП или травмы: когда воспоминания не отпускают",
    "category": "Психиатрия",
    "date": "2026-07-09",
    "excerpt": "Вспышки, избегание, напряжение — нормальная реакция, которую можно переработать.",
    "readTime": "8 минут",
    "image": "assets/blog/ptsd-after-accident-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "eating-disorder-help",
    "title": "Расстройства пищевого поведения: стыд, контроль и первый шаг к помощи",
    "category": "Психиатрия",
    "date": "2026-07-08",
    "excerpt": "Ограничения и переедание — не «слабость воли». Бережный маршрут обращения.",
    "readTime": "7 минут",
    "image": "assets/blog/eating-disorder-help-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "panic-at-night",
    "title": "Ночные панические атаки: что делать, когда страшно засыпать",
    "category": "Тревога",
    "date": "2026-07-08",
    "excerpt": "Ночной страх усиливает бессонницу. Техники заземления и когда звонить 103.",
    "readTime": "6 минут",
    "image": "assets/blog/panic-at-night-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "teen-self-harm-talk",
    "title": "Подросток и самоповреждение: как говорить без паники и обвинений",
    "category": "Подростки",
    "date": "2026-07-07",
    "excerpt": "Родителям важно сохранить контакт. Алгоритм разговора и срочные сигналы.",
    "readTime": "8 минут",
    "image": "assets/blog/teen-self-harm-talk-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "parent-teen-conflict",
    "title": "Конфликты с подростком: границы без войны",
    "category": "Подростки",
    "date": "2026-07-07",
    "excerpt": "Ссоры — часть взросления. Как снижать накал и оставаться опорой.",
    "readTime": "7 минут",
    "image": "assets/blog/parent-teen-conflict-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "alcohol-weekend",
    "title": "Алкоголь «только по выходным»: когда привычка становится риском",
    "category": "Наркология",
    "date": "2026-07-06",
    "excerpt": "Редкое употребление тоже может маскировать зависимость. На что смотреть.",
    "readTime": "6 минут",
    "image": "assets/blog/alcohol-weekend-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "cannabis-dependence",
    "title": "Зависимость от каннабиса: миф о «лёгком» веществе",
    "category": "Наркология",
    "date": "2026-07-06",
    "excerpt": "Снижение мотивации, тревога при отмене — реальные последствия.",
    "readTime": "7 минут",
    "image": "assets/blog/cannabis-dependence-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "family-alanon",
    "title": "Близкому человеку с зависимостью: как помогать и не сгореть",
    "category": "Наркология",
    "date": "2026-07-05",
    "excerpt": "Созависимость, границы, группы поддержки — практический гид.",
    "readTime": "8 минут",
    "image": "assets/blog/family-alanon-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "psychiatrist-first-visit",
    "title": "Первый визит к психиатру: чего ожидать и как подготовиться",
    "category": "Психиатрия",
    "date": "2026-07-05",
    "excerpt": "Анамнез, диагностика, план — без страха «навяжут таблетки».",
    "readTime": "6 минут",
    "image": "assets/blog/psychiatrist-first-visit-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "therapy-vs-meds",
    "title": "Терапия или медикаменты: как выбирают комбинированную помощь",
    "category": "Психиатрия",
    "date": "2026-07-04",
    "excerpt": "Не «или-или». Когда нужны оба подхода и кто принимает решение.",
    "readTime": "7 минут",
    "image": "assets/blog/therapy-vs-meds-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "boundaries-relationships",
    "title": "Личные границы в отношениях: как говорить «нет» без вины",
    "category": "Психология",
    "date": "2026-07-04",
    "excerpt": "Границы — не эгоизм, а условие близости. Примеры фраз и шаги.",
    "readTime": "6 минут",
    "image": "assets/blog/boundaries-relationships-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "caregiver-burnout",
    "title": "Выгорание опекуна: когда забота о близком истощает",
    "category": "Психология",
    "date": "2026-07-03",
    "excerpt": "Чувство вины, усталость, раздражение — сигналы запросить поддержку.",
    "readTime": "7 минут",
    "image": "assets/blog/caregiver-burnout-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "seasonal-depression",
    "title": "Сезонная депрессия: почему осенью и зимой тяжелее",
    "category": "Психиатрия",
    "date": "2026-07-03",
    "excerpt": "Свет, режим, активность и когда подключать специалиста.",
    "readTime": "6 минут",
    "image": "assets/blog/seasonal-depression-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "work-stress-deadline",
    "title": "Стресс перед дедлайном: как не сорваться на близких",
    "category": "Психология",
    "date": "2026-07-02",
    "excerpt": "Срочность ≠ паника. Дыхание, приоритеты, микропаузы.",
    "readTime": "5 минут",
    "image": "assets/blog/work-stress-deadline-hero.svg",
    "imagePosition": "center"
  },
  {
    "slug": "online-consult-privacy",
    "title": "Онлайн-консультация: конфиденциальность и техника связи",
    "category": "Психология",
    "date": "2026-07-02",
    "excerpt": "Как подготовить пространство, связь и что спросить у администратора.",
    "readTime": "5 минут",
    "image": "assets/blog/online-consult-privacy-hero.svg",
    "imagePosition": "center"
  }
];
  window.AZIMUT_ARTICLES_INDEX = (window.AZIMUT_ARTICLES_INDEX || []).concat(batch);
})();
