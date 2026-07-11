import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('configuration', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('parses and deduplicates positive admin Telegram user IDs', () => {
    vi.stubEnv('ADMIN_TELEGRAM_USER_IDS', '580489664, 123456,580489664');
    expect(loadConfig().adminTelegramUserIds).toEqual(['580489664', '123456']);
  });

  it('rejects negative chat IDs for private admin notifications', () => {
    vi.stubEnv('ADMIN_TELEGRAM_USER_IDS', '-580489664');
    expect(() => loadConfig()).toThrow('positive Telegram user IDs');
  });
});
