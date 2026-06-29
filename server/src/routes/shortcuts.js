import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/schema.js';
import { authMiddleware } from '../auth.js';

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

/**
 * POST /api/shortcuts/log
 *
 * Designed for iOS Shortcuts — authenticate with API key in Authorization header.
 * Body: { entries: [{ app: "Instagram", minutes: 45 }], date?: "2024-01-15" }
 *
 * - Matches apps by display_name (case-insensitive)
 * - Auto-creates apps if they don't exist (with 30-min default goal)
 * - Returns updated prices
 */
router.post('/log', authMiddleware, (req, res) => {
  const { entries, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries[] required, each with app and minutes' });
  }

  const results = [];
  const insertSnapshot = db.prepare(
    'INSERT INTO snapshots (id, app_id, date, actual_minutes, price, pct_change) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updatePrice = db.prepare('UPDATE apps SET current_price = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    for (const entry of entries) {
      if (!entry.app || entry.minutes == null) continue;

      // Find or create app
      let app = db.prepare(
        'SELECT * FROM apps WHERE user_id = ? AND display_name = ? COLLATE NOCASE'
      ).get(req.user.id, entry.app);

      if (!app) {
        const ticker = entry.app.substring(0, 4).toUpperCase();
        const id = nanoid();
        const goal = entry.goal || 30;
        db.prepare(
          'INSERT OR IGNORE INTO apps (id, user_id, ticker, display_name, daily_goal_minutes) VALUES (?, ?, ?, ?, ?)'
        ).run(id, req.user.id, ticker, entry.app, goal);
        app = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
        if (!app) continue;
      }

      // Skip if already logged
      const existing = db.prepare(
        'SELECT * FROM snapshots WHERE app_id = ? AND date = ?'
      ).get(app.id, logDate);
      if (existing) {
        results.push({ app: app.display_name, ticker: app.ticker, skipped: true, price: existing.price });
        continue;
      }

      const prev = db.prepare(
        'SELECT price FROM snapshots WHERE app_id = ? ORDER BY date DESC LIMIT 1'
      ).get(app.id);
      const prevPrice = prev ? prev.price : app.current_price;

      const { newPrice, pctChange } = calculatePrice(prevPrice, app.daily_goal_minutes, entry.minutes);

      const id = nanoid();
      insertSnapshot.run(id, app.id, logDate, entry.minutes, newPrice, pctChange);
      updatePrice.run(newPrice, app.id);

      results.push({
        app: app.display_name,
        ticker: app.ticker,
        minutes: entry.minutes,
        goal: app.daily_goal_minutes,
        price: Number(newPrice.toFixed(2)),
        change: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`,
      });
    }
  });

  transaction();

  // Emit WebSocket event
  if (req.app.get('io')) {
    const io = req.app.get('io');
    const userMarkets = db.prepare(
      'SELECT market_id FROM market_members WHERE user_id = ?'
    ).all(req.user.id);
    for (const { market_id } of userMarkets) {
      io.to(`market:${market_id}`).emit('price-update', { user_id: req.user.id, results });
    }
  }

  res.json({ date: logDate, results });
});

/**
 * GET /api/shortcuts/status
 * Quick status check for iOS Shortcuts — returns portfolio value.
 */
router.get('/status', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM apps WHERE user_id = ?').all(req.user.id);
  const portfolioValue = apps.reduce((sum, app) => sum + app.current_price, 0);
  const appCount = apps.length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayLogs = db.prepare(`
    SELECT COUNT(*) as count FROM snapshots s
    JOIN apps a ON a.id = s.app_id
    WHERE a.user_id = ? AND s.date = ?
  `).get(req.user.id, todayDate);

  res.json({
    portfolio_value: Number(portfolioValue.toFixed(2)),
    apps_tracked: appCount,
    logged_today: todayLogs.count,
    remaining_today: appCount - todayLogs.count,
  });
});

export default router;
