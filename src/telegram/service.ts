import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { Bot, InlineKeyboard, InputFile } from 'grammy';
import type { AppConfig, Language } from '../config.js';
import { Store } from '../db/store.js';
import { formatKg } from '../domain/periods.js';
import type { GoalPeriodRecord, GoalRecord } from '../domain/types.js';
import { achievementForWeek } from '../i18n/achievements.js';
import { t, variant } from '../i18n/catalog.js';
import { renderGoalChart } from '../graphics/chart.js';
import { renderGoalPlanPages } from '../graphics/plan.js';

function mention(userId: string, displayName: string): string {
  const safe = displayName.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<a href="tg://user?id=${userId}">${safe}</a>`;
}

export class TelegramService {
  readonly bot: Bot;

  constructor(
    token: string,
    private readonly store: Store,
    private readonly config: AppConfig,
  ) {
    this.bot = new Bot(token);
  }

  async sendStatus(input: {
    telegramUserId: string;
    chatId: string;
    threadId?: number;
    language: Language;
    goal: GoalRecord;
    period: GoalPeriodRecord;
    captionPrefix?: string;
    badgeWeek?: number;
  }): Promise<'sent' | number> {
    const now = DateTime.utc().toISO()!;
    const wait = this.store.secondsUntilGraphicAllowed(
      input.telegramUserId,
      now,
      this.config.graphicCooldownSeconds,
    );
    if (wait > 0) return wait;

    const periods = this.store.getPeriods(input.goal.id);
    const weighIns = this.store.getWeighIns(input.goal.id);
    const latest = weighIns.at(-1);
    const caption = [
      input.captionPrefix,
      t(input.language, 'status', {
        start: formatKg(input.goal.startWeightGrams),
        target: formatKg(input.goal.targetWeightGrams),
        goalDate: input.goal.targetDate,
        current: latest ? formatKg(latest.weightGrams) : formatKg(input.goal.startWeightGrams),
        weekTarget: formatKg(input.period.targetWeightGrams),
        weekDate: input.period.endDate,
      }),
    ].filter(Boolean).join('\n\n');
    const chart = await renderGoalChart({
      goal: input.goal,
      periods,
      weighIns,
      language: input.language,
      timezone: this.config.timezone,
    });

    const achievement = input.badgeWeek ? achievementForWeek(input.badgeWeek) : null;
    const achievementPath = achievement ? path.resolve(achievement.optimizedPath) : '';
    const extra = input.threadId ? { message_thread_id: input.threadId } : {};
    if (achievement && fs.existsSync(achievementPath)) {
      await this.bot.api.sendMediaGroup(input.chatId, [
        { type: 'photo', media: new InputFile(chart, 'progress.jpg'), caption, parse_mode: 'HTML' },
        {
          type: 'photo',
          media: new InputFile(achievementPath),
          caption: `🏅 <b>${achievement.title[input.language]}</b>`,
          parse_mode: 'HTML',
        },
      ], extra);
      this.store.markBadgeSent(input.period.id, now);
    } else {
      await this.bot.api.sendPhoto(input.chatId, new InputFile(chart, 'progress.jpg'), {
        caption,
        parse_mode: 'HTML',
        ...extra,
      });
    }
    this.store.markGraphicSent(input.telegramUserId, now);
    return 'sent';
  }

  async sendGoalPlan(input: {
    telegramUserId: string;
    chatId: string;
    threadId?: number;
    language: Language;
    goal: GoalRecord;
  }): Promise<'sent' | number> {
    const now = DateTime.utc().toISO()!;
    const wait = this.store.secondsUntilGraphicAllowed(
      input.telegramUserId,
      now,
      this.config.graphicCooldownSeconds,
    );
    if (wait > 0) return wait;

    const pages = await renderGoalPlanPages({
      goal: input.goal,
      periods: this.store.getPeriods(input.goal.id),
      language: input.language,
    });
    const extra = input.threadId ? { message_thread_id: input.threadId } : {};
    const caption = t(input.language, 'planReady');
    if (pages.length === 1) {
      await this.bot.api.sendPhoto(input.chatId, new InputFile(pages[0]!, 'weekly-roadmap.jpg'), {
        caption,
        ...extra,
      });
    } else {
      await this.bot.api.sendMediaGroup(input.chatId, pages.map((page, index) => ({
        type: 'photo' as const,
        media: new InputFile(page, `weekly-roadmap-${index + 1}.jpg`),
        ...(index === 0 ? { caption } : {}),
      })), extra);
    }
    this.store.markGraphicSent(input.telegramUserId, now);
    return 'sent';
  }

  async processOutbox(now: DateTime): Promise<void> {
    for (const job of this.store.dueOutbox(now.toUTC().toISO()!)) {
      try {
        const user = this.store.getUser(job.payload.telegramUserId);
        if (!user) {
          this.store.completeOutbox(job.id, now.toUTC().toISO()!);
          continue;
        }
        const thread = job.payload.threadId ? { message_thread_id: Number(job.payload.threadId) } : {};
        if (job.type === 'reminder') {
          await this.bot.api.sendMessage(job.payload.chatId, `${mention(user.telegramUserId, user.displayName)}, ${variant(
            job.payload.language, 'reminder', `${job.payload.goalId}:${job.payload.periodId}`, { target: job.payload.target },
          )}`, { parse_mode: 'HTML', ...thread });
        } else if (job.type === 'missed') {
          const suffix = job.payload.final
            ? `\n${t(job.payload.language, 'finalFailed')}`
            : '';
          await this.bot.api.sendMessage(job.payload.chatId, `${mention(user.telegramUserId, user.displayName)}, ${variant(
            job.payload.language, job.payload.hadSubmission ? 'fail' : 'missing', `${job.payload.goalId}:${job.payload.periodId}`,
          )}${suffix}`, { parse_mode: 'HTML', ...thread });
        } else if (job.type === 'graphics') {
          const goal = this.store.getGoal(job.payload.goalId);
          const period = goal ? this.store.getPeriods(goal.id).find((item) => item.id === job.payload.periodId) : null;
          if (goal && period) {
            const result = await this.sendStatus({
              telegramUserId: job.payload.telegramUserId,
              chatId: job.payload.chatId,
              ...(job.payload.threadId ? { threadId: Number(job.payload.threadId) } : {}),
              language: job.payload.language,
              goal,
              period,
              captionPrefix: job.payload.captionPrefix,
              ...(job.payload.badgeWeek ? { badgeWeek: job.payload.badgeWeek } : {}),
            });
            if (result !== 'sent') throw new Error(`GRAPHIC_COOLDOWN:${result}`);
          }
        } else if (job.type === 'goal-plan') {
          const goal = this.store.getGoal(job.payload.goalId);
          if (goal) {
            const result = await this.sendGoalPlan({
              telegramUserId: job.payload.telegramUserId,
              chatId: job.payload.chatId,
              ...(job.payload.threadId ? { threadId: Number(job.payload.threadId) } : {}),
              language: job.payload.language,
              goal,
            });
            if (result !== 'sent') throw new Error(`GRAPHIC_COOLDOWN:${result}`);
          }
        }
        this.store.completeOutbox(job.id, now.toUTC().toISO()!);
      } catch (error) {
        const seconds = Math.min(3600, 15 * 2 ** Math.min(job.attempts, 8));
        this.store.failOutbox(job.id, String(error), now.plus({ seconds }).toUTC().toISO()!);
      }
    }
  }

  languageKeyboard(userId: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('Русский 🇷🇺', `lang:ru:${userId}`)
      .text('English 🇬🇧', `lang:en:${userId}`)
      .text('中文 🇨🇳', `lang:zh:${userId}`);
  }
}
