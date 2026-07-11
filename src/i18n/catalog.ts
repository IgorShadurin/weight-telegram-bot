import type { Language } from '../config.js';

type Copy = Record<Language, string>;

const copy: Record<string, Copy> = {
  privateOnly: {
    ru: 'Я работаю только в групповых чатах. Добавьте меня в группу и упомяните @{{bot}}.\n\nI work only in group chats. Add me to a group and mention @{{bot}}.',
    en: 'I work only in group chats. Add me to a group and mention @{{bot}}.\n\nЯ работаю только в групповых чатах. Добавьте меня в группу и упомяните @{{bot}}.',
  },
  welcome: {
    ru: 'Привет! Я веду цель по весу прямо в группе.\n🇷🇺 Выберите язык и пришлите фото с подписью: @{{bot}} 92 кг.\n🇬🇧 Choose a language, then send a photo captioned: @{{bot}} 92 kg.',
    en: 'Hello! I track a weight goal right in this group.\n🇬🇧 Choose a language, then send a photo captioned: @{{bot}} 92 kg.\n🇷🇺 Выберите язык и пришлите фото с подписью: @{{bot}} 92 кг.',
  },
  languageSet: { ru: 'Язык установлен: русский 🇷🇺', en: 'Language set to English 🇬🇧' },
  needPhotoWeight: {
    ru: 'Пришли фото с упоминанием @{{bot}} и весом в подписи. Например: <code>@{{bot}} 92.3 кг</code>.',
    en: 'Send a photo whose caption mentions @{{bot}} and contains the weight. For example: <code>@{{bot}} 92.3 kg</code>.',
  },
  needTarget: {
    ru: 'Старт: <b>{{weight}} кг</b>. Ответь на это сообщение целевым весом, например <code>80 кг</code>.',
    en: 'Start: <b>{{weight}} kg</b>. Reply to this message with the target weight, for example <code>80 kg</code>.',
  },
  needDate: {
    ru: 'Цель: <b>{{weight}} кг</b>. Теперь ответь датой, например <code>31 дек 2026</code>.',
    en: 'Target: <b>{{weight}} kg</b>. Now reply with a date, for example <code>31 Dec 2026</code>.',
  },
  badTarget: {
    ru: 'Нужен один вес от 20 до 500 кг, и он должен быть меньше стартового.',
    en: 'I need one weight from 20 to 500 kg, and it must be lower than the starting weight.',
  },
  badDate: {
    ru: 'Не понял дату. Она должна быть в будущем: <code>31.12.2026</code>, <code>2026-12-31</code> или <code>31 дек 2026</code>.',
    en: 'I could not parse that future date. Use <code>31.12.2026</code>, <code>2026-12-31</code>, or <code>31 Dec 2026</code>.',
  },
  confirmGoal: {
    ru: '{{replace}}Старт: <b>{{start}} кг</b>\nЦель: <b>{{target}} кг</b>\nДата: <b>{{date}}</b>\nПериодов: <b>{{periods}}</b>\n\nСоздать эту цель?',
    en: '{{replace}}Start: <b>{{start}} kg</b>\nTarget: <b>{{target}} kg</b>\nDate: <b>{{date}}</b>\nPeriods: <b>{{periods}}</b>\n\nCreate this goal?',
  },
  replacing: {
    ru: '⚠️ Активная цель будет заменена, но останется в истории.\n\n',
    en: '⚠️ Your active goal will be replaced but retained in history.\n\n',
  },
  goalCreated: {
    ru: '🎯 Цель активна. Текущий рубеж: <b>{{target}} кг</b> до <b>{{date}}</b>.',
    en: '🎯 Goal activated. Current checkpoint: <b>{{target}} kg</b> by <b>{{date}}</b>.',
  },
  cancelled: { ru: 'Отменено. Ничего не изменено.', en: 'Cancelled. Nothing changed.' },
  noGoal: { ru: 'Активной цели пока нет. Пришли фото с упоминанием и текущим весом, чтобы начать.', en: 'You have no active goal. Send a photo mentioning me with your current weight to begin.' },
  duplicatePhoto: { ru: 'Это фото уже использовалось. Нужна новая фотография.', en: 'That photo was already used. Please send a new one.' },
  cooldown: { ru: 'Вес записан. Новую графику можно отправить через {{seconds}} сек.', en: 'Weight saved. New graphics will be available in {{seconds}} sec.' },
  status: {
    ru: '🎯 <b>{{start}} → {{target}} кг</b> к {{goalDate}}\nСейчас: <b>{{current}} кг</b>\nРубеж недели: <b>{{weekTarget}} кг</b> до {{weekDate}}',
    en: '🎯 <b>{{start}} → {{target}} kg</b> by {{goalDate}}\nCurrent: <b>{{current}} kg</b>\nWeekly checkpoint: <b>{{weekTarget}} kg</b> by {{weekDate}}',
  },
  finalAchieved: { ru: '🏁 Финальная цель взята досрочно. Капибара снимает повязку только ради победного фото.', en: '🏁 Final goal reached early. The capybara removes the headband only for the victory photo.' },
  help: {
    ru: 'Упомяни меня с фото и весом для старта или отметки. Напиши «статус» для цели и графика, «язык» для настроек.',
    en: 'Mention me with a photo and weight to start or check in. Say “status” for your goal and chart, or “language” for settings.',
  },
};

