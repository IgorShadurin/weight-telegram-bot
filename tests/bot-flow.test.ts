import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/db/store.js';
import { configureBot } from '../src/telegram/bot.js';
import { TelegramService } from '../src/telegram/service.js';

describe('Telegram group behavior', () => {
  let store: Store;
  let telegram: TelegramService;
  let calls: Array<{ method: string; payload: any }>;
  const config = loadConfig({ botToken: '123:test', webhookSecret: 'secret', publicBaseUrl: 'http://localhost' });

  beforeEach(() => {
    config.adminTelegramUserIds = [];
    store = new Store();
    telegram = new TelegramService(config.botToken, store, config);
    telegram.bot.botInfo = {
      id: 999, is_bot: true, first_name: 'Weight Bot', username: 'my_weight_goal_bot',
      can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false,
      can_connect_to_business: false, has_main_web_app: false,
      has_topics_enabled: false, allows_users_to_create_topics: false,
      can_manage_bots: false, supports_join_request_queries: false,
    };
    calls = [];
    let messageId = 100;
    telegram.bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      if (method === 'answerCallbackQuery') return { ok: true, result: true } as any;
      if (method.startsWith('editMessage')) return { ok: true, result: true } as any;
      return {
        ok: true,
        result: {
          message_id: ++messageId,
          date: 1_783_700_000,
          chat: { id: -100, type: 'supergroup', title: 'Test' },
          from: telegram.bot.botInfo,
          text: (payload as any).text,
        },
      } as any;
    });
    configureBot(telegram, store, config);
  });
  afterEach(() => store.close());

  function update(updateId: number, message: Record<string, unknown>) {
    return telegram.bot.handleUpdate({
      update_id: updateId,
      message: {
        message_id: updateId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: { id: 1, is_bot: false, first_name: 'Alice', username: 'alice' },
        ...message,
      },
    } as any);
  }

  function callback(updateId: number, data: string, messageId: number) {
    return telegram.bot.handleUpdate({
      update_id: updateId,
      callback_query: {
        id: `callback-${updateId}`,
        chat_instance: 'test-chat',
        data,
        from: { id: 1, is_bot: false, first_name: 'Alice', username: 'alice' },
        message: {
          message_id: messageId,
          date: 1_783_700_000,
          chat: { id: -100, type: 'supergroup', title: 'Test' },
          from: telegram.bot.botInfo,
        },
      },
    } as any);
  }

  async function seedActiveGoal(updateId: number, photoUniqueId: string) {
    await update(updateId, { text: '@my_weight_goal_bot настройки' });
    return store.createGoal({
      telegramUserId: '1', chatId: '-100', threadId: null,
      startDate: '2026-07-13', startWeightGrams: 94_000,
      targetWeightGrams: 80_000, targetDate: '2027-12-31',
      initialPhotoUniqueId: photoUniqueId, now: '2026-07-13T09:00:00Z', timezone: 'Europe/Minsk',
    });
  }

  it('ignores an ordinary unmentioned group message', async () => {
    await update(1, { text: '88.3 kg' });
    expect(calls).toHaveLength(0);
    expect(store.getUser('1')).toBeNull();
  });

  it('uses the Telegram profile language for private-chat guidance', async () => {
    await update(30, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'ja' },
      text: '/start',
    });
    expect(calls.at(-1)?.payload.text).toContain('/status');
    expect(calls.at(-1)?.payload.text).toContain('/schedule');
    expect(calls.at(-1)?.payload.text).toContain('/ja/');
    expect(calls.at(-1)?.payload.parse_mode).toBe('HTML');
    expect(calls.at(-1)?.payload.reply_markup.inline_keyboard.flat()).toHaveLength(9);
  });

  it('changes language from the private-chat button and keeps instructions visible', async () => {
    await update(31, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'en' },
      text: '/start',
    });
    await telegram.bot.handleUpdate({
      update_id: 32,
      callback_query: {
        id: 'callback-32', chat_instance: 'private-test', data: 'lang:es:1',
        from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'en' },
        message: {
          message_id: 101, date: 1_783_700_000,
          chat: { id: 1, type: 'private', first_name: 'Alice' },
          from: telegram.bot.botInfo,
        },
      },
    } as any);

    expect(store.getUser('1')?.language).toBe('es');
    expect(calls.at(-1)?.method).toBe('editMessageText');
    expect(calls.at(-1)?.payload.text).toContain('Aquí puedes consultar tu meta activa');
    expect(calls.at(-1)?.payload.text).toContain('/es/');
    expect(calls.at(-1)?.payload.reply_markup.inline_keyboard.flat()).toHaveLength(9);
  });

  it('shows goal status and the weekly plan in private chat', async () => {
    await update(33, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'ru' },
      text: '/start',
    });
    store.upsertChat('-100', 'supergroup', 'Test', '2026-07-11T10:00:00Z');
    store.createGoal({
      telegramUserId: '1', chatId: '-100', threadId: null,
      startDate: '2026-07-11', startWeightGrams: 93_050,
      targetWeightGrams: 80_000, targetDate: '2026-12-31',
      initialPhotoUniqueId: 'private-status', now: '2026-07-11T10:00:00Z', timezone: 'Europe/Minsk',
    });

    calls.length = 0;
    await update(34, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'ru' },
      text: 'моя цель',
    });
    expect(calls.at(-1)?.method).toBe('sendPhoto');
    expect(calls.at(-1)?.payload.chat_id).toBe('1');
    expect(calls.at(-1)?.payload.caption).toContain('93.05 → 80 кг');

    store.db.prepare('DELETE FROM graphic_limits WHERE telegram_user_id = ?').run('1');
    calls.length = 0;
    await update(35, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', language_code: 'ru' },
      text: '/schedule',
    });
    expect(calls.at(-1)?.method).toBe('sendPhoto');
    expect(calls.at(-1)?.payload.chat_id).toBe('1');
    expect(calls.at(-1)?.payload.caption).toContain('План по неделям');
  });

  it('queues one safe admin notification for a newly registered user', async () => {
    config.adminTelegramUserIds = ['580489664'];
    await update(36, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: '<Alice & Bob>', username: 'alice', language_code: 'en' },
      text: '/start',
    });
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'admin-new-user'").get())
      .toMatchObject({ count: 1 });

    await telegram.processOutbox(DateTime.utc().plus({ seconds: 1 }));
    const notification = calls.at(-1)!;
    expect(notification.method).toBe('sendMessage');
    expect(notification.payload.chat_id).toBe('580489664');
    expect(notification.payload.text).toContain('&lt;Alice &amp; Bob&gt;');
    expect(notification.payload.text).toContain('Total users: <b>1</b>');
    expect(notification.payload.text).toContain('Users with goals: <b>0</b>');

    await update(37, {
      chat: { id: 1, type: 'private', first_name: 'Alice' },
      from: { id: 1, is_bot: false, first_name: 'Alice', username: 'alice', language_code: 'en' },
      text: '/help',
    });
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'admin-new-user'").get())
      .toMatchObject({ count: 1 });
  });

  it('describes a closed failed week without saying it is still open', async () => {
    await update(38, { text: '@my_weight_goal_bot настройки' });
    const dueAt = DateTime.utc().toISO()!;
    store.enqueue({
      dedupeKey: 'missed:test:1',
      type: 'missed',
      payload: {
        goalId: 'goal', periodId: 'period', telegramUserId: '1', chatId: '-100', threadId: null,
        language: 'ru', final: false, hadSubmission: true, target: '92.95',
      },
      dueAt,
      now: dueAt,
    });
    calls.length = 0;

    await telegram.processOutbox(DateTime.utc().plus({ seconds: 1 }));

    expect(calls.at(-1)?.payload.text).toContain('Недельный рубеж 92.95 кг не пройден');
    expect(calls.at(-1)?.payload.text).not.toContain('Неделя ещё не закрыта');
  });

  it('requires a mentioned photo caption and offers all supported languages', async () => {
    await update(2, { text: '@my_weight_goal_bot create goal' });
    expect(calls.filter((call) => call.method === 'sendMessage')).toHaveLength(2);
    expect(calls[0]?.payload.text).toContain('Выбери язык');
    const keyboard = calls[0]?.payload.reply_markup.inline_keyboard;
    expect(keyboard).toHaveLength(3);
    expect(keyboard.flat()).toHaveLength(9);
    expect(calls[1]?.payload.text).toContain('Пришли фото');
    expect(calls[1]?.payload.text).not.toContain('скачива');
  });

  it.each([
    ['zh', '设置', '帮助', '可用命令'],
    ['es', 'ajustes', 'ayuda', 'Comandos disponibles'],
    ['pt', 'configurações', 'ajuda', 'Comandos disponíveis'],
    ['de', 'Einstellungen', 'Hilfe', 'Verfügbare Befehle'],
    ['fr', 'paramètres', 'aide', 'Commandes disponibles'],
    ['ja', '設定', 'ヘルプ', '利用できるコマンド'],
    ['id', 'pengaturan', 'bantuan', 'Perintah yang tersedia'],
  ] as const)('stores %s selection and answers localized commands', async (language, settings, help, expected) => {
    await update(20, { text: `@my_weight_goal_bot ${settings}` });
    await callback(21, `lang:${language}:1`, 101);
    expect(store.getUser('1')?.language).toBe(language);
    await update(22, { text: `@my_weight_goal_bot ${help}` });
    expect(calls.at(-1)?.payload.text).toContain(expected);
  });

  it('starts a goal wizard and sends a fresh ForceReply for every input step', async () => {
    await update(3, {
      caption: '@my_weight_goal_bot 92 kg',
      photo: [{ file_id: 'downloadable', file_unique_id: 'unique-start', width: 1000, height: 1000 }],
    });
    const draft = store.getDraft('1', new Date().toISOString());
    expect(draft?.initialWeightGrams).toBe(92_000);
    expect(draft?.initialPhotoUniqueId).toBe('unique-start');

    await update(4, {
      text: '80 kg',
      reply_to_message: {
        message_id: draft!.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    const dateDraft = store.getDraft('1', new Date().toISOString())!;
    expect(dateDraft.targetWeightGrams).toBe(80_000);
    expect(dateDraft.promptMessageId).not.toBe(draft!.promptMessageId);
    const datePrompt = calls.at(-1)!;
    expect(datePrompt.method).toBe('sendMessage');
    expect(datePrompt.payload.reply_markup.force_reply).toBe(true);
    expect(datePrompt.payload.text).toContain('31 дек 2026');

    await update(5, {
      text: '31 дек 2026',
      reply_to_message: {
        message_id: dateDraft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    expect(store.getDraft('1', new Date().toISOString())?.targetDate).toBe('2026-12-31');
    expect(calls.at(-1)?.method).toBe('editMessageText');
    expect(calls.at(-1)?.payload.text).toContain('Создать эту цель?');
    expect(calls.at(-1)?.payload.text).toMatch(/≈ \d+ г\/нед\./u);
  });

  it('asks before replacing an active goal and keeps it when the user says no', async () => {
    const existing = await seedActiveGoal(90, 'replace-no-existing');
    calls.length = 0;

    await update(91, { text: '/goal@my_weight_goal_bot' });

    const question = calls.at(-1)!;
    expect(question.method).toBe('sendMessage');
    expect(question.payload.text).toContain('Точно заменить её новой?');
    expect(question.payload.reply_markup.inline_keyboard.flat().map((button: any) => button.callback_data))
      .toEqual(['goal:replace:1', 'goal:keep:1']);
    const confirmation = store.getDraft('1', new Date().toISOString())!;
    expect(confirmation.stage).toBe('confirm-replace');

    await callback(92, 'goal:keep:1', confirmation.promptMessageId!);

    expect(store.getActiveGoal('1')?.id).toBe(existing.id);
    expect(store.getGoal(existing.id)?.status).toBe('active');
    expect(store.getDraft('1', new Date().toISOString())).toBeNull();
    expect(calls.at(-1)?.payload.text).toContain('Ничего не изменено');
  });

  it('does not let an old replacement button alter a newer draft', async () => {
    const existing = await seedActiveGoal(95, 'replace-stale-existing');
    calls.length = 0;
    await update(96, { text: '/goal@my_weight_goal_bot' });
    const oldConfirmation = store.getDraft('1', new Date().toISOString())!;
    await update(97, { text: '/goal@my_weight_goal_bot' });
    const currentConfirmation = store.getDraft('1', new Date().toISOString())!;
    expect(currentConfirmation.promptMessageId).not.toBe(oldConfirmation.promptMessageId);

    await callback(98, 'goal:keep:1', oldConfirmation.promptMessageId!);

    expect(store.getDraft('1', new Date().toISOString())?.promptMessageId).toBe(currentConfirmation.promptMessageId);
    expect(store.getActiveGoal('1')?.id).toBe(existing.id);
    expect(calls.at(-1)?.method).toBe('answerCallbackQuery');
    expect(calls.at(-1)?.payload.text).toContain('Черновик цели истёк');
  });

  it('starts replacement from a photo reply and archives the old goal only after final confirmation', async () => {
    const existing = await seedActiveGoal(100, 'replace-reply-existing');
    calls.length = 0;
    await update(101, { text: '/goal@my_weight_goal_bot' });
    const confirmation = store.getDraft('1', new Date().toISOString())!;
    await callback(102, 'goal:replace:1', confirmation.promptMessageId!);

    let draft = store.getDraft('1', new Date().toISOString())!;
    expect(draft.intent).toBe('replace');
    expect(draft.initialWeightGrams).toBeNull();
    expect(calls.at(-1)?.payload.text).toContain('ответь фотографией на это сообщение');
    expect(store.getGoal(existing.id)?.status).toBe('active');

    await update(103, {
      caption: '93.25',
      photo: [{ file_id: 'replacement', file_unique_id: 'replace-reply-start', width: 1000, height: 1000 }],
      reply_to_message: {
        message_id: draft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    draft = store.getDraft('1', new Date().toISOString())!;
    expect(draft.initialWeightGrams).toBe(93_250);
    expect(draft.initialPhotoUniqueId).toBe('replace-reply-start');
    expect(store.getGoal(existing.id)?.status).toBe('active');

    await update(104, {
      text: '82 kg',
      reply_to_message: {
        message_id: draft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    draft = store.getDraft('1', new Date().toISOString())!;
    await update(105, {
      text: '31 Dec 2027',
      reply_to_message: {
        message_id: draft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    draft = store.getDraft('1', new Date().toISOString())!;
    expect(store.getGoal(existing.id)?.status).toBe('active');

    await callback(106, 'goal:confirm:1', draft.promptMessageId!);

    const replacement = store.getActiveGoal('1')!;
    expect(replacement.id).not.toBe(existing.id);
    expect(replacement.startWeightGrams).toBe(93_250);
    expect(store.getGoal(existing.id)).toMatchObject({
      status: 'replaced',
      replacedByGoalId: replacement.id,
    });
    expect(store.getWeighIns(existing.id)).toHaveLength(1);
  });

  it('also accepts a mentioned starting photo after replacement is approved', async () => {
    const existing = await seedActiveGoal(110, 'replace-mention-existing');
    calls.length = 0;
    await update(111, { text: '/goal@my_weight_goal_bot' });
    const confirmation = store.getDraft('1', new Date().toISOString())!;
    await callback(112, 'goal:replace:1', confirmation.promptMessageId!);

    await update(113, {
      caption: '@my_weight_goal_bot 93.1 kg',
      photo: [{ file_id: 'replacement', file_unique_id: 'replace-mention-start', width: 1000, height: 1000 }],
    });

    expect(store.getDraft('1', new Date().toISOString())).toMatchObject({
      intent: 'replace',
      initialWeightGrams: 93_100,
      initialPhotoUniqueId: 'replace-mention-start',
    });
    expect(store.getGoal(existing.id)?.status).toBe('active');
  });

  it('deduplicates repeated Telegram update IDs', async () => {
    await update(6, { text: '@my_weight_goal_bot help' });
    const count = calls.length;
    await update(6, { text: '@my_weight_goal_bot help' });
    expect(calls).toHaveLength(count);
  });

  it.each(['help', 'помощь', 'команды'])('shows the command list for %s', async (word) => {
    await update(60 + calls.length, { text: `@my_weight_goal_bot ${word}` });
    expect(calls.at(-1)?.payload.text).toContain('Доступные команды');
    expect(calls.at(-1)?.payload.text).toContain('/schedule');
    expect(calls.at(-1)?.payload.parse_mode).toBe('HTML');
  });

  it.each([
    ['/goal', 'Пришли фото'],
    ['/goal@my_weight_goal_bot', 'Пришли фото'],
    ['/status@my_weight_goal_bot', 'Активной цели пока нет'],
    ['/schedule@my_weight_goal_bot', 'Активной цели пока нет'],
    ['/settings@my_weight_goal_bot', 'Выбери язык'],
    ['/help@my_weight_goal_bot', 'Доступные команды'],
  ])('accepts the group command %s addressed to this bot', async (command, expected) => {
    await update(70 + calls.length, { text: command });
    expect(calls.at(-1)?.payload.text).toContain(expected);
  });

  it('ignores a command addressed to another bot', async () => {
    await update(80, { text: '/status@some_other_bot' });
    expect(calls).toHaveLength(0);
    expect(store.getUser('1')).toBeNull();
  });

  it('sends a weekly roadmap image immediately after goal confirmation', async () => {
    await update(10, {
      caption: '@my_weight_goal_bot 92 kg',
      photo: [{ file_id: 'downloadable', file_unique_id: 'roadmap-start', width: 1000, height: 1000 }],
    });
    let draft = store.getDraft('1', new Date().toISOString())!;
    await update(11, {
      text: '80 kg',
      reply_to_message: {
        message_id: draft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    draft = store.getDraft('1', new Date().toISOString())!;
    await update(12, {
      text: '31 Dec 2027',
      reply_to_message: {
        message_id: draft.promptMessageId,
        date: 1_783_700_000,
        chat: { id: -100, type: 'supergroup', title: 'Test' },
        from: telegram.bot.botInfo,
      },
    });
    draft = store.getDraft('1', new Date().toISOString())!;
    await callback(13, 'goal:confirm:1', draft.promptMessageId!);

    expect(store.getActiveGoal('1')).not.toBeNull();
    const roadmapCall = calls.find((call) => call.method === 'sendMediaGroup' || call.method === 'sendPhoto');
    expect(roadmapCall).toBeDefined();
  });

  it('re-normalizes and resends the stored roadmap when the user asks for the schedule', async () => {
    await update(40, { text: '@my_weight_goal_bot настройки' });
    const goal = store.createGoal({
      telegramUserId: '1', chatId: '-100', threadId: null,
      startDate: '2026-07-11', startWeightGrams: 93_050,
      targetWeightGrams: 80_000, targetDate: '2026-12-31',
      initialPhotoUniqueId: 'schedule-start', now: '2026-07-11T10:00:00Z', timezone: 'Europe/Minsk',
    });
    store.db.prepare('UPDATE goal_periods SET target_weight_grams = target_weight_grams - 75 WHERE goal_id = ? AND period_index = 3')
      .run(goal.id);

    await update(41, { text: '@my_weight_goal_bot расписание' });

    const normalized = store.getPeriods(goal.id);
    const losses = normalized.map((period, index) => {
      const previous = index === 0 ? goal.startWeightGrams : normalized[index - 1]!.targetWeightGrams;
      return previous - period.targetWeightGrams;
    });
    expect(new Set(losses.slice(1, -1))).toEqual(new Set([500, 550]));
    expect(losses.slice(1, -1)).toEqual(losses.slice(1, -1).toSorted((left, right) => right - left));
    expect(calls.at(-1)?.method).toBe('sendPhoto');
    expect(calls.at(-1)?.payload.caption).toContain('План по неделям');

    await update(42, { text: '@my_weight_goal_bot /schedule' });
    expect(calls.at(-1)?.method).toBe('sendMessage');
    expect(calls.at(-1)?.payload.text).toContain('План по неделям уже отправлялся недавно');
    expect(calls.at(-1)?.payload.text).toContain('Попробуй снова через');
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'goal-plan'").get())
      .toMatchObject({ count: 0 });
    await update(43, { text: '@my_weight_goal_bot /schedule' });
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'goal-plan'").get())
      .toMatchObject({ count: 0 });
  });
});
