export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  telegram_user_id TEXT PRIMARY KEY,
  username TEXT,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('ru', 'en')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  chat_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL REFERENCES users(telegram_user_id),
  origin_chat_id TEXT NOT NULL REFERENCES chats(chat_id),
  origin_thread_id TEXT,
  start_date TEXT NOT NULL,
  start_weight_grams INTEGER NOT NULL,
  target_weight_grams INTEGER NOT NULL,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'achieved', 'failed', 'replaced')),
  replaced_by_goal_id TEXT REFERENCES goals(id),
  ended_at TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_goal_per_user
  ON goals(telegram_user_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS goal_periods (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  period_index INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  target_weight_grams INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'passed', 'missed')),
  passed_at TEXT,
  closed_at TEXT,
  badge_sent_at TEXT,
  UNIQUE(goal_id, period_index)
);

CREATE TABLE IF NOT EXISTS weigh_ins (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL REFERENCES goal_periods(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL REFERENCES users(telegram_user_id),
  chat_id TEXT NOT NULL REFERENCES chats(chat_id),
  weight_grams INTEGER NOT NULL,
  photo_unique_id TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE(telegram_user_id, photo_unique_id)
);

CREATE INDEX IF NOT EXISTS weigh_ins_goal_time ON weigh_ins(goal_id, submitted_at);

CREATE TABLE IF NOT EXISTS goal_drafts (
  telegram_user_id TEXT PRIMARY KEY REFERENCES users(telegram_user_id),
  payload_json TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_updates (
  update_id INTEGER PRIMARY KEY,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graphic_limits (
  telegram_user_id TEXT PRIMARY KEY REFERENCES users(telegram_user_id),
  last_sent_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  due_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  processed_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS outbox_due ON outbox(processed_at, due_at);
`;