export const variants = {
  success: {
    ru: ['Рубеж раздавлен. Весы аплодируют стоя.', 'Неделя закрыта. Жир получил уведомление о выселении.', 'Попадание в цель. Капибара уважительно кивает.', 'Вот это минус — даже ремень занервничал.', 'План выполнен. Гравитация сегодня проиграла.', 'Чекпоинт взят. Пончики объявили траур.', 'Вес принят. Ты снова быстрее календаря.', 'Красиво сработано: цифра ниже линии.', 'Неделя твоя. Весы больше не дерзят.', 'Есть контакт! Цель недели капитулировала.'],
    en: ['Checkpoint crushed. The scale is applauding.', 'Week cleared. The fat got an eviction notice.', 'Bullseye. The capybara nods respectfully.', 'That drop made your belt nervous.', 'Plan complete. Gravity lost today.', 'Checkpoint taken. Donuts declared mourning.', 'Weight accepted. You outran the calendar again.', 'Clean work: the number is below the line.', 'This week is yours. The scale stopped talking back.', 'Direct hit! The weekly target surrendered.'],
  },
  fail: {
    ru: ['До рубежа не дотянули. Капибара уже точит сарказм.', 'Цифра выше плана. Холодильник подозрительно молчит.', 'Пока мимо. Весы выиграли раунд, не бой.', 'Рубеж устоял. Есть время прийти за реваншем.', 'Сегодня линия сверху смотрит осуждающе.', 'Вес записан, но план просит дубль два.', 'Не зачёт. Капибара прячет медаль обратно.', 'Чуть больше нужного. Неделя ещё не закрыта.', 'Цель увернулась. Попробуй поймать её следующим фото.', 'Весы наглеют. Самое время испортить им настроение.'],
    en: ['Not at the checkpoint yet. The capybara is sharpening its sarcasm.', 'Above plan. The fridge is suspiciously quiet.', 'Missed for now. The scale won a round, not the fight.', 'The checkpoint survived. There is time for a rematch.', 'Today the goal line is judging from above.', 'Weight saved, but the plan wants take two.', 'No badge yet. The capybara put the medal back.', 'A little over. This week is still open.', 'The target dodged. Catch it with the next photo.', 'The scale is getting cocky. Ruin its mood.'],
  },
  missing: {
    ru: ['Неделя закончилась, а фото ушло за хлебом и не вернулось.', 'Чек-ин пропущен. Капибара записала это в толстую папку.', 'Весы не получили свидетеля. Неделя без значка.', 'Фото не пришло — жир воспользовался алиби.', 'Тишина всю неделю. Даже холодильник дал показания.', 'Рубеж закрыт без отчёта. Капибара недовольно сопит.', 'Нет фото, нет цифры, нет медали. Суровая бухгалтерия.', 'Неделя исчезла без чекина, как носок из стиралки.', 'Отчёт не найден. Поисковая капибара сдаётся.', 'Дедлайн прошёл. Весы празднуют техническую победу.'],
    en: ['The week ended; the photo went for milk and never returned.', 'Check-in missed. The capybara put it in the thick file.', 'The scale got no witness. No badge this week.', 'No photo arrived, so the fat used an alibi.', 'Silence all week. Even the fridge gave a statement.', 'Checkpoint closed without a report. The capybara snorts.', 'No photo, no number, no medal. Brutal accounting.', 'The week vanished like a sock in the washer.', 'Report not found. Search-capibara gives up.', 'Deadline passed. The scale claims a technical victory.'],
  },
  reminder: {
    ru: ['Четверг зовёт: до воскресенья нужен вес ≤ {{target}} кг.', 'Пинг от капибары: недельный рубеж {{target}} кг ждёт фото.', 'До финиша недели недалеко. Цель — {{target}} кг или меньше.', 'Весы скучают. Покажи им ≤ {{target}} кг до конца недели.', 'Четверговый тык: рубеж недели {{target}} кг.', 'Пора готовить фотодоказательство. План: ≤ {{target}} кг.', 'Капибара напоминает без лишней драмы: {{target}} кг.', 'Неделя почти убежала. Поймай {{target}} кг до воскресенья.', 'Фото ещё можно успеть. Рубеж: {{target}} кг.', 'Четверг. Самое время объяснить весам, кто тут главный: ≤ {{target}} кг.'],
    en: ['Thursday calling: reach ≤ {{target}} kg by Sunday.', 'Capybara ping: the {{target}} kg checkpoint wants a photo.', 'The weekly finish is close. Target: {{target}} kg or less.', 'The scale is bored. Show it ≤ {{target}} kg this week.', 'Thursday poke: this week’s checkpoint is {{target}} kg.', 'Prepare the photo evidence. Plan: ≤ {{target}} kg.', 'No-drama capybara reminder: {{target}} kg.', 'The week is escaping. Catch {{target}} kg by Sunday.', 'There is still time for a photo. Checkpoint: {{target}} kg.', 'Thursday. Time to tell the scale who is boss: ≤ {{target}} kg.'],
  },
} as const;

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{{(\w+)}}/g, (_, key: string) => String(values[key] ?? ''));
}

export function t(language: Language, key: keyof typeof copy, values: Record<string, string | number> = {}): string {
  return interpolate(copy[key]![language], values);
}

export function variant(
  language: Language,
  category: keyof typeof variants,
  seed: string,
  values: Record<string, string | number> = {},
): string {
  const list = variants[category][language];
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return interpolate(list[hash % list.length]!, values);
}
