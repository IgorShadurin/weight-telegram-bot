import { loadEnvFile } from 'node:process';
import { DateTime } from 'luxon';
import type { LanguageCode } from '@grammyjs/types';
import { loadConfig, type Language } from './config.js';
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
store.normalizeActiveGoalPeriods(config.timezone);
const telegram = new TelegramService(config.botToken, store, config);
configureBot(telegram, store, config);
await telegram.bot.init();

const server = createServer({ config, store, telegram });
const scheduler = new Scheduler(store, config, (now: DateTime) => telegram.processOutbox(now));

const localizedCommands: Record<Language, Array<{ command: string; description: string }>> = {
  ru: [
    { command: 'goal', description: 'Создать или заменить цель по весу' }, { command: 'status', description: 'Цель и график прогресса' },
    { command: 'schedule', description: 'План по неделям' },
    { command: 'settings', description: 'Выбрать язык' }, { command: 'help', description: 'Как работает бот' },
  ],
  en: [
    { command: 'goal', description: 'Create or replace a weight goal' }, { command: 'status', description: 'Goal and progress chart' },
    { command: 'schedule', description: 'Weekly goal roadmap' },
    { command: 'settings', description: 'Choose a language' }, { command: 'help', description: 'How the bot works' },
  ],
  zh: [
    { command: 'goal', description: '立个新目标，或换掉当前目标' }, { command: 'status', description: '看看目标和体重曲线' },
    { command: 'schedule', description: '查看每周闯关地图' },
    { command: 'settings', description: '切换语言' }, { command: 'help', description: '看看我能帮你做什么' },
  ],
  es: [
    { command: 'goal', description: 'Crear o cambiar tu meta de peso' }, { command: 'status', description: 'Ver tu meta y la gráfica de progreso' },
    { command: 'schedule', description: 'Ver la ruta semana a semana' },
    { command: 'settings', description: 'Cambiar el idioma' }, { command: 'help', description: 'Ver cómo funciona el bot' },
  ],
  pt: [
    { command: 'goal', description: 'Criar ou trocar sua meta de peso' }, { command: 'status', description: 'Ver sua meta e o gráfico de progresso' },
    { command: 'schedule', description: 'Ver o caminho semana a semana' },
    { command: 'settings', description: 'Trocar o idioma' }, { command: 'help', description: 'Ver como o bot funciona' },
  ],
  de: [
    { command: 'goal', description: 'Gewichtsziel erstellen oder ändern' }, { command: 'status', description: 'Ziel und Fortschrittskurve anzeigen' },
    { command: 'schedule', description: 'Wochenfahrplan anzeigen' },
    { command: 'settings', description: 'Sprache wechseln' }, { command: 'help', description: 'So funktioniert der Bot' },
  ],
  fr: [
    { command: 'goal', description: 'Créer ou changer votre objectif de poids' }, { command: 'status', description: 'Voir votre objectif et votre courbe' },
    { command: 'schedule', description: 'Voir la feuille de route hebdomadaire' },
    { command: 'settings', description: 'Changer de langue' }, { command: 'help', description: 'Découvrir le fonctionnement du bot' },
  ],
  ja: [
    { command: 'goal', description: '体重目標を作成・変更' }, { command: 'status', description: '目標と進捗グラフを確認' },
    { command: 'schedule', description: '週ごとのロードマップを表示' },
    { command: 'settings', description: '言語を変更' }, { command: 'help', description: '使い方を見る' },
  ],
  id: [
    { command: 'goal', description: 'Buat atau ganti target berat badan' }, { command: 'status', description: 'Lihat target dan grafik progres' },
    { command: 'schedule', description: 'Lihat peta jalan mingguan' },
    { command: 'settings', description: 'Ganti bahasa' }, { command: 'help', description: 'Lihat cara kerja bot' },
  ],
};
await telegram.bot.api.setMyCommands(localizedCommands.en);
for (const [languageCode, commands] of Object.entries(localizedCommands)) {
  await telegram.bot.api.setMyCommands(commands, { language_code: languageCode as LanguageCode });
}

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
