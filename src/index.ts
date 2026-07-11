import { loadEnvFile } from 'node:process';
import { DateTime } from 'luxon';
import { loadConfig } from './config.js';
import { Store } from './db/store.js';
import { Scheduler } from './scheduler.js';
import { createServer } from './server.js';
import { configureBot } from './telegram/bot.js';
import { TelegramService } from './telegram/service.js';

try {
  loadEnvFile('.env');
} catch {
  // Coolify supplies runtime environment variables directly.
}

const config = loadConfig();
if (!config.botToken) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!process.env.TELEGRAM_WEBHOOK_SECRET) throw new Error('TELEGRAM_WEBHOOK_SECRET is required');

const store = new Store(config.databasePath);
const telegram = new TelegramService(config.botToken, store, config);
configureBot(telegram, store, config);
await telegram.bot.init();

const server = createServer({ config, store, telegram });
const scheduler = new Scheduler(store, config, (now: DateTime) => telegram.processOutbox(now));

const commands = [
  { command: 'goal', description: 'Create or replace a weight goal / Новая цель' },
  { command: 'status', description: 'Goal and progress chart / Цель и график' },
  { command: 'settings', description: 'Language / Язык' },
  { command: 'help', description: 'How the bot works / Помощь' },
] as const;
await telegram.bot.api.setMyCommands([...commands]);
await telegram.bot.api.setMyCommands([
  { command: 'goal', description: 'Создать или заменить цель по весу' },
  { command: 'status', description: 'Цель и график прогресса' },
  { command: 'settings', description: 'Выбрать язык' },
  { command: 'help', description: 'Как работает бот' },
], { language_code: 'ru' });
await telegram.bot.api.setMyCommands([
  { command: 'goal', description: 'Create or replace a weight goal' },
  { command: 'status', description: 'Goal and progress chart' },
  { command: 'settings', description: 'Choose a language' },
  { command: 'help', description: 'How the bot works' },
], { language_code: 'en' });
await telegram.bot.api.setMyCommands([
  { command: 'goal', description: '创建或替换减重目标' },
  { command: 'status', description: '查看目标和进度图表' },
  { command: 'settings', description: '选择语言' },
  { command: 'help', description: '了解机器人使用方法' },
], { language_code: 'zh' });

if (config.publicBaseUrl.startsWith('https://')) {
  await telegram.bot.api.setWebhook(`${config.publicBaseUrl}/telegram/webhook`, {
    secret_token: config.webhookSecret,
    allowed_updates: ['message', 'callback_query'],
  });
}

await server.listen({ port: config.port, host: config.host });
scheduler.start();

async function shutdown(signal: string): Promise<void> {
  server.log.info({ signal }, 'shutting down');
  scheduler.stop();
  await server.close();
  store.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
