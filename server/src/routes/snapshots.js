import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/schema.js';

const router = Router();

const VOLATILITY = 0.15;
const MAX_SWING = 0.30;

function calculatePrice(prevPrice, goalMinutes, actualMinutes) {
  const ratio = goalMinutes / actualMinutes;
  const rawChange = (ratio - 1) * VOLATILITY * 3;
  const pctChange = Math.max(-MAX_SWING, Math.min(MAX_SWING, rawChange));
  const newPrice = Math.max(1, prevPrice * (1 + pctChange));
  return { newPrice, pctChange: pctChange * 100 };
}

// Log screen time for an app (this is the core action)
router.post('/', (req, res) => {
  const { app_id, date, actual_minutes } = req.body;
  if (!app_id || !date || actual_minutes == null) {
    return res.status(400).json({ error: 'app_id, date, and actual_minutes required' });
  }

  const app = db.prepare(`SELECT * FROM apps WHERE id = ?`).get(app_id);
  if (!app) return res.status(404).json({ error: 'App not found' });

  // Check for existing snapshot on this date
  const existing = db.prepare(
    `SELECT * FROM snapshots WHERE app_id = ? AND date = ?`
  ).get(app_id, date);
  if (existing) {
    return res.status(409).json({ error: 'Snapshot already exists for this date' });
  }

  // Get previous price
  const prev = db.prepare(
    `SELECT price FROM snapshots WHERE app_id = ? ORDER BY date DESC LIMIT 1`
  ).get(app_id);
  const prevPrice = prev ? prev.price : app.current_price;

  const { newPrice, pctChange } = calculatePrice(prevPrice, app.daily_goal_minutes, actual_minutes);

  const id = nanoid();
  db.prepare(
    `INSERT INTO snapshots (id, app_id, date, actual_minutes, price, pct_change) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, app_id, date, actual_minutes, newPrice, pctChange);

  db.prepare(`UPDATE apps SET current_price = ? WHERE id = ?`).run(newPrice, app_id);

  res.status(201).json({ id, app_id, date, actual_minutes, price: newPrice, pct_change: pctChange });
});

// Batch log: log multiple apps at once for a given date
router.post('/batch', (req, res) => {
  const { user_id, date, entries } = req.body;
  if (!user_id || !date || !entries || !entries.length) {
    return res.status(400).json({ error: 'user_id, date, and entries[] required' });
  }

  const results = [];
  const insertSnapshot = db.prepare(
    `INSERT INTO snapshots (id, app_id, date, actual_minutes, price, pct_change) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const updatePrice = db.prepare(`UPDATE apps SET current_price = ? WHERE id = ?`);

  const transaction = db.transaction(() => {
    for (const entry of entries) {
      const app = db.prepare(`SELECT * FROM apps WHERE id = ? AND user_id = ?`).get(entry.app_id, user_id);
      if (!app) continue;

      const existing = db.prepare(
        `SELECT * FROM snapshots WHERE app_id = ? AND date = ?`
      ).get(entry.app_id, date);
      if (existing) continue;

      const prev = db.prepare(
        `SELECT price FROM snapshots WHERE app_id = ? ORDER BY date DESC LIMIT 1`
      ).get(entry.app_id);
      const prevPrice = prev ? prev.price : app.current_price;

      const { newPrice, pctChange } = calculatePrice(prevPrice, app.daily_goal_minutes, entry.actual_minutes);

      const id = nanoid();
      insertSnapshot.run(id, entry.app_id, date, entry.actual_minutes, newPrice, pctChange);
      updatePrice.run(newPrice, entry.app_id);

      results.push({ id, app_id: entry.app_id, ticker: app.ticker, price: newPrice, pct_change: pctChange });
    }
  });

  transaction();
  res.status(201).json(results);
});

// Get snapshots for a user on a date
router.get('/user/:userId/date/:date', (req, res) => {
  const snapshots = db.prepare(`
    SELECT s.*, a.ticker, a.display_name, a.daily_goal_minutes
    FROM snapshots s
    JOIN apps a ON a.id = s.app_id
    WHERE a.user_id = ? AND s.date = ?
    ORDER BY s.pct_change DESC
  `).all(req.params.userId, req.params.date);
  res.json(snapshots);
});

export default router;
