(function () {
  var batch = [
  {
    "slug": "choose-yourself-toxic-exit",
    "title": "Выбрать себя: как мягко выйти из токсичных отношений",
    "category": "Отношения",
    "date": "2026-07-13",
    "excerpt": "Токсичность редко исчезает сама. Разбираем признаки, план безопасного выхода и поддержку после разрыва.",
    "readTime": "8 минут",
    "image": "assets/blog/choose-yourself-toxic-exit-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "heal-toxic-relationship",
    "title": "Можно ли спасти токсичные отношения: когда работа над связью имеет смысл",
    "category": "Отношения",
    "date": "2026-07-13",
    "excerpt": "Не каждый конфликт — приговор. Когда пара может перестроить динамику, а когда важнее дистанция.",
    "readTime": "7 минут",
    "image": "assets/blog/heal-toxic-relationship-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "morning-anxiety-hack",
    "title": "Утренняя тревога: 5-минутный ритуал до телефона",
    "category": "Лайфхаки",
    "date": "2026-07-12",
    "excerpt": "Первые минуты дня задают тон. Простая последовательность: вода, свет, дыхание, один приоритет.",
    "readTime": "5 минут",
    "image": "assets/blog/morning-anxiety-hack-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "box-breathing-focus",
    "title": "Квадратное дыхание и заземление: лайфхак при панике",
    "category": "Лайфхаки",
    "date": "2026-07-12",
    "excerpt": "Тренд на регуляцию нервной системы. Техника 4-4-4-4 и когда она не заменяет врача.",
    "readTime": "6 минут",
    "image": "assets/blog/box-breathing-focus-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "digital-detox-2026",
    "title": "Цифровой детокс без фанатизма: JOMO вместо FOMO",
    "category": "Лайфхаки",
    "date": "2026-07-12",
    "excerpt": "Радость упущенного — не лень, а защита внимания. Как уменьшить шум ленты и не оторваться от жизни.",
    "readTime": "6 минут",
    "image": "assets/blog/digital-detox-2026-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "self-care-not-selfish",
    "title": "Забота о себе — не эгоизм: лайфхак для выгоревших",
    "category": "Лайфхаки",
    "date": "2026-07-11",
    "excerpt": "«Сначала маска на себя» — не фраза для Instagram. Микро-паузы, которые реально восстанавливают.",
    "readTime": "6 минут",
    "image": "assets/blog/self-care-not-selfish-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "dopamine-menu-hack",
    "title": "Допаминовое меню: лайфхак против прокрастинации",
    "category": "Лайфхаки",
    "date": "2026-07-11",
    "excerpt": "Список быстрых и средних «наград» для мозга. Помогает начать задачу без насилия над собой.",
    "readTime": "7 минут",
    "image": "assets/blog/dopamine-menu-hack-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "sleep-90-minute-rule",
    "title": "Правило 90 минут: лайфхак для стабильного сна",
    "category": "Лайфхаки",
    "date": "2026-07-10",
    "excerpt": "Циклы сна и почему «ещё пять минут» часто делает хуже. Мягкая настройка режима.",
    "readTime": "6 минут",
    "image": "assets/blog/sleep-90-minute-rule-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "love-yourself-practice",
    "title": "Практика «выбрать себя» каждый день: мини-привычки",
    "category": "Психология",
    "date": "2026-07-10",
    "excerpt": "Не аффирмации ради галочки. Три вопроса, которые возвращают опору на собственные ценности.",
    "readTime": "7 минут",
    "image": "assets/blog/love-yourself-practice-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "toxic-people-boundaries",
    "title": "Токсичные люди рядом: лайфхаки границ без войны",
    "category": "Отношения",
    "date": "2026-07-10",
    "excerpt": "Меньше объяснений — больше ясных правил. Фразы, тайм-ауты, поддержка.",
    "readTime": "7 минут",
    "image": "assets/blog/toxic-people-boundaries-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "body-doubling-adhd",
    "title": "Бади-даблинг: тренд для прокрастинации и СДВГ",
    "category": "Лайфхаки",
    "date": "2026-07-09",
    "excerpt": "Работать «рядом» с другим человеком — не слабость. Как организовать фокус мягко.",
    "readTime": "6 минут",
    "image": "assets/blog/body-doubling-adhd-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "rejection-sensitivity",
    "title": "Чувствительность к отказу: лайфхаки для спокойствия",
    "category": "Психология",
    "date": "2026-07-09",
    "excerpt": "RSD — популярный термин в психообразовании. Как не принимать «нет» как приговор личности.",
    "readTime": "7 минут",
    "image": "assets/blog/rejection-sensitivity-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "micro-breaks-burnout",
    "title": "Микропаузы каждые 90 минут: лайфхак от тихого выгорания",
    "category": "Лайфхаки",
    "date": "2026-07-08",
    "excerpt": "Тихое выгорание накапливается незаметно. Таймер, вода, взгляд в окно — рабочая формула.",
    "readTime": "5 минут",
    "image": "assets/blog/micro-breaks-burnout-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "inner-critic-pause",
    "title": "Внутренний критик: лайфхак «стоп-кадр»",
    "category": "Психология",
    "date": "2026-07-08",
    "excerpt": "Заметить голос критики — уже половина пути. Техника паузы перед самообвинением.",
    "readTime": "6 минут",
    "image": "assets/blog/inner-critic-pause-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "emotion-labeling",
    "title": "Назови эмоцию — снизь интенсивность: научный лайфхак",
    "category": "Лайфхаки",
    "date": "2026-07-07",
    "excerpt": "Affect labeling в исследованиях снижает активность амигдалы. Простая практика на каждый день.",
    "readTime": "6 минут",
    "image": "assets/blog/emotion-labeling-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "loneliness-connection-hack",
    "title": "Одиночество: лайфхаки контакта без принуждения",
    "category": "Психология",
    "date": "2026-07-07",
    "excerpt": "Качество связи важнее количества. Малые шаги к близости без «надо всем нравиться».",
    "readTime": "7 минут",
    "image": "assets/blog/loneliness-connection-hack-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "anger-pause-technique",
    "title": "Злость: правило 10 минут перед ответом",
    "category": "Лайфхаки",
    "date": "2026-07-06",
    "excerpt": "Импульсивная реакция дорого стоит. Лайфхак для перегретых разговоров.",
    "readTime": "5 минут",
    "image": "assets/blog/anger-pause-technique-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "financial-stress-calm",
    "title": "Финансовый стресс: лайфхаки для тревоги о деньгах",
    "category": "Психология",
    "date": "2026-07-06",
    "excerpt": "Тревога о бюджете — не «мелочь». Как вернуть ощущение контроля по шагам.",
    "readTime": "6 минут",
    "image": "assets/blog/financial-stress-calm-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "meaning-small-steps",
    "title": "Смысл жизни через маленькие шаги: лайфхак apathy",
    "category": "Психология",
    "date": "2026-07-05",
    "excerpt": "Не ждать большого откровения. Собирать смысл из действий, которые совпадают с ценностями.",
    "readTime": "7 минут",
    "image": "assets/blog/meaning-small-steps-hero.jpg",
    "imagePosition": "center"
  },
  {
    "slug": "compassion-fatigue-care",
    "title": "Сострадательное выгорание: лайфхаки для помогающих",
    "category": "Лайфхаки",
    "date": "2026-07-05",
    "excerpt": "Врачи, родственники, волонтёры — усталость от эмпатии реальна. Как восполнять ресурс.",
    "readTime": "7 минут",
    "image": "assets/blog/compassion-fatigue-care-hero.jpg",
    "imagePosition": "center"
  }
];
  window.AZIMUT_ARTICLES_INDEX = (window.AZIMUT_ARTICLES_INDEX || []).concat(batch);
})();
