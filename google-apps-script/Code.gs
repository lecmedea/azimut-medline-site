const AZIMUT = Object.freeze({
  spreadsheetTitle: 'Азимут Клиник — единый реестр заявок',
  timezone: 'Europe/Moscow',
  notificationEmail: 'info@azimutclinic.ru',
  dashboardSheet: 'Дашборд',
  allLeadsSheet: 'Все заявки',
  platformSheets: ['Сайт', 'Telegram', 'amoCRM'],
  referenceSheet: 'Справочники',
  helpSheet: 'Справка',
  headers: [
    'ID заявки', 'Дата и время', 'Источник', 'Платформа', 'Имя', 'Телефон',
    'Email', 'Направление', 'Комментарий', 'Статус', 'amoCRM lead ID',
    'amoCRM pipeline ID', 'amoCRM status ID', 'Telegram chat ID',
    'Telegram username', 'URL страницы', 'utm_source', 'utm_medium',
    'utm_campaign', 'utm_content', 'utm_term', 'Реферер', 'Форма',
    'Request ID', 'Согласие', 'Результат CRM', 'Доставка уведомлений',
    'Ошибка', 'Ответственный', 'Обновлено'
  ]
});

const COLORS = Object.freeze({
  brown: '#4B382F',
  taupe: '#8A7364',
  ivory: '#F4EEE5',
  sand: '#D8C4AE',
  rose: '#B9827D',
  gold: '#B99055',
  green: '#5F8067',
  red: '#B85C5C',
  white: '#FFFDFC'
});

function setupWorkbook() {
  const ss = SpreadsheetApp.getActive();
  ss.rename(AZIMUT.spreadsheetTitle);
  ss.setSpreadsheetTimeZone(AZIMUT.timezone);
  ss.setSpreadsheetLocale('ru_RU');

  const dashboard = ensureSheet_(ss, AZIMUT.dashboardSheet, 100, 20);
  const allLeads = ensureSheet_(ss, AZIMUT.allLeadsSheet, 2000, 30);
  const website = ensureSheet_(ss, 'Сайт', 2000, 30);
  const telegram = ensureSheet_(ss, 'Telegram', 2000, 30);
  const amo = ensureSheet_(ss, 'amoCRM', 2000, 30);
  const refs = ensureSheet_(ss, AZIMUT.referenceSheet, 300, 10);
  const help = ensureSheet_(ss, AZIMUT.helpSheet, 200, 10);

  [allLeads, website, telegram, amo].forEach(setupLeadSheet_);
  setupReferences_(refs);
  setupDashboard_(dashboard);
  setupHelp_(help);

  const desiredOrder = [dashboard, allLeads, website, telegram, amo, refs, help];
  desiredOrder.forEach((sheet, index) => {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(index + 1);
  });
  ss.setActiveSheet(dashboard);
  SpreadsheetApp.flush();
  return { ok: true, sheets: desiredOrder.map(sheet => sheet.getName()) };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, status: 429, error: 'busy' });

  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('LEADS_WEBHOOK_SECRET');
    if (!expectedSecret || String(payload.secret || '') !== expectedSecret) {
      return json_({ ok: false, status: 401, error: 'unauthorized' });
    }

    const lead = normalizeLead_(payload);
    const ss = SpreadsheetApp.getActive();
    const allSheet = ss.getSheetByName(AZIMUT.allLeadsSheet);
    if (!allSheet) throw new Error('Сначала выполните setupWorkbook()');

    const existingRow = findRequestRow_(allSheet, lead.requestId) || findAmoLeadRow_(allSheet, lead.amoLeadId);
    if (existingRow) return json_({ ok: true, duplicate: true, row: existingRow, leadId: lead.id });

    const row = leadToRow_(lead);
    const allRow = appendLeadRow_(allSheet, row);
    const platformSheet = ss.getSheetByName(platformSheetName_(lead));
    if (platformSheet) appendLeadRow_(platformSheet, row);

    let emailResult = 'sent';
    try {
      sendLeadEmail_(lead, ss.getUrl());
    } catch (emailError) {
      emailResult = `error: ${String(emailError.message || emailError).slice(0, 300)}`;
      allSheet.getRange(allRow, 27).setValue(emailResult);
    }

    return json_({ ok: true, row: allRow, leadId: lead.id, platform: platformSheetName_(lead), email: emailResult });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, status: 500, error: String(error.message || error).slice(0, 500) });
  } finally {
    lock.releaseLock();
  }
}

