import { randomBytes } from 'node:crypto';
import path from 'node:path';

export const LANGUAGES = ['ru', 'en', 'zh', 'es', 'pt', 'de', 'fr', 'ja', 'id'] as const;
export type Language = typeof LANGUAGES[number];

export function isLanguage(value: string | undefined): value is Language {
  return LANGUAGES.includes(value as Language);
}

export interface AppConfig {
  botToken: string;
  webhookSecret: string;
  publicBaseUrl: string;
  docsBaseUrl: string;
  databasePath: string;
  defaultLanguage: Language;
  timezone: string;
  reminderWeekday: number;
  reminderHour: number;
  reminderMinute: number;
  port: number;
  host: string;
  logLevel: string;
  graphicCooldownSeconds: number;
  adminTelegramUserIds: string[];
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function httpUrl(name: string, fallback: string): string {
  const raw = process.env[name] ?? fallback;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function telegramUserIds(name: string): string[] {
  const values = (process.env[name] ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  for (const value of values) {
    if (!/^[1-9]\d{0,19}$/u.test(value)) {
      throw new Error(`${name} must contain comma-separated positive Telegram user IDs`);
    }
  }
  return [...new Set(values)];
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const language = process.env.DEFAULT_LANGUAGE ?? 'ru';
  if (!isLanguage(language)) {
    throw new Error(`DEFAULT_LANGUAGE must be one of: ${LANGUAGES.join(', ')}`);
  }

  const config: AppConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? randomBytes(24).toString('base64url'),
    publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
    docsBaseUrl: httpUrl('DOCS_BASE_URL', 'https://igorshadurin.github.io/weight-telegram-bot'),
    databasePath: path.resolve(process.env.DATABASE_PATH ?? './data/bot.sqlite'),
    defaultLanguage: language,
    timezone: process.env.APP_TIMEZONE ?? 'Europe/Minsk',
    reminderWeekday: integer('REMINDER_WEEKDAY', 4, 1, 7),
    reminderHour: integer('REMINDER_HOUR', 10, 0, 23),
    reminderMinute: integer('REMINDER_MINUTE', 0, 0, 59),
    port: integer('PORT', 3000, 1, 65_535),
    host: process.env.HOST ?? '0.0.0.0',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    graphicCooldownSeconds: integer('GRAPHIC_COOLDOWN_SECONDS', 60, 1, 3600),
    adminTelegramUserIds: telegramUserIds('ADMIN_TELEGRAM_USER_IDS'),
  };

  return { ...config, ...overrides };
}
