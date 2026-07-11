import { randomBytes } from 'node:crypto';
import path from 'node:path';

export type Language = 'ru' | 'en' | 'zh';

export interface AppConfig {
  botToken: string;
  webhookSecret: string;
  publicBaseUrl: string;
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
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const language = process.env.DEFAULT_LANGUAGE ?? 'ru';
  if (language !== 'ru' && language !== 'en' && language !== 'zh') {
    throw new Error('DEFAULT_LANGUAGE must be ru, en, or zh');
  }

  const config: AppConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? randomBytes(24).toString('base64url'),
    publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
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
  };

  return { ...config, ...overrides };
}
