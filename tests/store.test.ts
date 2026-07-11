import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../src/db/store.js';

describe('Store', () => {
  let store: Store;
  beforeEach(() => {
    store = new Store();
    store.upsertUser({ telegramUserId: '1', displayName: 'Test', defaultLanguage: 'ru', now: '2026-07-08T10:00:00Z' });
    store.upsertChat('-100', 'supergroup', 'Test group', '2026-07-08T10:00:00Z');
  });
  afterEach(() => store.close());

  function create(photo = 'photo-1', targetDate = '2026-07-21') {
    return store.createGoal({
      telegramUserId: '1', chatId: '-100', threadId: null,
      startDate: '2026-07-08', startWeightGrams: 92_000,
      targetWeightGrams: 80_000, targetDate,
      initialPhotoUniqueId: photo, now: '2026-07-08T10:00:00Z', timezone: 'Europe/Minsk',
    });
  }

  it('keeps replaced goals and only one active goal', () => {
    const oldGoal = create();
    const newGoal = create('photo-2', '2026-08-31');
    expect(store.getGoal(oldGoal.id)?.status).toBe('replaced');
    expect(store.getGoal(oldGoal.id)?.replacedByGoalId).toBe(newGoal.id);
    expect(store.getActiveGoal('1')?.id).toBe(newGoal.id);
  });

  it('records all points and passes a period once', () => {
    const goal = create();
    const first = store.getPeriods(goal.id)[0]!;
    const failed = store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-10', weightGrams: first.targetWeightGrams + 100,
      photoUniqueId: 'photo-2', now: '2026-07-10T08:00:00Z',
    });
    expect(failed.justPassed).toBe(false);
    const passed = store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-11', weightGrams: first.targetWeightGrams,
      photoUniqueId: 'photo-3', now: '2026-07-11T08:00:00Z',
    });
    expect(passed.justPassed).toBe(true);
    const repeated = store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-12', weightGrams: first.targetWeightGrams - 100,
      photoUniqueId: 'photo-4', now: '2026-07-12T08:00:00Z',
    });
    expect(repeated.justPassed).toBe(false);
    expect(store.getWeighIns(goal.id)).toHaveLength(4);
  });

  it('rejects reused photo evidence', () => {
    create();
    expect(() => store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-09', weightGrams: 90_000,
      photoUniqueId: 'photo-1', now: '2026-07-09T08:00:00Z',
    })).toThrow('DUPLICATE_PHOTO');
  });

  it('marks final goal achieved early', () => {
    const goal = create();
    const result = store.recordCheckIn({
      telegramUserId: '1', chatId: '-100', localDate: '2026-07-10', weightGrams: 79_900,
      photoUniqueId: 'photo-win', now: '2026-07-10T08:00:00Z',
    });
    expect(result.goalAchieved).toBe(true);
    expect(store.getGoal(goal.id)?.status).toBe('achieved');
  });
});

describe('Store migrations', () => {
  it('adds Chinese to the language constraint without losing legacy users', () => {
    const directory = mkdtempSync(join(tmpdir(), 'weight-bot-'));
    const filename = join(directory, 'legacy.sqlite');
    const legacy = new Database(filename);
    legacy.exec(`
      CREATE TABLE users (
        telegram_user_id TEXT PRIMARY KEY,
        username TEXT,
        display_name TEXT NOT NULL,
        language TEXT NOT NULL CHECK(language IN ('ru', 'en')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO users VALUES ('legacy', NULL, 'Legacy User', 'ru', '2026-01-01', '2026-01-01');
    `);
    legacy.close();

    const migrated = new Store(filename);
    try {
      expect(migrated.getUser('legacy')?.displayName).toBe('Legacy User');
      migrated.setLanguage('legacy', 'zh', '2026-07-11T10:00:00Z');
      expect(migrated.getUser('legacy')?.language).toBe('zh');
    } finally {
      migrated.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
