import { DateTime } from 'luxon';
import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import type { AppConfig, Language } from '../config.js';
import { Store } from '../db/store.js';
import { buildPeriods, formatKg } from '../domain/periods.js';
import { parseLocalizedDate, parseWeightGrams } from '../domain/parsers.js';
import type { GoalDraft } from '../domain/types.js';
import { t, variant } from '../i18n/catalog.js';
import { TelegramService } from './service.js';

const NEW_GOAL = /(?:^|\s)\/goal(?:@\w+)?\b|\b(new\s+goal|replace\s+goal|нов(?:ая|ую)\s+цел|смен(?:ить|а)\s+цел)|新目标|更换目标|减重目标/iu;
const STATUS = /\b(status|progress|chart|goal\s+info|статус|прогресс|график|моя\s+цель)\b|状态|进度|图表|我的目标/iu;
const SETTINGS = /\b(settings|language|lang|настройки|язык)\b|设置|语言/iu;
const HELP = /\b(help|помощь|что\s+ты\s+умеешь)\b|帮助|你会做什么/iu;

function localized(language: Language, values: Record<Language, string>): string {
  return values[language];
}

function userName(ctx: Context): string {
  const user = ctx.from!;
  return [user.first_name, user.last_name].filter(Boolean).join(' ');
}

function messageText(ctx: Context): string {
  return ctx.message?.text ?? ctx.message?.caption ?? '';
}

function mentioned(text: string, username: string): boolean {
  return new RegExp(`(^|\\s)@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s|[,.!?])`, 'iu').test(text);
}

function threadId(ctx: Context): number | undefined {
  return ctx.message?.message_thread_id;
}

