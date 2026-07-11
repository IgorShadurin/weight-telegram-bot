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

  it('ignores an ordinary unmentioned group message', async () => {
    await update(1, { text: '88.3 kg' });
    expect(calls).toHaveLength(0);
    expect(store.getUser('1')).toBeNull();
  });

  it('requires a mentioned photo caption and sends bilingual first contact', async () => {
    await update(2, { text: '@my_weight_goal_bot create goal' });
    expect(calls.filter((call) => call.method === 'sendMessage')).toHaveLength(2);
    expect(calls[0]?.payload.text).toContain('Choose a language');
    expect(calls[1]?.payload.text).toContain('одно фото');
  });

  it('starts a goal wizard from a mentioned photo and accepts a ForceReply target', async () => {
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
    expect(store.getDraft('1', new Date().toISOString())?.targetWeightGrams).toBe(80_000);
    expect(calls.some((call) => call.method === 'editMessageText')).toBe(true);
  });

  it('deduplicates repeated Telegram update IDs', async () => {
    await update(5, { text: '@my_weight_goal_bot help' });
    const count = calls.length;
    await update(5, { text: '@my_weight_goal_bot help' });
    expect(calls).toHaveLength(count);
  });
});
