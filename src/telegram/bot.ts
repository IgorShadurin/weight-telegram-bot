import { DateTime } from 'luxon';
import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { isLanguage, type AppConfig, type Language } from '../config.js';
import { Store } from '../db/store.js';
import { buildPeriods, formatKg, typicalWeeklyLossGrams } from '../domain/periods.js';
import { parseLocalizedDate, parseWeightGrams } from '../domain/parsers.js';
import type { GoalDraft } from '../domain/types.js';
import { t, variant } from '../i18n/catalog.js';
import { TelegramService } from './service.js';

const NEW_GOAL = /(?:^|\s)\/goal(?:@\w+)?\b|\b(new\s+goal|replace\s+goal|нов(?:ая|ую)\s+цел|смен(?:ить|а)\s+цел|nueva\s+meta|cambiar\s+meta|nova\s+meta|trocar\s+meta|neues\s+ziel|ziel\s+ändern|nouvel\s+objectif|changer\s+(?:d['’])?objectif|target\s+baru|ganti\s+target)\b|新目标|更换目标|减重目标|新しい目標|目標変更/iu;
const STATUS = /(?:^|\s)(?:\/status(?:@\w+)?|status|progress|chart|goal\s+info|статус|прогресс|график|моя\s+цель|estado|progreso|gráfico|mi\s+meta|progresso|minha\s+meta|fortschritt|diagramm|mein\s+ziel|statut|progrès|graphique|mon\s+objectif|progres|grafik|target\s+saya)(?=$|\s|[,.!?])|状态|进度|图表|我的目标|進捗|グラフ|私の目標/iu;
const SCHEDULE = /(?:^|\s)(?:\/schedule(?:@\w+)?|schedule|roadmap|weekly\s+plan|checkpoints|план|расписание|маршрут|план\s+по\s+неделям|недельный\s+план|рубежи|calendario|ruta\s+semanal|plan\s+semanal|cronograma|rota\s+semanal|plano\s+semanal|wochenplan|fahrplan|zeitplan|calendrier|feuille\s+de\s+route|plan\s+hebdomadaire|jadwal|peta\s+jalan|rencana\s+mingguan)(?=$|\s|[,.!?])|计划表|每周计划|路线图|减重计划|スケジュール|ロードマップ|週間計画/iu;
const SETTINGS = /(?:^|\s)(?:\/settings(?:@\w+)?|settings|language|lang|настройки|язык|ajustes|idioma|configurações|einstellungen|sprache|paramètres|langue|pengaturan|bahasa)(?=$|\s|[,.!?])|设置|语言|設定|言語/iu;
const HELP = /(?:^|\s)(?:\/help(?:@\w+)?|help|commands|помощь|команды|что\s+ты\s+умеешь|ayuda|comandos|qué\s+puedes\s+hacer|ajuda|o\s+que\s+você\s+faz|hilfe|befehle|was\s+kannst\s+du|aide|commandes|que\s+peux-tu\s+faire|bantuan|perintah|apa\s+yang\s+bisa\s+kamu\s+lakukan)(?=$|\s|[,.!?])|帮助|命令|你会做什么|ヘルプ|コマンド|できること/iu;

function localized(language: Language, values: Record<Language, string>): string {
  return values[language];
}

function telegramLanguage(languageCode: string | undefined): Language | null {
  const primary = languageCode?.toLowerCase().split('-')[0];
  return isLanguage(primary) ? primary : null;
}

function docsUrl(config: AppConfig, language: Language): string {
  return `${config.docsBaseUrl}/${language}/`;
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

function commandAddressedToBot(text: string, username: string): boolean {
  const match = text.match(/^\/(?:goal|status|schedule|settings|help)(?:@([a-z0-9_]+))?(?=$|\s)/iu);
  return Boolean(match && (!match[1] || match[1].toLowerCase() === username.toLowerCase()));
}

function threadId(ctx: Context): number | undefined {
  return ctx.message?.message_thread_id;
}

function draftStage(draft: GoalDraft): NonNullable<GoalDraft['stage']> {
  if (draft.stage) return draft.stage;
  if (draft.initialWeightGrams === null) return 'await-start-photo';
  if (draft.targetWeightGrams === null) return 'await-target';
  if (draft.targetDate === null) return 'await-date';
  return 'confirm-goal';
}

function callbackMatchesDraft(ctx: Context, draft: GoalDraft, stage: NonNullable<GoalDraft['stage']>): boolean {
  return draftStage(draft) === stage && draft.promptMessageId === ctx.callbackQuery?.message?.message_id;
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

  function upsertContextUser(ctx: Context, defaultLanguage: Language, now: string) {
    const result = store.upsertUserWithStatus({
      telegramUserId: String(ctx.from!.id),
      username: ctx.from!.username ?? null,
      displayName: userName(ctx),
      defaultLanguage,
      now,
    });
    if (result.created) {
      const chatTitle = ctx.chat && 'title' in ctx.chat ? ctx.chat.title ?? null : null;
      service.enqueueNewUserNotifications({
        user: result.user,
        chatType: ctx.chat?.type ?? 'unknown',
        chatTitle,
        now,
      });
    }
    return result;
  }

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
    const { user } = upsertContextUser(ctx, config.defaultLanguage, now.toISO()!);

    if (action === 'lang' && isLanguage(value)) {
      store.setLanguage(userId, value, now.toISO()!);
      await ctx.answerCallbackQuery();
      if (ctx.chat?.type === 'private') {
        await ctx.editMessageText(`${t(value, 'languageSet')}\n\n${t(value, 'privateOnly', {
          bot: ctx.me.username,
          docs: docsUrl(config, value),
        })}`, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          reply_markup: service.languageKeyboard(userId),
        });
      } else {
        await ctx.editMessageText(t(value, 'languageSet'));
      }
      return;
    }

    if (action === 'goal' && value === 'cancel') {
      const draft = store.getDraft(userId, now.toISO()!);
      if (!draft || !callbackMatchesDraft(ctx, draft, 'confirm-goal')) {
        await ctx.answerCallbackQuery({ text: t(user.language, 'draftExpired') });
        return;
      }
      store.deleteDraft(userId);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(user.language, 'cancelled'));
      return;
    }

    if (action === 'goal' && value === 'keep') {
      const draft = store.getDraft(userId, now.toISO()!);
      if (!draft || !callbackMatchesDraft(ctx, draft, 'confirm-replace')) {
        await ctx.answerCallbackQuery({ text: t(user.language, 'draftExpired') });
        return;
      }
      store.deleteDraft(userId);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(user.language, 'cancelled'));
      return;
    }

    if (action === 'goal' && value === 'replace') {
      const draft = store.getDraft(userId, now.toISO()!);
      if (!draft || !callbackMatchesDraft(ctx, draft, 'confirm-replace')) {
        await ctx.answerCallbackQuery({ text: t(user.language, 'draftExpired') });
        return;
      }
      const activeGoal = store.getActiveGoal(userId);
      if (!activeGoal) {
        store.deleteDraft(userId);
        await ctx.answerCallbackQuery({ text: t(user.language, 'noGoal') });
        await ctx.editMessageText(t(user.language, 'noGoal'));
        return;
      }
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t(user.language, 'replacementApproved'));
      const callbackThreadId = ctx.callbackQuery.message?.message_thread_id;
      const prompt = await ctx.reply(t(user.language, 'replacementPhotoPrompt', { bot: ctx.me.username }), {
        parse_mode: 'HTML',
        ...(callbackThreadId !== undefined ? { message_thread_id: callbackThreadId } : {}),
        reply_markup: {
          force_reply: true,
          selective: true,
          input_field_placeholder: localized(user.language, {
            ru: '93.25 кг', en: '93.25 kg', zh: '93.25 公斤', es: '93,25 kg', pt: '93,25 kg',
            de: '93,25 kg', fr: '93,25 kg', ja: '93.25 kg', id: '93,25 kg',
          }),
        },
      });
      draft.stage = 'await-start-photo';
      draft.promptMessageId = prompt.message_id;
      draft.expiresAt = now.plus({ minutes: 20 }).toISO()!;
      store.saveDraft(draft);
      return;
    }

    if (action === 'goal' && value === 'confirm') {
      const draft = store.getDraft(userId, now.toISO()!);
      if (
        !draft || !callbackMatchesDraft(ctx, draft, 'confirm-goal') || !draft.initialWeightGrams ||
        !draft.initialPhotoUniqueId || !draft.targetWeightGrams || !draft.targetDate
      ) {
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
      const language = store.getUser(userId)?.language ?? telegramLanguage(ctx.from.language_code) ?? config.defaultLanguage;
      const { user } = upsertContextUser(ctx, language, now.toISO()!);
      if (SETTINGS.test(text)) {
        await ctx.reply(t(user.language, 'privateOnly', {
          bot: ctx.me.username,
          docs: docsUrl(config, user.language),
        }), {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          reply_markup: service.languageKeyboard(userId),
        });
        return;
      }
      if (HELP.test(text)) {
        await ctx.reply(t(user.language, 'help'), { parse_mode: 'HTML' });
        return;
      }

      const activeGoal = store.getActiveGoal(userId);
      if (SCHEDULE.test(text)) {
        if (!activeGoal) {
          await ctx.reply(t(user.language, 'noGoal'));
          return;
        }
        store.normalizeActiveGoalPeriods(config.timezone, activeGoal.id);
        const result = await service.sendGoalPlan({
          telegramUserId: userId,
          chatId: String(ctx.chat.id),
          language: user.language,
          goal: activeGoal,
        });
        if (result !== 'sent') {
          await ctx.reply(t(user.language, 'planCooldown', { seconds: result }));
        }
        return;
      }
      if (STATUS.test(text)) {
        if (!activeGoal) {
          await ctx.reply(t(user.language, 'noGoal'));
          return;
        }
        const localDate = now.setZone(config.timezone).toISODate()!;
        const period = store.getPeriod(activeGoal.id, localDate) ?? store.getPeriods(activeGoal.id).at(-1)!;
        const result = await service.sendStatus({
          telegramUserId: userId,
          chatId: String(ctx.chat.id),
          language: user.language,
          goal: activeGoal,
          period,
        });
        if (result !== 'sent') {
          await ctx.reply(`${service.goalStatusText({ language: user.language, goal: activeGoal, period })}\n\n${
            t(user.language, 'chartCooldown', { seconds: result })
          }`, { parse_mode: 'HTML' });
        }
        return;
      }
      await ctx.reply(t(user.language, 'privateOnly', {
        bot: ctx.me.username,
        docs: docsUrl(config, user.language),
      }), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: service.languageKeyboard(userId),
      });
      return;
    }

    const isMentioned = mentioned(text, ctx.me.username);
    const isAddressedCommand = commandAddressedToBot(text, ctx.me.username);
    const isReply = ctx.message.reply_to_message?.from?.id === ctx.me.id;
    if (!isMentioned && !isAddressedCommand && !isReply) return;

    const { user, created } = upsertContextUser(ctx, config.defaultLanguage, now.toISO()!);
    store.upsertChat(String(ctx.chat.id), ctx.chat.type, 'title' in ctx.chat ? ctx.chat.title ?? null : null, now.toISO()!);

    if (created) {
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
      await ctx.reply(t(user.language, 'help'), { parse_mode: 'HTML' });
      return;
    }

    const draft = store.getDraft(userId, now.toISO()!);
    const currentThreadId = threadId(ctx);
    const isDraftReply = Boolean(
      isReply && draft && draft.chatId === String(ctx.chat.id) &&
      draft.promptMessageId === ctx.message.reply_to_message?.message_id &&
      draft.threadId === (currentThreadId === undefined ? null : String(currentThreadId)),
    );
    if (isDraftReply && draft && draft.initialWeightGrams !== null) {
      if (draftStage(draft) === 'await-target') {
        const target = parseWeightGrams(text);
        if (!target || !draft.initialWeightGrams || target >= draft.initialWeightGrams) {
          await ctx.reply(t(user.language, 'badTarget'));
          return;
        }
        draft.targetWeightGrams = target;
        draft.stage = 'await-date';
        // A ForceReply is consumed after one answer. Editing the old prompt does not
        // reopen Telegram's reply composer, so every wizard input step needs a new message.
        const prompt = await ctx.reply(t(user.language, 'needDate', { weight: formatKg(target) }), {
          parse_mode: 'HTML',
          reply_markup: {
            force_reply: true,
            selective: true,
            input_field_placeholder: localized(user.language, {
              ru: '31 дек 2026', en: '31 Dec 2026', zh: '2026年12月31日', es: '31 dic 2026',
              pt: '31 dez 2026', de: '31. Dez 2026', fr: '31 déc 2026', ja: '2026年12月31日', id: '31 Des 2026',
            }),
          },
        });
        draft.promptMessageId = prompt.message_id;
        store.saveDraft(draft);
        return;
      }
      if (draftStage(draft) === 'await-date') {
        const targetWeightGrams = draft.targetWeightGrams;
        if (targetWeightGrams === null) {
          store.deleteDraft(userId);
          await ctx.reply(t(user.language, 'draftExpired'));
          return;
        }
        const targetDate = parseLocalizedDate(text, config.timezone);
        const startDate = now.setZone(config.timezone).toISODate()!;
        if (!targetDate || targetDate <= startDate) {
          await ctx.reply(t(user.language, 'badDate'), { parse_mode: 'HTML' });
          return;
        }
        let periods: ReturnType<typeof buildPeriods>;
        try {
          periods = buildPeriods({
            startDate,
            targetDate,
            startWeightGrams: draft.initialWeightGrams!,
            targetWeightGrams,
            timezone: config.timezone,
          });
        } catch {
          await ctx.reply(t(user.language, 'badDate'), { parse_mode: 'HTML' });
          return;
        }
        draft.targetDate = targetDate;
        draft.stage = 'confirm-goal';
        const replace = store.getActiveGoal(userId) ? t(user.language, 'replacing') : '';
        const keyboard = new InlineKeyboard()
          .text(localized(user.language, {
            ru: 'Создать ✅', en: 'Create ✅', zh: '就这么定 ✅', es: 'Crear ✅', pt: 'Criar ✅',
            de: 'Erstellen ✅', fr: 'Créer ✅', ja: '作成する ✅', id: 'Buat ✅',
          }), `goal:confirm:${userId}`)
          .text(localized(user.language, {
            ru: 'Отмена', en: 'Cancel', zh: '先不了', es: 'Cancelar', pt: 'Cancelar', de: 'Abbrechen',
            fr: 'Annuler', ja: 'キャンセル', id: 'Batal',
          }), `goal:cancel:${userId}`);
        draft.promptMessageId = await editOrReply(ctx, draft, t(user.language, 'confirmGoal', {
          replace,
          start: formatKg(draft.initialWeightGrams!),
          target: formatKg(targetWeightGrams),
          date: targetDate,
          periods: periods.length,
          grams: typicalWeeklyLossGrams(draft.initialWeightGrams!, periods),
        }), keyboard);
        store.saveDraft(draft);
        return;
      }
    }

    const activeGoal = store.getActiveGoal(userId);
    if (activeGoal && NEW_GOAL.test(text)) {
      store.deleteDraft(userId);
      const keyboard = new InlineKeyboard()
        .text(localized(user.language, {
          ru: 'Да, заменить', en: 'Yes, replace', zh: '确认更换', es: 'Sí, sustituir', pt: 'Sim, trocar',
          de: 'Ja, ersetzen', fr: 'Oui, remplacer', ja: 'はい、変更する', id: 'Ya, ganti',
        }), `goal:replace:${userId}`)
        .text(localized(user.language, {
          ru: 'Нет', en: 'No', zh: '保留当前', es: 'No', pt: 'Não', de: 'Nein', fr: 'Non', ja: 'いいえ', id: 'Tidak',
        }), `goal:keep:${userId}`);
      const question = await ctx.reply(t(user.language, 'confirmReplaceGoal'), { reply_markup: keyboard });
      store.saveDraft({
        telegramUserId: userId,
        intent: 'replace',
        stage: 'confirm-replace',
        chatId: String(ctx.chat.id),
        threadId: currentThreadId === undefined ? null : String(currentThreadId),
        promptMessageId: question.message_id,
        initialWeightGrams: null,
        initialPhotoUniqueId: null,
        targetWeightGrams: null,
        targetDate: null,
        expiresAt: now.plus({ minutes: 20 }).toISO()!,
      });
      return;
    }
    if (SCHEDULE.test(text)) {
      if (!activeGoal) {
        await ctx.reply(t(user.language, 'noGoal'));
        return;
      }
      store.normalizeActiveGoalPeriods(config.timezone, activeGoal.id);
      const result = await service.sendGoalPlan({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        ...(currentThreadId !== undefined ? { threadId: currentThreadId } : {}),
        language: user.language,
        goal: activeGoal,
      });
      if (result !== 'sent') {
        await ctx.reply(t(user.language, 'planCooldown', { seconds: result }));
      }
      return;
    }
    if (STATUS.test(text)) {
      if (!activeGoal) {
        await ctx.reply(t(user.language, 'noGoal'));
        return;
      }
      const localDate = now.setZone(config.timezone).toISODate()!;
      const period = store.getPeriod(activeGoal.id, localDate) ?? store.getPeriods(activeGoal.id).at(-1)!;
      const result = await service.sendStatus({
        telegramUserId: userId,
        chatId: String(ctx.chat.id),
        ...(currentThreadId !== undefined ? { threadId: currentThreadId } : {}),
        language: user.language,
        goal: activeGoal,
        period,
      });
      if (result !== 'sent') {
        await ctx.reply(`${service.goalStatusText({ language: user.language, goal: activeGoal, period })}\n\n${
          t(user.language, 'chartCooldown', { seconds: result })
        }`, { parse_mode: 'HTML' });
      }
      return;
    }

    const photo = ctx.message.photo?.at(-1);
    const isReplacementPhoto = Boolean(
      activeGoal && draft?.intent === 'replace' && draftStage(draft) === 'await-start-photo' &&
      draft.chatId === String(ctx.chat.id) &&
      draft.threadId === (currentThreadId === undefined ? null : String(currentThreadId)) &&
      (isMentioned || isDraftReply),
    );
    if (!photo || (!isMentioned && !isAddressedCommand && !isReplacementPhoto)) {
      await ctx.reply(t(user.language, 'needPhotoWeight', { bot: ctx.me.username }), { parse_mode: 'HTML' });
      return;
    }
    const weight = parseWeightGrams(text.replace(new RegExp(`@${ctx.me.username}`, 'igu'), ''));
    if (!weight) {
      await ctx.reply(t(user.language, 'needPhotoWeight', { bot: ctx.me.username }), { parse_mode: 'HTML' });
      return;
    }

    if (!activeGoal || isReplacementPhoto) {
      const expiresAt = now.plus({ minutes: 20 }).toISO()!;
      const message = await ctx.reply(t(user.language, 'needTarget', { weight: formatKg(weight) }), {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
          selective: true,
          input_field_placeholder: localized(user.language, {
            ru: '80 кг', en: '80 kg', zh: '80 公斤', es: '80 kg', pt: '80 kg', de: '80 kg',
            fr: '80 kg', ja: '80 kg', id: '80 kg',
          }),
        },
      });
      store.saveDraft({
        telegramUserId: userId,
        intent: activeGoal ? 'replace' : 'create',
        stage: 'await-target',
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
