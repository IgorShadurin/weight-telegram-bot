import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/db/store.js';
import { Scheduler } from '../src/scheduler.js';

describe('Scheduler', () => {
  let store: Store;
  beforeEach(() => {
    store = new Store();
    store.upsertUser({ telegramUserId: '1', displayName: 'Test', defaultLanguage: 'ru', now: '2026-07-08T10:00:00Z' });
    store.upsertChat('-100', 'supergroup', 'Test', '2026-07-08T10:00:00Z');
  });
  afterEach(() => store.close());

  function create(targetDate = '2026-07-21') {
    return store.createGoal({
      telegramUserId: '1', chatId: '-100', threadId: null,
      startDate: '2026-07-08', startWeightGrams: 92_000, targetWeightGrams: 80_000,
      targetDate, initialPhotoUniqueId: 'start', now: '2026-07-08T10:00:00Z', timezone: 'Europe/Minsk',
    });
  }

  it('queues one Thursday reminder for a pending period', async () => {
    create();
    const process = vi.fn(async () => undefined);
    const scheduler = new Scheduler(store, loadConfig({ botToken: 'x', webhookSecret: 's' }), process);
    await scheduler.tick(DateTime.fromISO('2026-07-09T10:00:00', { zone: 'Europe/Minsk' }));
    await scheduler.tick(DateTime.fromISO('2026-07-09T10:00:30', { zone: 'Europe/Minsk' }));
    const jobs: any[] = store.db.prepare("SELECT * FROM outbox WHERE type = 'reminder'").all();
    expect(jobs).toHaveLength(1);
    expect(process).toHaveBeenCalledTimes(2);
  });

  it('does not remind after the current period passes', async () => {
    const goal = create();
    const period = store.getPeriods(goal.id)[0]!;
    store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-09', weightGrams: period.targetWeightGrams,
      photoUniqueId: 'pass', now: '2026-07-09T06:00:00Z',
    });
    const scheduler = new Scheduler(store, loadConfig({ botToken: 'x', webhookSecret: 's' }), async () => undefined);
    await scheduler.tick(DateTime.fromISO('2026-07-09T10:00:00', { zone: 'Europe/Minsk' }));
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'reminder'").get()).toMatchObject({ count: 0 });
  });

  it('closes a missed final partial week and fails the goal', async () => {
    const goal = create('2026-07-10');
    const scheduler = new Scheduler(store, loadConfig({ botToken: 'x', webhookSecret: 's' }), async () => undefined);
    await scheduler.tick(DateTime.fromISO('2026-07-11T00:01:00', { zone: 'Europe/Minsk' }));
    expect(store.getGoal(goal.id)?.status).toBe('failed');
    expect(store.db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE type = 'missed'").get()).toMatchObject({ count: 1 });
  });
});
