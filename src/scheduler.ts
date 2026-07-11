import { DateTime } from 'luxon';
import type { AppConfig } from './config.js';
import { formatKg } from './domain/periods.js';
import { Store } from './db/store.js';

export class Scheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly store: Store,
    private readonly config: AppConfig,
    private readonly processOutbox: (now: DateTime) => Promise<void>,
  ) {}

  start(): void {
    if (this.timer) return;
    void this.tick(DateTime.now());
    this.timer = setInterval(() => void this.tick(DateTime.now()), 30_000);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(nowInput: DateTime): Promise<void> {
    const now = nowInput.setZone(this.config.timezone);
    const nowIso = now.toUTC().toISO()!;
    const localDate = now.toISODate()!;

    for (const goal of this.store.activeGoals()) {
      const user = this.store.getUser(goal.telegramUserId);
      if (!user) continue;
      const periods = this.store.getPeriods(goal.id);
      const current = periods.find((period) => localDate >= period.startDate && localDate <= period.endDate);

      if (
        current && current.status !== 'passed' && now.weekday === this.config.reminderWeekday &&
        now.hour === this.config.reminderHour && now.minute === this.config.reminderMinute
      ) {
        this.store.enqueue({
          dedupeKey: `reminder:${goal.id}:${current.periodIndex}`,
          type: 'reminder',
          payload: {
            goalId: goal.id,
            periodId: current.id,
            telegramUserId: goal.telegramUserId,
            chatId: goal.originChatId,
            threadId: goal.originThreadId,
            language: user.language,
            target: formatKg(current.targetWeightGrams),
          },
          dueAt: nowIso,
          now: nowIso,
        });
      }

      for (const period of periods.filter((item) => item.status === 'pending' && item.endDate < localDate)) {
        if (!this.store.markPeriodMissed(period.id, nowIso)) continue;
        const final = period.endDate === goal.targetDate;
        const hadSubmission = this.store.periodHasWeighIn(period.id);
        if (final) this.store.failGoal(goal.id, nowIso);
        this.store.enqueue({
          dedupeKey: `missed:${goal.id}:${period.periodIndex}`,
          type: 'missed',
          payload: {
            goalId: goal.id,
            periodId: period.id,
            telegramUserId: goal.telegramUserId,
            chatId: goal.originChatId,
            threadId: goal.originThreadId,
            language: user.language,
            final,
            hadSubmission,
          },
          dueAt: nowIso,
          now: nowIso,
        });
      }
    }

    await this.processOutbox(now);
  }
}
