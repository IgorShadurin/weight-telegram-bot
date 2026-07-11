# Weight Goal Telegram Bot

A bilingual Russian/English Telegram group bot that turns a weight-loss goal into weekly checkpoints, progress charts, reminders, playful roasts, and a 53-week capybara achievement series.

Production URL: `https://weight-bot.copymyui.com`

## Behavior

- Works in group chats and reacts to a mention, a reply in an active wizard, or one of its buttons.
- Stores one active goal per Telegram user and preserves replaced/completed goal history.
- Requires each recorded weight to be attached to a new Telegram photo whose caption mentions the bot.
- Never downloads user photos; only Telegram's non-reusable `file_unique_id` is retained for duplicate detection.
- Calculates linearly interpolated checkpoints ending Sunday, with the final partial week ending on the exact goal date.
- Sends Thursday reminders only to users who have not passed the current checkpoint.
- Generates progress charts in memory and rate-limits graphic responses to one album per user per minute.
- Uses 53 fixed, original bitmap achievements. Goals longer than 53 periods continue without additional badges.

## Local development

Requirements: Node.js 22+ and npm.

```bash
cp .env.example .env
npm install
npm run dev
```

The bot token must come from BotFather. Never commit `.env`.

Useful checks:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run assets:validate
```

## Configuration

| Variable | Default | Purpose |
|---|---:|---|
| `TELEGRAM_BOT_TOKEN` | required | Rotated BotFather token |
| `TELEGRAM_WEBHOOK_SECRET` | required | Secret checked on every webhook request |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Public HTTPS origin in production |
| `DATABASE_PATH` | `./data/bot.sqlite` | SQLite file path |
| `DEFAULT_LANGUAGE` | `ru` | First-contact fallback (`ru` or `en`) |
| `APP_TIMEZONE` | `Europe/Minsk` | Calendar and reminder timezone |
| `REMINDER_WEEKDAY` | `4` | Luxon weekday (Thursday is 4) |
| `REMINDER_HOUR` | `10` | Local reminder hour |
| `REMINDER_MINUTE` | `0` | Local reminder minute |
| `GRAPHIC_COOLDOWN_SECONDS` | `60` | Per-user image cooldown |
| `PORT` | `3000` | HTTP port |

## Telegram setup

In BotFather:

1. Allow the bot to join groups.
2. Keep Group Privacy enabled. Mentioned commands, mentioned photo captions, and replies to the bot remain available.
3. Add the bot to the desired group.

The application sets its webhook and commands at startup when `PUBLIC_BASE_URL` uses HTTPS. Telegram calls:

```text
POST /telegram/webhook
X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>
```

Health checks use `GET /healthz`.

## Coolify deployment

- Build with the repository `Dockerfile` from `main`.
- Expose port `3000` and use `/healthz` as the health-check path.
- Mount persistent storage at `/app/data` and set `DATABASE_PATH=/app/data/bot.sqlite`.
- Configure the runtime environment variables above; do not expose secrets as build arguments.
- Run one replica because SQLite and the embedded durable scheduler are single-writer components.
- Enable automatic GitHub deployments. This installation uses Coolify's signed manual GitHub push webhook for the public repository.

## Achievement assets

Generated source PNG files live in `assets/achievements/originals`; Telegram-ready 1080×1350 JPEG files live in `assets/achievements/optimized`. The prompt manifest and progressive identity anchors are versioned with the project.

Regenerate derivative JPEGs and validate the collection with:

```bash
npm run assets:optimize
npm run assets:validate
npm run assets:contact-sheet
```

Achievement text is not rendered into the artwork. Exact localized names are sent as Telegram captions.

## Data and privacy

SQLite stores Telegram user/chat identifiers, language preference, goals, weekly periods, weights, non-reusable photo fingerprints, wizard state, deduplication IDs, rate-limit timestamps, and durable scheduled jobs. It does not store user photos or generated progress charts. Application logs intentionally omit message captions, weights, tokens, and photo fingerprints.

This bot is motivational software, not medical advice.