function normalizeLead_(payload) {
  const now = new Date();
  const source = clean_(payload.SOURCE_ID || payload.source || payload.sourceId || 'unknown', 120);
  const platform = clean_(payload.platform || inferPlatform_(source), 80);
  const requestId = clean_(payload.requestId || payload.REQUEST_ID || Utilities.getUuid(), 160);
  const status = clean_(payload.status || 'Новая', 80);

  return {
    id: clean_(payload.leadRegistryId || `LEAD-${Utilities.getUuid()}`, 160),
    createdAt: parseDate_(payload.submittedAt || payload.createdAt) || now,
    source,
    platform,
    name: clean_(payload.NAME || payload.name, 200),
    phone: clean_(payload.PHONE || payload.phone, 80),
    email: clean_(payload.EMAIL || payload.email, 200),
    service: clean_(payload.SELECTED_SERVICE || payload.SERVICE_TYPE || payload.DIRECTION || payload.service, 300),
    comment: clean_(payload.COMMENTS || payload.comment || payload.message, 5000),
    status,
    amoLeadId: clean_(payload.amoLeadId || payload.leadId, 80),
    amoPipelineId: clean_(payload.amoPipelineId || payload.pipelineId, 80),
    amoStatusId: clean_(payload.amoStatusId || payload.statusId, 80),
    telegramChatId: clean_(payload.TELEGRAM_CHAT_ID || payload.telegramChatId, 100),
    telegramUsername: clean_(payload.TELEGRAM_USERNAME || payload.telegramUsername, 100).replace(/^@/, ''),
    pageUrl: clean_(payload.PAGE_URL || payload.pageUrl, 1000),
    utmSource: clean_(payload.UTM_SOURCE || payload.utmSource, 300),
    utmMedium: clean_(payload.UTM_MEDIUM || payload.utmMedium, 300),
    utmCampaign: clean_(payload.UTM_CAMPAIGN || payload.utmCampaign, 300),
    utmContent: clean_(payload.UTM_CONTENT || payload.utmContent, 300),
    utmTerm: clean_(payload.UTM_TERM || payload.utmTerm, 300),
    referrer: clean_(payload.REFERRER || payload.referrer, 1000),
    formName: clean_(payload.FORM_NAME || payload.formName, 200),
    requestId,
    consent: Boolean(payload.CONSENT || payload.consent),
    crmResult: clean_(payload.crmResult, 500),
    deliveryResult: clean_(payload.deliveryResult || 'accepted', 500),
    error: clean_(payload.error || payload.crmError, 1000),
    owner: clean_(payload.owner || payload.responsibleUser, 200),
    updatedAt: now
  };
}

function leadToRow_(lead) {
  return [
    lead.id, lead.createdAt, lead.source, lead.platform, lead.name, lead.phone,
    lead.email, lead.service, lead.comment, lead.status, lead.amoLeadId,
    lead.amoPipelineId, lead.amoStatusId, lead.telegramChatId,
    lead.telegramUsername, lead.pageUrl, lead.utmSource, lead.utmMedium,
    lead.utmCampaign, lead.utmContent, lead.utmTerm, lead.referrer,
    lead.formName, lead.requestId, lead.consent, lead.crmResult,
    lead.deliveryResult, lead.error, lead.owner, lead.updatedAt
  ];
}

function appendLeadRow_(sheet, row) {
  const rowIndex = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(rowIndex, 1, 1, AZIMUT.headers.length).setValues([row]);
  sheet.getRange(rowIndex, 2).setNumberFormat('dd.mm.yyyy hh:mm:ss');
  sheet.getRange(rowIndex, 25).insertCheckboxes().setValue(Boolean(row[24]));
  sheet.getRange(rowIndex, 30).setNumberFormat('dd.mm.yyyy hh:mm:ss');
  return rowIndex;
}

