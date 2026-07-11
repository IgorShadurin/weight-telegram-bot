import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/db/store.js';
import { createServer } from '../src/server.js';
import { TelegramService } from '../src/telegram/service.js';

describe('HTTP server', () => {
  const config = loadConfig({ botToken: '123:test', webhookSecret: 'secret' });
  let store: Store;
  let server: ReturnType<typeof createServer>;
  beforeEach(() => {
    store = new Store();
    const telegram = new TelegramService(config.botToken, store, config);
    server = createServer({ config, store, telegram });
  });
  afterEach(async () => {
    await server.close();
    store.close();
  });

  it('reports database health', async () => {
    const response = await server.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('rejects invalid webhook secrets before processing payloads', async () => {
    const response = await server.inject({
      method: 'POST', url: '/telegram/webhook',
      headers: { 'x-telegram-bot-api-secret-token': 'wrong' },
      payload: { update_id: 1 },
    });
    expect(response.statusCode).toBe(401);
  });
});
