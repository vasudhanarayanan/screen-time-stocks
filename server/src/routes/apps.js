import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/schema.js';

const router = Router();

// Add a new app to track
router.post('/', (req, res) => {
  const { user_id, ticker, display_name, daily_goal_minutes } = req.body;
  if (!user_id || !ticker || !display_name || !daily_goal_minutes) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const id = nanoid();
  try {
    db.prepare(
      `INSERT INTO apps (id, user_id, ticker, display_name, daily_goal_minutes) VALUES (?, ?, ?, ?, ?)`
    ).run(id, user_id, ticker.toUpperCase(), display_name, daily_goal_minutes);
    res.status(201).json({ id, user_id, ticker: ticker.toUpperCase(), display_name, daily_goal_minutes, current_price: 100 });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ticker already exists for this user' });
    }
    throw e;
  }
});

// Get all apps for a user
router.get('/user/:userId', (req, res) => {
  const apps = db.prepare(`SELECT * FROM apps WHERE user_id = ?`).all(req.params.userId);
  res.json(apps);
});

// Get app with price history
router.get('/:id/history', (req, res) => {
  const app = db.prepare(`SELECT * FROM apps WHERE id = ?`).get(req.params.id);
  if (!app) return res.status(404).json({ error: 'App not found' });

  const snapshots = db.prepare(
    `SELECT * FROM snapshots WHERE app_id = ? ORDER BY date ASC`
  ).all(req.params.id);

  res.json({ ...app, snapshots });
});

// Delete an app
router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM snapshots WHERE app_id = ?`).run(req.params.id);
  db.prepare(`DELETE FROM apps WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

export default router;