function findRequestRow_(sheet, requestId) {
  if (!requestId || sheet.getLastRow() < 2) return 0;
  const match = sheet.getRange(2, 24, sheet.getLastRow() - 1, 1)
    .createTextFinder(requestId)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function findAmoLeadRow_(sheet, amoLeadId) {
  if (!amoLeadId || sheet.getLastRow() < 2) return 0;
  const match = sheet.getRange(2, 11, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(amoLeadId)).matchEntireCell(true).findNext();
  return match ? match.getRow() : 0;
}

function sendLeadEmail_(lead, spreadsheetUrl) {
  const subject = `Новая заявка: ${lead.name || lead.phone || lead.id} · ${lead.platform}`;
  const rows = [
    ['ID', lead.id], ['Дата', Utilities.formatDate(lead.createdAt, AZIMUT.timezone, 'dd.MM.yyyy HH:mm:ss')],
    ['Источник', lead.source], ['Платформа', lead.platform], ['Имя', lead.name],
    ['Телефон', lead.phone], ['Email', lead.email], ['Направление', lead.service],
    ['Комментарий', lead.comment], ['UTM source', lead.utmSource],
    ['UTM medium', lead.utmMedium], ['UTM campaign', lead.utmCampaign],
    ['Страница', lead.pageUrl], ['Telegram', lead.telegramUsername ? `@${lead.telegramUsername}` : '']
  ].filter(item => item[1]);
  const htmlRows = rows.map(item => `<tr><td style="padding:6px 12px;color:#8A7364">${escapeHtml_(item[0])}</td><td style="padding:6px 12px;color:#4B382F"><b>${escapeHtml_(item[1])}</b></td></tr>`).join('');
  const htmlBody = `<div style="font-family:Arial,sans-serif;background:#F4EEE5;padding:24px"><div style="max-width:720px;margin:auto;background:#FFFDFC;border-radius:16px;padding:24px"><h2 style="color:#4B382F">Новая заявка · Азимут Клиник</h2><table style="border-collapse:collapse;width:100%">${htmlRows}</table><p><a href="${spreadsheetUrl}" style="color:#B9827D">Открыть единый реестр заявок</a></p></div></div>`;
  const message = { to: AZIMUT.notificationEmail, subject, htmlBody, name: 'Азимут Клиник · заявки' };
  if (lead.email) message.replyTo = lead.email;
  MailApp.sendEmail(message);
}

function setupLeadSheet_(sheet) {
  if (sheet.getMaxColumns() < AZIMUT.headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), AZIMUT.headers.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, AZIMUT.headers.length).setValues([AZIMUT.headers]);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.getRange(1, 1, 1, AZIMUT.headers.length)
    .setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sheet.setRowHeight(1, 54);
  const widths = [150, 145, 130, 110, 150, 125, 170, 180, 300, 120, 115, 125, 115, 135, 145, 260, 120, 120, 150, 150, 130, 260, 150, 180, 90, 170, 180, 220, 150, 145];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');
  sheet.getRange(2, 30, sheet.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');
  sheet.getRange(2, 25, sheet.getMaxRows() - 1, 1).insertCheckboxes();
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Новая', 'В работе', 'Квалифицирована', 'Запись', 'Успешно', 'Закрыта'], true)
    .setAllowInvalid(false).build();
  sheet.getRange(2, 10, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);
  const dataRange = sheet.getRange(1, 1, sheet.getMaxRows(), AZIMUT.headers.length);
  if (!sheet.getFilter()) dataRange.createFilter();
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Новая').setBackground('#F4E2D8').setRanges([sheet.getRange('J2:J')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('В работе').setBackground('#F4E9C9').setRanges([sheet.getRange('J2:J')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Успешно').setBackground('#DDEBDD').setRanges([sheet.getRange('J2:J')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Закрыта').setBackground('#E7E2DF').setRanges([sheet.getRange('J2:J')]).build()
  ]);
  sheet.getBandings().forEach(banding => banding.remove());
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), AZIMUT.headers.length)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  sheet.getRange(1, 1, 1, AZIMUT.headers.length).setBackground(COLORS.brown).setFontColor(COLORS.white);
}

