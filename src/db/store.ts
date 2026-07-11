import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Language } from '../config.js';
import { buildPeriods, periodForDate } from '../domain/periods.js';
import type {
  GoalDraft,
  GoalPeriodRecord,
  GoalRecord,
  UserRecord,
  WeighInRecord,
} from '../domain/types.js';
import { SCHEMA_SQL } from './schema.js';

function mapGoal(row: any): GoalRecord {
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    originChatId: row.origin_chat_id,
    originThreadId: row.origin_thread_id,
    startDate: row.start_date,
    startWeightGrams: row.start_weight_grams,
    targetWeightGrams: row.target_weight_grams,
    targetDate: row.target_date,
    status: row.status,
    replacedByGoalId: row.replaced_by_goal_id,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function mapPeriod(row: any): GoalPeriodRecord {
  return {
    id: row.id,
    goalId: row.goal_id,
    periodIndex: row.period_index,
    startDate: row.start_date,
    endDate: row.end_date,
    targetWeightGrams: row.target_weight_grams,
    status: row.status,
    passedAt: row.passed_at,
    closedAt: row.closed_at,
    badgeSentAt: row.badge_sent_at,
  };
}

function mapWeighIn(row: any): WeighInRecord {
  return {
    id: row.id,
    goalId: row.goal_id,
    periodId: row.period_id,
    telegramUserId: row.telegram_user_id,
    chatId: row.chat_id,
    weightGrams: row.weight_grams,
    photoUniqueId: row.photo_unique_id,
    submittedAt: row.submitted_at,
  };
}

export interface CreateGoalInput {
  telegramUserId: string;
  chatId: string;
  threadId: string | null;
  startDate: string;
  startWeightGrams: number;
  targetWeightGrams: number;
  targetDate: string;
  initialPhotoUniqueId: string;
  now: string;
  timezone: string;
}

export interface CheckInResult {
  goal: GoalRecord;
  period: GoalPeriodRecord;
  weighIn: WeighInRecord;
  justPassed: boolean;
  goalAchieved: boolean;
}

export class Store {
  readonly db: Database.Database;

  constructor(filename: string = ':memory:') {
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new Database(filename);
    this.db.exec(SCHEMA_SQL);
  }

  close(): void {
    this.db.close();
  }

  upsertUser(input: {
    telegramUserId: string;
    username?: string | null;
    displayName: string;
    defaultLanguage: Language;
    now: string;
  }): UserRecord {
    this.db.prepare(`
      INSERT INTO users (telegram_user_id, username, display_name, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_user_id) DO UPDATE SET
        username = excluded.username,
        display_name = excluded.display_name,
        updated_at = excluded.updated_at
    `).run(input.telegramUserId, input.username ?? null, input.displayName, input.defaultLanguage, input.now, input.now);
    return this.getUser(input.telegramUserId)!;
  }

  getUser(telegramUserId: string): UserRecord | null {
    const row: any = this.db.prepare('SELECT * FROM users WHERE telegram_user_id = ?').get(telegramUserId);
    if (!row) return null;
    return {
      telegramUserId: row.telegram_user_id,
      username: row.username,
      displayName: row.display_name,
      language: row.language,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  setLanguage(telegramUserId: string, language: Language, now: string): void {
    this.db.prepare('UPDATE users SET language = ?, updated_at = ? WHERE telegram_user_id = ?')
      .run(language, now, telegramUserId);
  }

  upsertChat(chatId: string, type: string, title: string | null, now: string): void {
    this.db.prepare(`
      INSERT INTO chats (chat_id, type, title, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET type = excluded.type, title = excluded.title, updated_at = excluded.updated_at
    `).run(chatId, type, title, now);
  }

  getActiveGoal(telegramUserId: string): GoalRecord | null {
    const row = this.db.prepare("SELECT * FROM goals WHERE telegram_user_id = ? AND status = 'active'")
      .get(telegramUserId);
    return row ? mapGoal(row) : null;
  }

  getGoal(goalId: string): GoalRecord | null {
    const row = this.db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
    return row ? mapGoal(row) : null;
  }

  getPeriods(goalId: string): GoalPeriodRecord[] {
    return this.db.prepare('SELECT * FROM goal_periods WHERE goal_id = ? ORDER BY period_index')
      .all(goalId).map(mapPeriod);
  }

  getPeriod(goalId: string, localDate: string): GoalPeriodRecord | null {
    return periodForDate(this.getPeriods(goalId), localDate);
  }

  getWeighIns(goalId: string): WeighInRecord[] {
    return this.db.prepare('SELECT * FROM weigh_ins WHERE goal_id = ? ORDER BY submitted_at, id')
      .all(goalId).map(mapWeighIn);
  }

  periodHasWeighIn(periodId: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM weigh_ins WHERE period_id = ? LIMIT 1').get(periodId);
    return Boolean(row);
  }

  createGoal(input: CreateGoalInput): GoalRecord {
    const definitions = buildPeriods({
      startDate: input.startDate,
      targetDate: input.targetDate,
      startWeightGrams: input.startWeightGrams,
      targetWeightGrams: input.targetWeightGrams,
      timezone: input.timezone,
    });
    const goalId = randomUUID();

    const create = this.db.transaction(() => {
      const existing = this.getActiveGoal(input.telegramUserId);
      if (existing) {
        this.db.prepare("UPDATE goals SET status = 'replaced', ended_at = ? WHERE id = ?")
          .run(input.now, existing.id);
      }
      this.db.prepare(`
        INSERT INTO goals (
          id, telegram_user_id, origin_chat_id, origin_thread_id, start_date, start_weight_grams,
          target_weight_grams, target_date, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(
        goalId, input.telegramUserId, input.chatId, input.threadId, input.startDate,
        input.startWeightGrams, input.targetWeightGrams, input.targetDate, input.now,
      );
      if (existing) {
        this.db.prepare('UPDATE goals SET replaced_by_goal_id = ? WHERE id = ?').run(goalId, existing.id);
      }

      for (const definition of definitions) {
        this.db.prepare(`
          INSERT INTO goal_periods (id, goal_id, period_index, start_date, end_date, target_weight_grams)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(), goalId, definition.periodIndex, definition.startDate,
          definition.endDate, definition.targetWeightGrams,
        );
      }

      const firstPeriod = this.getPeriods(goalId)[0]!;
      this.db.prepare(`
        INSERT INTO weigh_ins (
          id, goal_id, period_id, telegram_user_id, chat_id, weight_grams, photo_unique_id, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(), goalId, firstPeriod.id, input.telegramUserId, input.chatId,
        input.startWeightGrams, input.initialPhotoUniqueId, input.now,
      );
    });
    create();
    return this.getGoal(goalId)!;
  }

  recordCheckIn(input: {
    telegramUserId: string;
    chatId: string;
    localDate: string;
    weightGrams: number;
    photoUniqueId: string;
    now: string;
  }): CheckInResult {
    const goal = this.getActiveGoal(input.telegramUserId);
    if (!goal) throw new Error('NO_ACTIVE_GOAL');
    const period = this.getPeriod(goal.id, input.localDate);
    if (!period) throw new Error('OUTSIDE_GOAL_DATES');
    const id = randomUUID();
    const justPassed = period.status !== 'passed' && input.weightGrams <= period.targetWeightGrams;
    const goalAchieved = input.weightGrams <= goal.targetWeightGrams;

    const write = this.db.transaction(() => {
      try {
        this.db.prepare(`
          INSERT INTO weigh_ins (
            id, goal_id, period_id, telegram_user_id, chat_id, weight_grams, photo_unique_id, submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, goal.id, period.id, input.telegramUserId, input.chatId,
          input.weightGrams, input.photoUniqueId, input.now,
        );
      } catch (error) {
        if (String(error).includes('UNIQUE constraint failed')) throw new Error('DUPLICATE_PHOTO', { cause: error });
        throw error;
      }
      if (justPassed) {
        this.db.prepare("UPDATE goal_periods SET status = 'passed', passed_at = ?, closed_at = ? WHERE id = ?")
          .run(input.now, input.now, period.id);
      }
      if (goalAchieved) {
        this.db.prepare("UPDATE goals SET status = 'achieved', ended_at = ? WHERE id = ?")
          .run(input.now, goal.id);
      }
    });
    write();

    const updatedPeriod = this.db.prepare('SELECT * FROM goal_periods WHERE id = ?').get(period.id);
    return {
      goal: this.getGoal(goal.id)!,
      period: updatedPeriod ? mapPeriod(updatedPeriod) : period,
      weighIn: mapWeighIn(this.db.prepare('SELECT * FROM weigh_ins WHERE id = ?').get(id)),
      justPassed,
      goalAchieved,
    };
  }

  saveDraft(draft: GoalDraft): void {
    this.db.prepare(`
      INSERT INTO goal_drafts (telegram_user_id, payload_json, expires_at) VALUES (?, ?, ?)
      ON CONFLICT(telegram_user_id) DO UPDATE SET payload_json = excluded.payload_json, expires_at = excluded.expires_at
    `).run(draft.telegramUserId, JSON.stringify(draft), draft.expiresAt);
  }

  getDraft(telegramUserId: string, now: string): GoalDraft | null {
    const row: any = this.db.prepare('SELECT * FROM goal_drafts WHERE telegram_user_id = ?').get(telegramUserId);
    if (!row || row.expires_at <= now) {
      if (row) this.deleteDraft(telegramUserId);
      return null;
    }
    return JSON.parse(row.payload_json) as GoalDraft;
  }

  deleteDraft(telegramUserId: string): void {
    this.db.prepare('DELETE FROM goal_drafts WHERE telegram_user_id = ?').run(telegramUserId);
  }

  claimUpdate(updateId: number, now: string): boolean {
    return this.db.prepare('INSERT OR IGNORE INTO processed_updates (update_id, processed_at) VALUES (?, ?)')
      .run(updateId, now).changes === 1;
  }

  secondsUntilGraphicAllowed(telegramUserId: string, now: string, cooldownSeconds: number): number {
    const row: any = this.db.prepare('SELECT last_sent_at FROM graphic_limits WHERE telegram_user_id = ?')
      .get(telegramUserId);
    if (!row) return 0;
    const elapsed = (Date.parse(now) - Date.parse(row.last_sent_at)) / 1000;
    return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
  }

  markGraphicSent(telegramUserId: string, now: string): void {
    this.db.prepare(`
      INSERT INTO graphic_limits (telegram_user_id, last_sent_at) VALUES (?, ?)
      ON CONFLICT(telegram_user_id) DO UPDATE SET last_sent_at = excluded.last_sent_at
    `).run(telegramUserId, now);
  }

  enqueue(input: { dedupeKey: string; type: string; payload: unknown; dueAt: string; now: string }): boolean {
    return this.db.prepare(`
      INSERT OR IGNORE INTO outbox (id, dedupe_key, type, payload_json, due_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), input.dedupeKey, input.type, JSON.stringify(input.payload), input.dueAt, input.now).changes === 1;
  }

  dueOutbox(now: string, limit = 50): Array<{ id: string; type: string; payload: any; attempts: number }> {
    return (this.db.prepare(`
      SELECT * FROM outbox WHERE processed_at IS NULL AND due_at <= ? ORDER BY due_at LIMIT ?
    `).all(now, limit) as any[]).map((row) => ({
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload_json),
      attempts: row.attempts,
    }));
  }

  completeOutbox(id: string, now: string): void {
    this.db.prepare('UPDATE outbox SET processed_at = ? WHERE id = ?').run(now, id);
  }

  failOutbox(id: string, error: string, retryAt: string): void {
    this.db.prepare('UPDATE outbox SET attempts = attempts + 1, last_error = ?, due_at = ? WHERE id = ?')
      .run(error.slice(0, 500), retryAt, id);
  }

  activeGoals(): GoalRecord[] {
    return this.db.prepare("SELECT * FROM goals WHERE status = 'active'").all().map(mapGoal);
  }

  markPeriodMissed(periodId: string, now: string): boolean {
    return this.db.prepare("UPDATE goal_periods SET status = 'missed', closed_at = ? WHERE id = ? AND status = 'pending'")
      .run(now, periodId).changes === 1;
  }

  failGoal(goalId: string, now: string): boolean {
    return this.db.prepare("UPDATE goals SET status = 'failed', ended_at = ? WHERE id = ? AND status = 'active'")
      .run(now, goalId).changes === 1;
  }

  markBadgeSent(periodId: string, now: string): void {
    this.db.prepare('UPDATE goal_periods SET badge_sent_at = ? WHERE id = ?').run(now, periodId);
  }
}
