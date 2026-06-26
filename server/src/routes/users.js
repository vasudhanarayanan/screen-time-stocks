import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/schema.js';

const router = Router();

// Create user
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = nanoid();
  const invite_code = nanoid(8);
  db.prepare(`INSERT INTO users (id, name, invite_code) VALUES (?, ?, ?)`).run(id, name, invite_code);

  res.status(201).json({ id, name, invite_code });
});

// Get user profile with portfolio summary
router.get('/:id', (req, res) => {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const apps = db.prepare(`SELECT * FROM apps WHERE user_id = ?`).all(req.params.id);

  const portfolioValue = apps.reduce((sum, app) => sum + app.current_price, 0);
  const initialValue = apps.length * 100;
  const totalChange = initialValue > 0 ? ((portfolioValue - initialValue) / initialValue) * 100 : 0;

  res.json({ ...user, apps, portfolioValue, totalChange });
});

// List all users (for demo)
router.get('/', (_req, res) => {
  const users = db.prepare(`SELECT * FROM users`).all();
  res.json(users);
});

export default router;