function setupReferences_(sheet) {
  sheet.clear();
  const values = [
    ['Статусы', 'Источники', 'Платформы', 'Направления'],
    ['Новая', 'Сайт', 'Сайт', 'Психиатрия'],
    ['В работе', 'Telegram bot', 'Telegram', 'Психология'],
    ['Квалифицирована', 'amoCRM webhook', 'amoCRM', 'Наркология'],
    ['Запись', 'Реклама VK', 'Email', 'Выезд'],
    ['Успешно', 'Рекомендация', '', 'Стационар'],
    ['Закрыта', 'Партнер', '', 'Реабилитация']
  ];
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange('A1:D1').setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold');
  sheet.autoResizeColumns(1, 4);
}

function setupDashboard_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.getRange('A1:T1').merge().setValue('АЗИМУТ КЛИНИК · ЕДИНЫЙ ДАШБОРД ЗАЯВОК')
    .setBackground(COLORS.brown).setFontColor(COLORS.white).setFontSize(18)
    .setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 52);
  sheet.getRange('A2:T2').merge().setValue('Данные обновляются автоматически из сайта, Telegram и amoCRM · часовой пояс: Москва')
    .setBackground(COLORS.ivory).setFontColor(COLORS.taupe).setFontSize(10);

  const cards = [
    ['A4:C4', 'A5:C6', 'Всего заявок', "=COUNTA('Все заявки'!A2:A)"],
    ['E4:G4', 'E5:G6', 'Сегодня', "=COUNTIFS('Все заявки'!B2:B,\">=\"&TODAY(),'Все заявки'!B2:B,\"<\"&TODAY()+1)"],
    ['I4:K4', 'I5:K6', 'Последние 7 дней', "=COUNTIFS('Все заявки'!B2:B,\">=\"&TODAY()-6)"],
    ['M4:O4', 'M5:O6', 'Успешные', "=COUNTIF('Все заявки'!J2:J,\"Успешно\")"],
    ['Q4:S4', 'Q5:S6', 'Конверсия', "=IFERROR(COUNTIF('Все заявки'!J2:J,\"Успешно\")/COUNTA('Все заявки'!A2:A),0)"]
  ];
  cards.forEach((card, index) => {
    sheet.getRange(card[0]).merge().setValue(card[2]).setBackground(COLORS.sand).setFontColor(COLORS.brown).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(card[1]).merge().setFormula(card[3]).setBackground(COLORS.white).setFontColor(index === 4 ? COLORS.rose : COLORS.brown).setFontSize(24).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  });
  sheet.getRange('Q5:S6').setNumberFormat('0.0%');

  sheet.getRange('A8').setFormula("=QUERY('Все заявки'!C1:C,\"select C,count(C) where C is not null group by C order by count(C) desc label C 'Источник', count(C) 'Заявки'\",1)");
  sheet.getRange('G8').setFormula("=QUERY({ARRAYFORMULA(IF('Все заявки'!B2:B=\"\",,INT('Все заявки'!B2:B))),'Все заявки'!A2:A},\"select Col1,count(Col2) where Col1 is not null group by Col1 order by Col1 label Col1 'Дата', count(Col2) 'Заявки'\",0)");
  sheet.getRange('M8').setFormula("=QUERY('Все заявки'!S1:S,\"select S,count(S) where S is not null group by S order by count(S) desc limit 10 label S 'UTM-кампания', count(S) 'Заявки'\",1)");
  sheet.getRange('A8:B20').setNumberFormat('@');
  sheet.getRange('G8:G40').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('A8:B8').setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold');
  sheet.getRange('G8:H8').setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold');
  sheet.getRange('M8:N8').setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold');
  sheet.setColumnWidths(1, 20, 105);

  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  const sourceChart = sheet.newChart().asPieChart().addRange(sheet.getRange('A8:B20'))
    .setOption('title', 'Заявки по источникам').setOption('pieHole', 0.55)
    .setOption('colors', [COLORS.rose, COLORS.gold, COLORS.taupe, COLORS.green])
    .setPosition(22, 1, 0, 0).setOption('width', 600).setOption('height', 360).build();
  const trendChart = sheet.newChart().asLineChart().addRange(sheet.getRange('G8:H40'))
    .setOption('title', 'Динамика заявок').setOption('legend', { position: 'none' })
    .setOption('colors', [COLORS.rose]).setPosition(22, 8, 0, 0)
    .setOption('width', 660).setOption('height', 360).build();
  const utmChart = sheet.newChart().asBarChart().addRange(sheet.getRange('M8:N20'))
    .setOption('title', 'Топ UTM-кампаний').setOption('legend', { position: 'none' })
    .setOption('colors', [COLORS.gold]).setPosition(41, 1, 0, 0)
    .setOption('width', 800).setOption('height', 380).build();
  sheet.insertChart(sourceChart);
  sheet.insertChart(trendChart);
  sheet.insertChart(utmChart);
}

