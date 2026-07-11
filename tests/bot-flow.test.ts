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
    expect(calls.at(-1)?.payload.text).toContain('グループに追加');
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
    expect(calls.at(-1)?.payload.text).toContain('Solo funciono en chats de grupo');
    expect(calls.at(-1)?.payload.text).toContain('/es/');
    expect(calls.at(-1)?.payload.reply_markup.inline_keyboard.flat()).toHaveLength(9);
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
    expect(calls.at(-1)?.method).toBe('sendPhoto');
    expect(calls.at(-1)?.payload.caption).toContain('План по неделям');

    await update(42, { text: '@my_weight_goal_bot /schedule' });
    expect(calls.at(-1)?.method).toBe('sendMessage');
    expect(calls.at(-1)?.payload.text).toContain('Новую графику можно отправить');
  });
});
