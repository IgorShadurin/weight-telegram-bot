import type { Language } from '../config.js';

type Copy = Record<Language, string>;

const copy: Record<string, Copy> = {
  privateOnly: {
    ru: 'Я работаю только в групповых чатах. Добавьте меня в группу и упомяните @{{bot}}.\n\nI work only in group chats. Add me to a group and mention @{{bot}}.',
    en: 'I work only in group chats. Add me to a group and mention @{{bot}}.\n\nЯ работаю только в групповых чатах. Добавьте меня в группу и упомяните @{{bot}}.',
    zh: '我只在群聊中工作。请将我添加到群组并提及 @{{bot}}。\n\nI work only in group chats. Add me to a group and mention @{{bot}}.\n\nЯ работаю только в групповых чатах. Добавьте меня в группу и упомяните @{{bot}}.',
  },
  welcome: {
    ru: 'Привет! Я веду цель по весу прямо в группе.\n🇷🇺 Выберите язык и пришлите фото с подписью: @{{bot}} 92 кг.\n🇬🇧 Choose a language, then send a photo captioned: @{{bot}} 92 kg.\n🇨🇳 选择语言，然后发送照片并添加说明：@{{bot}} 92 公斤。',
    en: 'Hello! I track a weight goal right in this group.\n🇬🇧 Choose a language, then send a photo captioned: @{{bot}} 92 kg.\n🇷🇺 Выберите язык и пришлите фото с подписью: @{{bot}} 92 кг.\n🇨🇳 选择语言，然后发送照片并添加说明：@{{bot}} 92 公斤。',
    zh: '你好！我在群聊中帮你追踪减重目标。\n🇨🇳 选择语言，然后发送照片并添加说明：@{{bot}} 92 公斤。\n🇬🇧 Choose a language, then send a photo captioned: @{{bot}} 92 kg.\n🇷🇺 Выберите язык и пришлите фото с подписью: @{{bot}} 92 кг。',
  },
  languageSet: { ru: 'Язык установлен: русский 🇷🇺', en: 'Language set to English 🇬🇧', zh: '语言已设置为中文 🇨🇳' },
  needPhotoWeight: {
    ru: 'Пришли фото с упоминанием @{{bot}} и весом в подписи. Например: <code>@{{bot}} 92.3 кг</code>.',
    en: 'Send a photo whose caption mentions @{{bot}} and contains the weight. For example: <code>@{{bot}} 92.3 kg</code>.',
    zh: '发送一张照片，在说明中提及 @{{bot}} 并写上体重。例如：<code>@{{bot}} 92.3 公斤</code>。',
  },
  needTarget: {
    ru: 'Старт: <b>{{weight}} кг</b>. Ответь на это сообщение целевым весом, например <code>80 кг</code>.',
    en: 'Start: <b>{{weight}} kg</b>. Reply to this message with the target weight, for example <code>80 kg</code>.',
    zh: '起始体重：<b>{{weight}} 公斤</b>。请回复目标体重，例如 <code>80 公斤</code>。',
  },
  needDate: {
    ru: 'Цель: <b>{{weight}} кг</b>. Теперь ответь датой, например <code>31 дек 2026</code>.',
    en: 'Target: <b>{{weight}} kg</b>. Now reply with a date, for example <code>31 Dec 2026</code>.',
    zh: '目标体重：<b>{{weight}} 公斤</b>。现在回复目标日期，例如 <code>2026年12月31日</code>。',
  },
  badTarget: {
    ru: 'Нужен один вес от 20 до 500 кг, и он должен быть меньше стартового.',
    en: 'I need one weight from 20 to 500 kg, and it must be lower than the starting weight.',
    zh: '请输入 20 到 500 公斤之间的一个体重，并且必须低于起始体重。',
  },
  badDate: {
    ru: 'Не понял дату. Она должна быть в будущем: <code>31.12.2026</code>, <code>2026-12-31</code> или <code>31 дек 2026</code>.',
    en: 'I could not parse that future date. Use <code>31.12.2026</code>, <code>2026-12-31</code>, or <code>31 Dec 2026</code>.',
    zh: '无法识别日期。请输入未来日期，例如 <code>2026年12月31日</code>、<code>2026-12-31</code> 或 <code>31.12.2026</code>。',
  },
  confirmGoal: {
    ru: '{{replace}}Старт: <b>{{start}} кг</b>\nЦель: <b>{{target}} кг</b>\nДата: <b>{{date}}</b>\nПериодов: <b>{{periods}}</b>\nОбычно: <b>≈ {{grams}} г/нед.</b>\n\nСоздать эту цель?',
    en: '{{replace}}Start: <b>{{start}} kg</b>\nTarget: <b>{{target}} kg</b>\nDate: <b>{{date}}</b>\nPeriods: <b>{{periods}}</b>\nTypical week: <b>≈ {{grams}} g to lose</b>\n\nCreate this goal?',
    zh: '{{replace}}起始：<b>{{start}} 公斤</b>\n目标：<b>{{target}} 公斤</b>\n日期：<b>{{date}}</b>\n周期数：<b>{{periods}}</b>\n通常每周：<b>约减 {{grams}} 克</b>\n\n创建这个目标吗？',
  },
  replacing: {
    ru: '⚠️ Активная цель будет заменена, но останется в истории.\n\n',
    en: '⚠️ Your active goal will be replaced but retained in history.\n\n',
    zh: '⚠️ 当前目标将被替换，但仍会保留在历史记录中。\n\n',
  },
  goalCreated: {
    ru: '🎯 Цель активна. Текущий рубеж: <b>{{target}} кг</b> до <b>{{date}}</b>.',
    en: '🎯 Goal activated. Current checkpoint: <b>{{target}} kg</b> by <b>{{date}}</b>.',
    zh: '🎯 目标已启用。当前周目标：在 <b>{{date}}</b> 前达到 <b>{{target}} 公斤</b>。',
  },
  planReady: {
    ru: '🗺 Маршрут по неделям',
    en: '🗺 Weekly roadmap',
    zh: '🗺 每周路线图',
  },
  cancelled: { ru: 'Отменено. Ничего не изменено.', en: 'Cancelled. Nothing changed.', zh: '已取消，没有任何更改。' },
  wrongButtonOwner: { ru: 'Эта кнопка принадлежит другому пользователю.', en: 'This button belongs to another user.', zh: '此按钮属于其他用户。' },
  draftExpired: { ru: 'Черновик цели истёк. Начни заново.', en: 'The goal draft expired. Please start again.', zh: '目标草稿已过期，请重新开始。' },
  noGoal: { ru: 'Активной цели пока нет. Пришли фото с упоминанием и текущим весом, чтобы начать.', en: 'You have no active goal. Send a photo mentioning me with your current weight to begin.', zh: '你还没有进行中的目标。发送一张照片，提及我并写上当前体重即可开始。' },
  duplicatePhoto: { ru: 'Это фото уже использовалось. Нужна новая фотография.', en: 'That photo was already used. Please send a new one.', zh: '这张照片已经使用过了，请发送一张新照片。' },
  cooldown: { ru: 'Вес записан. Новую графику можно отправить через {{seconds}} сек.', en: 'Weight saved. New graphics will be available in {{seconds}} sec.', zh: '体重已记录。{{seconds}} 秒后可以生成新的图表。' },
  status: {
    ru: '🎯 <b>{{start}} → {{target}} кг</b> к {{goalDate}}\nСейчас: <b>{{current}} кг</b>\nРубеж недели: <b>{{weekTarget}} кг</b> до {{weekDate}}',
    en: '🎯 <b>{{start}} → {{target}} kg</b> by {{goalDate}}\nCurrent: <b>{{current}} kg</b>\nWeekly checkpoint: <b>{{weekTarget}} kg</b> by {{weekDate}}',
    zh: '🎯 <b>{{start}} → {{target}} 公斤</b>，目标日期 {{goalDate}}\n当前：<b>{{current}} 公斤</b>\n本周目标：在 {{weekDate}} 前达到 <b>{{weekTarget}} 公斤</b>',
  },
  finalAchieved: { ru: '🏁 Финальная цель взята досрочно. Капибара снимает повязку только ради победного фото.', en: '🏁 Final goal reached early. The capybara removes the headband only for the victory photo.', zh: '🏁 提前完成最终目标。水豚只为胜利照片摘下头带。' },
  finalFailed: { ru: 'Финальная дата прошла — цель закрыта как невыполненная.', en: 'The final date passed, so the goal is closed as failed.', zh: '最终日期已过，目标因未完成而关闭。' },
  help: {
    ru: 'Упомяни меня с фото и весом для старта или отметки. Напиши «статус» для цели и графика, «язык» для настроек.',
    en: 'Mention me with a photo and weight to start or check in. Say “status” for your goal and chart, or “language” for settings.',
    zh: '提及我并发送照片和体重即可开始或打卡。发送“状态”查看目标和图表，发送“语言”更改设置。',
  },
};