async function editOrReply(ctx: Context, draft: GoalDraft, text: string, markup: any): Promise<number> {
  if (draft.promptMessageId) {
    try {
      await ctx.api.editMessageText(draft.chatId, draft.promptMessageId, text, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
      return draft.promptMessageId;
    } catch {
      // The original prompt may be too old or unchanged; send a fresh prompt below.
    }
  }
  const result = await ctx.reply(text, { parse_mode: 'HTML', reply_markup: markup });
  return result.message_id;
}

export function configureBot(service: TelegramService, store: Store, config: AppConfig): void {
  const bot = service.bot;

  bot.use(async (ctx, next) => {
    const now = DateTime.utc().toISO()!;
    if (!store.claimUpdate(ctx.update.update_id, now)) return;
    await next();
  });

  bot.on('callback_query:data', async (ctx) => {
    const [action, value, expectedUserId] = ctx.callbackQuery.data.split(':');
    const userId = String(ctx.from.id);
    if (expectedUserId !== userId) {
      const language = store.getUser(userId)?.language ?? config.defaultLanguage;
      await ctx.answerCallbackQuery({ text: t(language, 'wrongButtonOwner') });
      return;
    }
    const now = DateTime.utc();
    const user = store.upsertUser({
      telegramUserId: userId,
      username: ctx.from.username ?? null,
      displayName: userName(ctx),
      defaultLanguage: config.defaultLanguage,
      now: now.toISO()!,
    });

    if (action === 'lang' && (value === 'ru' || value === 'en' || value === 'zh')) {
      store.setLanguage(userId, value, now.toISO()!);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(value, 'languageSet'));
      return;
    }

    if (action === 'goal' && value === 'cancel') {
      store.deleteDraft(userId);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(user.language, 'cancelled'));
      return;
    }

    if (action === 'goal' && value === 'confirm') {
      const draft = store.getDraft(userId, now.toISO()!);
      if (!draft?.initialWeightGrams || !draft.initialPhotoUniqueId || !draft.targetWeightGrams || !draft.targetDate) {
        await ctx.answerCallbackQuery({ text: t(user.language, 'draftExpired') });
        return;
      }
      const startDate = now.setZone(config.timezone).toISODate()!;
      const goal = store.createGoal({
        telegramUserId: userId,
        chatId: draft.chatId,
        threadId: draft.threadId,
        startDate,
        startWeightGrams: draft.initialWeightGrams,
        targetWeightGrams: draft.targetWeightGrams,
        targetDate: draft.targetDate,
        initialPhotoUniqueId: draft.initialPhotoUniqueId,
        now: now.toISO()!,
        timezone: config.timezone,
      });
      store.deleteDraft(userId);
      const first = store.getPeriods(goal.id)[0]!;
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(user.language, 'goalCreated', {
        target: formatKg(first.targetWeightGrams), date: first.endDate,
      }), { parse_mode: 'HTML' });
      const plan = await service.sendGoalPlan({
        telegramUserId: userId,
        chatId: goal.originChatId,
        ...(goal.originThreadId ? { threadId: Number(goal.originThreadId) } : {}),
        language: user.language,
        goal,
      });
      if (plan !== 'sent') {
        store.enqueue({
          dedupeKey: `goal-plan:${goal.id}`,
          type: 'goal-plan',
          payload: {
            telegramUserId: userId,
            chatId: goal.originChatId,
            threadId: goal.originThreadId,
            language: user.language,
            goalId: goal.id,
          },
          dueAt: now.plus({ seconds: plan }).toISO()!,
          now: now.toISO()!,
        });
      }
    }
  });

  bot.on('message', async (ctx) => {
    if (!ctx.from) return;
    const now = DateTime.utc();
    const userId = String(ctx.from.id);
    const text = messageText(ctx);

    if (ctx.chat.type === 'private') {
      await ctx.reply(t(config.defaultLanguage, 'privateOnly', { bot: ctx.me.username }));
      return;
    }

    const isMentioned = mentioned(text, ctx.me.username);
    const isReply = ctx.message.reply_to_message?.from?.id === ctx.me.id;
    if (!isMentioned && !isReply) return;

    const wasKnown = store.getUser(userId) !== null;
    const user = store.upsertUser({
      telegramUserId: userId,
      username: ctx.from.username ?? null,
      displayName: userName(ctx),
      defaultLanguage: config.defaultLanguage,
      now: now.toISO()!,
    });
    store.upsertChat(String(ctx.chat.id), ctx.chat.type, 'title' in ctx.chat ? ctx.chat.title ?? null : null, now.toISO()!);

    if (!wasKnown) {
      await ctx.reply(t(user.language, 'welcome', { bot: ctx.me.username }), {
        reply_markup: service.languageKeyboard(userId),
      });
    }

    if (SETTINGS.test(text)) {
      await ctx.reply(t(user.language, 'welcome', { bot: ctx.me.username }), {
        reply_markup: service.languageKeyboard(userId),
      });
      return;
    }
    if (HELP.test(text)) {
      await ctx.reply(t(user.language, 'help'));
      return;
    }

    const draft = store.getDraft(userId, now.toISO()!);
    if (isReply && draft) {
      if (draft.targetWeightGrams === null) {
        const target = parseWeightGrams(text);
        if (!target || !draft.initialWeightGrams || target >= draft.initialWeightGrams) {
          await ctx.reply(t(user.language, 'badTarget'));
          return;
        }
        draft.targetWeightGrams = target;
        // A ForceReply is consumed after one answer. Editing the old prompt does not
        // reopen Telegram's reply composer, so every wizard input step needs a new message.
        const prompt = await ctx.reply(t(user.language, 'needDate', { weight: formatKg(target) }), {
          parse_mode: 'HTML',
          reply_markup: {
            force_reply: true,
            selective: true,
            input_field_placeholder: localized(user.language, { ru: '31 дек 2026', en: '31 Dec 2026', zh: '2026年12月31日' }),
          },
        });
        draft.promptMessageId = prompt.message_id;
        store.saveDraft(draft);
        return;
      }
      if (draft.targetDate === null) {
        const targetDate = parseLocalizedDate(text, config.timezone);
        const startDate = now.setZone(config.timezone).toISODate()!;
        if (!targetDate || targetDate <= startDate) {
          await ctx.reply(t(user.language, 'badDate'), { parse_mode: 'HTML' });
          return;
        }
        let periodCount: number;
        try {
          periodCount = buildPeriods({
            startDate,
            targetDate,
            startWeightGrams: draft.initialWeightGrams!,
            targetWeightGrams: draft.targetWeightGrams,
            timezone: config.timezone,
          }).length;
        } catch {
          await ctx.reply(t(user.language, 'badDate'), { parse_mode: 'HTML' });
          return;
        }
        draft.targetDate = targetDate;
        const replace = store.getActiveGoal(userId) ? t(user.language, 'replacing') : '';
        const keyboard = new InlineKeyboard()
          .text(localized(user.language, { ru: 'Создать ✅', en: 'Create ✅', zh: '创建 ✅' }), `goal:confirm:${userId}`)
          .text(localized(user.language, { ru: 'Отмена', en: 'Cancel', zh: '取消' }), `goal:cancel:${userId}`);
        draft.promptMessageId = await editOrReply(ctx, draft, t(user.language, 'confirmGoal', {
          replace,
          start: formatKg(draft.initialWeightGrams!),
          target: formatKg(draft.targetWeightGrams),
          date: targetDate,
          periods: periodCount,
        }), keyboard);
        store.saveDraft(draft);
        return;
      }
    }

    const activeGoal = store.getActiveGoal(userId);
    if (STATUS.test(text)) {
      if (!activeGoal) {
        await ctx.reply(t(user.language, 'noGoal'));
        return;
      }
      const localDate = now.setZone(config.timezone).toISODate()!;
      const period = store.getPeriod(activeGoal.id, localDate) ?? store.getPeriods(activeGoal.id).at(-1)!;
      const currentThreadId = threadId(ctx);
      const result = await service.sendStatus({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        ...(currentThreadId !== undefined ? { threadId: currentThreadId } : {}),
        language: user.language,
        goal: activeGoal,
        period,
      });
      if (result !== 'sent') await ctx.reply(t(user.language, 'cooldown', { seconds: result }));
      return;
    }

    const photo = ctx.message.photo?.at(-1);
    if (!photo || !isMentioned) {
      await ctx.reply(t(user.language, 'needPhotoWeight', { bot: ctx.me.username }), { parse_mode: 'HTML' });
      return;
    }
    const weight = parseWeightGrams(text.replace(new RegExp(`@${ctx.me.username}`, 'igu'), ''));
    if (!weight) {
      await ctx.reply(t(user.language, 'needPhotoWeight', { bot: ctx.me.username }), { parse_mode: 'HTML' });
      return;
    }

    if (!activeGoal || NEW_GOAL.test(text)) {
      const expiresAt = now.plus({ minutes: 20 }).toISO()!;
      const message = await ctx.reply(t(user.language, 'needTarget', { weight: formatKg(weight) }), {
        parse_mode: 'HTML',
        reply_markup: { force_reply: true, selective: true, input_field_placeholder: localized(user.language, { ru: '80 кг', en: '80 kg', zh: '80 公斤' }) },
      });
      store.saveDraft({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        threadId: threadId(ctx) ? String(threadId(ctx)) : null,
        promptMessageId: message.message_id,
        initialWeightGrams: weight,
        initialPhotoUniqueId: photo.file_unique_id,
        targetWeightGrams: null,
        targetDate: null,
        expiresAt,
      });
      return;
    }

    try {
      const localDate = now.setZone(config.timezone).toISODate()!;
      const result = store.recordCheckIn({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        localDate,
        weightGrams: weight,
        photoUniqueId: photo.file_unique_id,
        now: now.toISO()!,
      });
      const prefix = result.goalAchieved
        ? t(user.language, 'finalAchieved')
        : variant(user.language, result.justPassed ? 'success' : 'fail', `${result.goal.id}:${result.weighIn.id}`);
      const badgeWeek = result.justPassed && result.period.periodIndex <= 53 ? result.period.periodIndex : undefined;
      const currentThreadId = threadId(ctx);
      const graphic = await service.sendStatus({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        ...(currentThreadId !== undefined ? { threadId: currentThreadId } : {}),
        language: user.language,
        goal: result.goal,
        period: result.period,
        captionPrefix: prefix,
        ...(badgeWeek ? { badgeWeek } : {}),
      });
      if (graphic !== 'sent') {
        const dueAt = now.plus({ seconds: graphic }).toISO()!;
        store.enqueue({
          dedupeKey: `graphics:${result.weighIn.id}`,
          type: 'graphics',
          payload: {
            telegramUserId: userId,
            chatId: String(ctx.chat.id),
            threadId: threadId(ctx) ?? null,
            language: user.language,
            goalId: result.goal.id,
            periodId: result.period.id,
            captionPrefix: prefix,
            badgeWeek: badgeWeek ?? null,
          },
          dueAt,
          now: now.toISO()!,
        });
        await ctx.reply(`${prefix}\n\n${t(user.language, 'cooldown', { seconds: graphic })}`);
      }
    } catch (error) {
      if (String(error).includes('DUPLICATE_PHOTO')) {
        await ctx.reply(t(user.language, 'duplicatePhoto'));
      } else if (String(error).includes('NO_ACTIVE_GOAL')) {
        await ctx.reply(t(user.language, 'noGoal'));
      } else {
        throw error;
      }
    }
  });
}
