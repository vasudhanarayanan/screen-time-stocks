// Shared helpers for integration tests: a clean app instance, a reset routine,
// and a factory for an authenticated user.
import { nanoid } from 'nanoid';
import { createApp } from '../src/index.js';
import db from '../src/db/schema.js';
import { signToken } from '../src/auth.js';

/** Build an app configured for tests (no static client serving). */
export function testApp() {
  return createApp({ serveClient: false });
}

/** Delete all rows so each test starts from a clean slate. */
export function resetDb() {
  db.prepare('DELETE FROM market_members').run();
  db.prepare('DELETE FROM markets').run();
  db.prepare('DELETE FROM snapshots').run();
  db.prepare('DELETE FROM apps').run();
  db.prepare('DELETE FROM users').run();
}

/**
 * Insert a user directly and return it along with a signed JWT and API key.
 * @param {object} [over] Field overrides (e.g. { name: 'Ada' }).
 */
export function createUser(over = {}) {
  const user = {
    id: nanoid(),
    name: 'Test User',
    email: `${nanoid(6)}@example.com`,
    api_key: `stk_${nanoid(32)}`,
    invite_code: nanoid(8),
    ...over,
  };
  db.prepare(
    'INSERT INTO users (id, name, email, api_key, invite_code) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, user.name, user.email, user.api_key, user.invite_code);
  return { user, token: signToken(user.id), apiKey: user.api_key };
}

/** Insert an app-stock for a user and return its row. */
export function createAppStock(userId, over = {}) {
  const row = {
    id: nanoid(),
    user_id: userId,
    ticker: 'INSTA',
    display_name: 'Instagram',
    daily_goal_minutes: 30,
    current_price: 100,
    ...over,
  };
  db.prepare(
    'INSERT INTO apps (id, user_id, ticker, display_name, daily_goal_minutes, current_price) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(row.id, row.user_id, row.ticker, row.display_name, row.daily_goal_minutes, row.current_price);
  return row;
}