export const variants = {
  success: {
    ru: ['Рубеж раздавлен. Весы аплодируют стоя.', 'Неделя закрыта. Жир получил уведомление о выселении.', 'Попадание в цель. Капибара уважительно кивает.', 'Вот это минус — даже ремень занервничал.', 'План выполнен. Гравитация сегодня проиграла.', 'Чекпоинт взят. Пончики объявили траур.', 'Вес принят. Ты снова быстрее календаря.', 'Красиво сработано: цифра ниже линии.', 'Неделя твоя. Весы больше не дерзят.', 'Есть контакт! Цель недели капитулировала.'],
    en: ['Checkpoint crushed. The scale is applauding.', 'Week cleared. The fat got an eviction notice.', 'Bullseye. The capybara nods respectfully.', 'That drop made your belt nervous.', 'Plan complete. Gravity lost today.', 'Checkpoint taken. Donuts declared mourning.', 'Weight accepted. You outran the calendar again.', 'Clean work: the number is below the line.', 'This week is yours. The scale stopped talking back.', 'Direct hit! The weekly target surrendered.'],
    zh: ['周目标拿下，体重秤起立鼓掌。', '本周通关，脂肪收到搬家通知。', '正中靶心，水豚认真点头。', '这一下，腰带都开始紧张了。', '计划完成，今天重力输了。', '周目标拿下，甜甜圈宣布哀悼。', '体重已记录，你又跑赢了日历。', '漂亮，数字稳稳落在线下。', '这周归你，体重秤不敢顶嘴了。', '命中！本周目标投降。'],
  },
  fail: {
    ru: ['До рубежа не дотянули. Капибара уже точит сарказм.', 'Цифра выше плана. Холодильник подозрительно молчит.', 'Пока мимо. Весы выиграли раунд, не бой.', 'Рубеж устоял. Есть время прийти за реваншем.', 'Сегодня линия сверху смотрит осуждающе.', 'Вес записан, но план просит дубль два.', 'Не зачёт. Капибара прячет медаль обратно.', 'Чуть больше нужного. Неделя ещё не закрыта.', 'Цель увернулась. Попробуй поймать её следующим фото.', 'Весы наглеют. Самое время испортить им настроение.'],
    en: ['Not at the checkpoint yet. The capybara is sharpening its sarcasm.', 'Above plan. The fridge is suspiciously quiet.', 'Missed for now. The scale won a round, not the fight.', 'The checkpoint survived. There is time for a rematch.', 'Today the goal line is judging from above.', 'Weight saved, but the plan wants take two.', 'No badge yet. The capybara put the medal back.', 'A little over. This week is still open.', 'The target dodged. Catch it with the next photo.', 'The scale is getting cocky. Ruin its mood.'],
    zh: ['还没到本周目标，水豚正在磨练吐槽。', '数字高于计划，冰箱可疑地沉默了。', '这次没中。体重秤只赢一局，不是整场。', '目标还站着，准备下一次反击。', '今天目标线从上方审视你。', '体重已记录，但计划要求再来一次。', '暂无徽章，水豚把奖牌收回去了。', '只高一点，本周还没有结束。', '目标躲开了，下张照片把它抓住。', '体重秤开始嚣张了，去破坏它的心情。'],
  },
  missing: {
    ru: ['Неделя закончилась, а фото ушло за хлебом и не вернулось.', 'Чек-ин пропущен. Капибара записала это в толстую папку.', 'Весы не получили свидетеля. Неделя без значка.', 'Фото не пришло — жир воспользовался алиби.', 'Тишина всю неделю. Даже холодильник дал показания.', 'Рубеж закрыт без отчёта. Капибара недовольно сопит.', 'Нет фото, нет цифры, нет медали. Суровая бухгалтерия.', 'Неделя исчезла без чекина, как носок из стиралки.', 'Отчёт не найден. Поисковая капибара сдаётся.', 'Дедлайн прошёл. Весы празднуют техническую победу.'],
    en: ['The week ended; the photo went for milk and never returned.', 'Check-in missed. The capybara put it in the thick file.', 'The scale got no witness. No badge this week.', 'No photo arrived, so the fat used an alibi.', 'Silence all week. Even the fridge gave a statement.', 'Checkpoint closed without a report. The capybara snorts.', 'No photo, no number, no medal. Brutal accounting.', 'The week vanished like a sock in the washer.', 'Report not found. Search-capibara gives up.', 'Deadline passed. The scale claims a technical victory.'],
    zh: ['一周结束了，照片买牛奶后再也没回来。', '本周未打卡，水豚记进了厚厚的档案。', '体重秤没有证人，本周没有徽章。', '没有照片，脂肪成功获得不在场证明。', '整周安静得连冰箱都作证了。', '没有报告，周目标关闭，水豚不满地哼了一声。', '没照片，没数字，没奖牌。冷酷的账本。', '这一周像洗衣机里的袜子一样消失了。', '找不到报告，搜索水豚宣布放弃。', '截止时间已过，体重秤技术性获胜。'],
  },
  reminder: {
    ru: ['Четверг зовёт: до воскресенья нужен вес ≤ {{target}} кг.', 'Пинг от капибары: недельный рубеж {{target}} кг ждёт фото.', 'До финиша недели недалеко. Цель — {{target}} кг или меньше.', 'Весы скучают. Покажи им ≤ {{target}} кг до конца недели.', 'Четверговый тык: рубеж недели {{target}} кг.', 'Пора готовить фотодоказательство. План: ≤ {{target}} кг.', 'Капибара напоминает без лишней драмы: {{target}} кг.', 'Неделя почти убежала. Поймай {{target}} кг до воскресенья.', 'Фото ещё можно успеть. Рубеж: {{target}} кг.', 'Четверг. Самое время объяснить весам, кто тут главный: ≤ {{target}} кг.'],
    en: ['Thursday calling: reach ≤ {{target}} kg by Sunday.', 'Capybara ping: the {{target}} kg checkpoint wants a photo.', 'The weekly finish is close. Target: {{target}} kg or less.', 'The scale is bored. Show it ≤ {{target}} kg this week.', 'Thursday poke: this week’s checkpoint is {{target}} kg.', 'Prepare the photo evidence. Plan: ≤ {{target}} kg.', 'No-drama capybara reminder: {{target}} kg.', 'The week is escaping. Catch {{target}} kg by Sunday.', 'There is still time for a photo. Checkpoint: {{target}} kg.', 'Thursday. Time to tell the scale who is boss: ≤ {{target}} kg.'],
    zh: ['周四提醒：周日前达到 ≤ {{target}} 公斤。', '水豚提醒：{{target}} 公斤的周目标在等照片。', '本周终点快到了，目标是 {{target}} 公斤或更低。', '体重秤无聊了，本周给它看看 ≤ {{target}} 公斤。', '周四轻推：本周目标 {{target}} 公斤。', '准备照片证据，计划是 ≤ {{target}} 公斤。', '水豚无戏剧提醒：{{target}} 公斤。', '这一周快跑掉了，周日前抓住 {{target}} 公斤。', '还来得及发照片，目标：{{target}} 公斤。', '周四到了，告诉体重秤谁做主：≤ {{target}} 公斤。'],
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