function setupHelp_(sheet) {
  sheet.clear();
  const rows = [
    ['СПРАВКА ПО УПРАВЛЕНИЮ РЕЕСТРОМ', ''],
    ['Назначение', 'Единый операционный реестр заявок с сайта, Telegram и amoCRM.'],
    ['Дашборд', 'Первый лист показывает объём, динамику, успешные заявки, конверсию, источники и UTM-кампании.'],
    ['Все заявки', 'Главный неизменяемый журнал. Одна строка — одна заявка. Фильтруйте данные, но не удаляйте заголовки.'],
    ['Сайт', 'Автоматическая копия заявок, полученных с форм и чат-бота сайта.'],
    ['Telegram', 'Автоматическая копия заявок от @azimut_clinic_bot.'],
    ['amoCRM', 'События, полученные из amoCRM через webhook.'],
    ['UTM', 'utm_source — площадка; utm_medium — тип трафика; utm_campaign — кампания; utm_content — креатив; utm_term — ключ/аудитория.'],
    ['Статусы', 'Меняйте статус только через выпадающий список: Новая → В работе → Квалифицирована → Запись → Успешно/Закрыта.'],
    ['Дубликаты', 'Request ID защищает от повторной записи одной и той же заявки.'],
    ['Email', 'По каждой новой заявке Apps Script отправляет уведомление на info@azimutclinic.ru.'],
    ['Безопасность', 'Не храните Telegram, amoCRM или webhook-токены в ячейках. Они находятся только в секретах сервисов.'],
    ['Ошибки', 'Колонки «Доставка уведомлений» и «Ошибка» показывают частичные сбои. Заявка всё равно остаётся в реестре.'],
    ['Обслуживание', 'Раз в неделю проверяйте ошибки, дубли и заявки без UTM; раз в месяц экспортируйте резервную копию.'],
    ['Контакты', 'По вопросам структуры: администратор проекта Azimut Clinic.']
  ];
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange('A1:B1').merge().setBackground(COLORS.brown).setFontColor(COLORS.white).setFontWeight('bold').setFontSize(16);
  sheet.getRange('A2:A15').setBackground(COLORS.ivory).setFontColor(COLORS.brown).setFontWeight('bold');
  sheet.getRange('B2:B15').setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 760);
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);
}

function ensureSheet_(ss, name, rows, columns) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < columns) sheet.insertColumnsAfter(sheet.getMaxColumns(), columns - sheet.getMaxColumns());
  return sheet;
}

function platformSheetName_(lead) {
  const haystack = `${lead.platform} ${lead.source}`.toLowerCase();
  if (haystack.includes('telegram') || haystack.includes('бот')) return 'Telegram';
  if (haystack.includes('amo')) return 'amoCRM';
  return 'Сайт';
}

function inferPlatform_(source) {
  const value = String(source || '').toLowerCase();
  if (value.includes('telegram') || value.includes('бот')) return 'Telegram';
  if (value.includes('amo')) return 'amoCRM';
  return 'Сайт';
}

function clean_(value, limit) {
  return String(value == null ? '' : value).replace(/\0/g, '').trim().slice(0, limit || 1000);
}

function parseDate_(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
