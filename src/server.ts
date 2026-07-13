import { timingSafeEqual } from 'node:crypto';
import Fastify from 'fastify';
import type { AppConfig } from './config.js';
import { Store } from './db/store.js';
import { TelegramService } from './telegram/service.js';

function secretMatches(received: unknown, expected: string): boolean {
  if (typeof received !== 'string') return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

export function createServer(input: {
  config: AppConfig;
  store: Store;
  telegram: TelegramService;
}) {
  const server = Fastify({
    logger: {
      level: input.config.logLevel,
      redact: {
        paths: ['err.ctx', 'req.headers.x-telegram-bot-api-secret-token'],
        censor: '[Redacted]',
      },
    },
    bodyLimit: 2 * 1024 * 1024,
  });

  server.get('/healthz', async () => {
    input.store.db.prepare('SELECT 1').get();
    return { status: 'ok' };
  });

  server.post('/telegram/webhook', async (request, reply) => {
    const secret = request.headers['x-telegram-bot-api-secret-token'];
    if (!secretMatches(secret, input.config.webhookSecret)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const update = request.body as { update_id?: unknown };
    if (!update || !Number.isInteger(update.update_id)) {
      return reply.code(400).send({ error: 'invalid update' });
    }
    await input.telegram.bot.handleUpdate(update as any);
    return { ok: true };
  });

  return server;
}
