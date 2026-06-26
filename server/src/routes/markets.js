import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/schema.js';

const router = Router();

// Create a market (leaderboard group)
router.post('/', (req, res) => {
  const { name, user_id } = req.body;
  if (!name || !user_id) return res.status(400).json({ error: 'name and user_id required' });

  const id = nanoid();
  const invite_code = nanoid(8);

  db.prepare(`INSERT INTO markets (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)`).run(
    id, name, invite_code, user_id
  );
  db.prepare(`INSERT INTO market_members (market_id, user_id) VALUES (?, ?)`).run(id, user_id);

  res.status(201).json({ id, name, invite_code });
});

// Join a market via invite code
router.post('/join', (req, res) => {
  const { invite_code, user_id } = req.body;
  if (!invite_code || !user_id) return res.status(400).json({ error: 'invite_code and user_id required' });

  const market = db.prepare(`SELECT * FROM markets WHERE invite_code = ?`).get(invite_code);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  try {
    db.prepare(`INSERT INTO market_members (market_id, user_id) VALUES (?, ?)`).run(market.id, user_id);
  } catch (e) {
    if (e.message.includes('UNIQUE') || e.message.includes('PRIMARY')) {
      return res.status(409).json({ error: 'Already a member' });
    }
    throw e;
  }

  res.json({ market_id: market.id, name: market.name });
});

// Get market leaderboard
router.get('/:id', (req, res) => {
  const market = db.prepare(`SELECT * FROM markets WHERE id = ?`).get(req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar_url,
      COALESCE(SUM(a.current_price), 0) as portfolio_value,
      COUNT(a.id) as app_count
    FROM market_members mm
    JOIN users u ON u.id = mm.user_id
    LEFT JOIN apps a ON a.user_id = u.id
    WHERE mm.market_id = ?
    GROUP BY u.id
    ORDER BY portfolio_value DESC
  `).all(req.params.id);

  // Calculate initial value and % change for each member
  const leaderboard = members.map(m => ({
    ...m,
    initial_value: m.app_count * 100,
    total_change: m.app_count > 0
      ? ((m.portfolio_value - m.app_count * 100) / (m.app_count * 100)) * 100
      : 0,
  }));

  res.json({ ...market, leaderboard });
});

// Get markets for a user
router.get('/user/:userId', (req, res) => {
  const markets = db.prepare(`
    SELECT m.* FROM markets m
    JOIN market_members mm ON mm.market_id = m.id
    WHERE mm.user_id = ?
  `).all(req.params.userId);
  res.json(markets);
});

export default router;
