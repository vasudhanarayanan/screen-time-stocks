import { nanoid } from 'nanoid';
import db from './schema.js';

const userId = nanoid();
const marketId = nanoid();

db.prepare(`INSERT INTO users (id, name, invite_code) VALUES (?, ?, ?)`).run(
  userId, 'Demo User', nanoid(8)
);

const apps = [
  { ticker: 'INSTA', name: 'Instagram', goal: 30 },
  { ticker: 'TKTOK', name: 'TikTok', goal: 20 },
  { ticker: 'REDDIT', name: 'Reddit', goal: 25 },
  { ticker: 'TWTR', name: 'Twitter/X', goal: 20 },
  { ticker: 'YTUBE', name: 'YouTube', goal: 45 },
];

const appIds = [];
for (const app of apps) {
  const appId = nanoid();
  appIds.push(appId);
  db.prepare(
    `INSERT INTO apps (id, user_id, ticker, display_name, daily_goal_minutes) VALUES (?, ?, ?, ?, ?)`
  ).run(appId, userId, app.ticker, app.name, app.goal);
}

// Generate 30 days of historical data
const today = new Date();
for (let i = 29; i >= 0; i--) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];

  for (let j = 0; j < appIds.length; j++) {
    const goal = apps[j].goal;
    // Random usage: sometimes over, sometimes under goal
    const variance = Math.random() * 0.8 - 0.3; // -0.3 to +0.5
    const actual = Math.max(1, Math.round(goal * (1 + variance)));

    const ratio = goal / actual;
    const volatility = 0.15;
    const pctChange = Math.max(-0.30, Math.min(0.30, (ratio - 1) * volatility * 3));

    // Get previous price
    const prev = db.prepare(
      `SELECT price FROM snapshots WHERE app_id = ? ORDER BY date DESC LIMIT 1`
    ).get(appIds[j]);
    const prevPrice = prev ? prev.price : 100;
    const newPrice = Math.max(1, prevPrice * (1 + pctChange));

    db.prepare(
      `INSERT INTO snapshots (id, app_id, date, actual_minutes, price, pct_change) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(nanoid(), appIds[j], dateStr, actual, newPrice, pctChange * 100);

    // Update current price on the app
    db.prepare(`UPDATE apps SET current_price = ? WHERE id = ?`).run(newPrice, appIds[j]);
  }
}

// Create a market
db.prepare(`INSERT INTO markets (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)`).run(
  marketId, 'Friend Group', nanoid(8), userId
);
db.prepare(`INSERT INTO market_members (market_id, user_id) VALUES (?, ?)`).run(marketId, userId);

console.log('Seeded database successfully!');
console.log(`User ID: ${userId}`);
console.log(`Market ID: ${marketId}`);
