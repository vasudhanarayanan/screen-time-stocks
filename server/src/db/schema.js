import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'data.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    api_key TEXT UNIQUE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    ticker TEXT NOT NULL,
    display_name TEXT NOT NULL,
    daily_goal_minutes INTEGER NOT NULL,
    current_price REAL DEFAULT 100.0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL REFERENCES apps(id),
    date TEXT NOT NULL,
    actual_minutes INTEGER NOT NULL,
    price REAL NOT NULL,
    pct_change REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(app_id, date)
  );

  CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_members (
    market_id TEXT NOT NULL REFERENCES markets(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    joined_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY(market_id, user_id)
  );
`);

export default db;
